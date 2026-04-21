"""
Factory-GPT Backend — FastAPI
Handles:
  • /dashboard/upload  — CSV/Excel parsing via Pandas
  • /dashboard/chart   — NL-to-chart via Mistral LLM
  • /vision/ocr        — EasyOCR text extraction
  • /vision/analyze    — Image analysis via OpenRouter vision model
  • /vision/chat       — Follow-up chat about an analysed image

Requirements:
  pip install fastapi uvicorn python-multipart pandas openpyxl easyocr pillow httpx python-dotenv
"""

from __future__ import annotations

import asyncio
import io
import json
import os
import re
from typing import Any

import httpx
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="Factory-GPT API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory data store ─────────────────────────────────────────────────────
_current_df: pd.DataFrame | None = None

# ─── Mistral config (for dashboard/chart) ────────────────────────────────────
MISTRAL_URL   = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_KEY   = os.getenv("MISTRAL_API_KEY", "")
DEFAULT_MODEL = "mistral-small-latest"

# ─── OpenRouter config (for vision) ──────────────────────────────────────────
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
VISION_MODEL   = "google/gemma-3-27b-it:free"

# ─── Local Ollama toggle ──────────────────────────────────────────────────────
USE_LOCAL    = os.getenv("LOCAL_OLLAMA", "0") == "1"
OLLAMA_URL   = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

print(f"[Config] Mistral key loaded: {'YES' if MISTRAL_KEY else 'NO'}")
print(f"[Config] OpenRouter key loaded: {'YES' if OPENROUTER_KEY else 'NO'}")
print(f"[Config] Vision model: {VISION_MODEL}")


# ─── Mistral LLM call (text only — for charts) ───────────────────────────────
async def llm_call(
    messages: list[dict],
    api_key: str = "",
    model: str = DEFAULT_MODEL,
    json_mode: bool = False,
) -> str:
    """Call Mistral API and return text response."""

    if USE_LOCAL:
        payload: dict[str, Any] = {
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    key = api_key or MISTRAL_KEY
    if not key:
        raise HTTPException(
            status_code=400,
            detail="Mistral API key required. Add MISTRAL_API_KEY to backend .env"
        )

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 1500,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        for attempt in range(3):
            resp = await client.post(MISTRAL_URL, json=payload, headers=headers)
            print(f"[Mistral] status={resp.status_code}")
            if resp.status_code == 429:
                wait = 15 * (attempt + 1)
                print(f"[Mistral] Rate limited. Retrying in {wait}s...")
                await asyncio.sleep(wait)
                continue
            if not resp.is_success:
                print(f"[Mistral Error] {resp.text}")
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        resp.raise_for_status()


# ─── OpenRouter vision LLM call ──────────────────────────────────────────────
async def vision_llm_call(
    messages: list[dict],
    api_key: str = "",
) -> str:
    """Call OpenRouter vision model — supports image input."""
    key = api_key or OPENROUTER_KEY
    if not key:
        raise HTTPException(
            status_code=400,
            detail="OpenRouter API key required for vision. Add OPENROUTER_API_KEY to backend .env"
        )

    payload = {
        "model": VISION_MODEL,
        "messages": messages,
        "max_tokens": 1500,
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Factory-GPT",
    }

    async with httpx.AsyncClient(timeout=90) as client:
        for attempt in range(3):
            resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            print(f"[Vision/OpenRouter] status={resp.status_code}")
            if resp.status_code == 429:
                wait = 15 * (attempt + 1)
                print(f"[Vision] Rate limited. Retrying in {wait}s...")
                await asyncio.sleep(wait)
                continue
            if not resp.is_success:
                print(f"[Vision Error] {resp.text}")
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        resp.raise_for_status()


def _safe_json(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    return json.loads(text)


# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/dashboard/upload")
async def dashboard_upload(file: UploadFile = File(...)):
    """Parse CSV or Excel; return metadata only."""
    global _current_df

    content = await file.read()
    fname = file.filename or ""

    try:
        if fname.endswith((".xlsx", ".xls")):
            _current_df = pd.read_excel(io.BytesIO(content))
        else:
            _current_df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}")

    df           = _current_df
    dtypes       = {col: str(dtype) for col, dtype in df.dtypes.items()}
    numeric_cols = int(df.select_dtypes(include="number").shape[1])
    text_cols    = int(df.select_dtypes(include="object").shape[1])

    return {
        "rows":         int(len(df)),
        "columns":      int(len(df.columns)),
        "column_names": list(df.columns),
        "dtypes":       dtypes,
        "numeric_cols": numeric_cols,
        "text_cols":    text_cols,
    }


class ChartRequest(BaseModel):
    query: str
    meta: dict
    openrouter_key: str = ""  # kept for backwards compat, not used


@app.post("/dashboard/chart")
async def dashboard_chart(req: ChartRequest):
    """Convert a natural-language query into a Recharts-compatible JSON config."""
    global _current_df

    if _current_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Upload a file first.")

    df           = _current_df
    col_names    = list(df.columns)
    dtypes       = {col: str(dtype) for col, dtype in df.dtypes.items()}
    preview_rows = df.head(5).to_dict(orient="records")

    system = (
        "You are a data visualization assistant. "
        "Return ONLY valid JSON. Never invent numbers. "
        'If the chart cannot be built, return {"error": "Insufficient data to generate this specific insight."}'
    )

    user = f"""
Dataset columns: {col_names}
Data types: {dtypes}
First 5 rows:
{json.dumps(preview_rows, default=str)}

User query: "{req.query}"

Return ONLY this JSON:
{{
  "chart_config": {{
    "type": "pie" | "donut" | "bar" | "top-n-bar",
    "title": "...",
    "data": [{{"name": "...", "value": <number>}}, ...]
  }},
  "explanation": "one sentence explanation"
}}

If you cannot answer accurately: {{"error": "Insufficient data to generate this specific insight."}}
Raw JSON only, no markdown.
"""

    # Server-side aggregation for larger datasets
    groupby_hint = ""
    if len(df) > 5:
        query_lower = req.query.lower()
        cat_cols    = [c for c in col_names if df[c].dtype == object]
        num_cols    = [c for c in col_names if pd.api.types.is_numeric_dtype(df[c])]

        # ✅ FIXED: match cat col from query OR pick first cat col
        # match num col from query OR pick first numeric col
        matched_cat = next((c for c in cat_cols if c.lower() in query_lower), None)
        matched_num = next((c for c in num_cols if c.lower() in query_lower), None)

        # Fallback: if no match found in query, use first available columns
        if not matched_cat and cat_cols:
            matched_cat = cat_cols[0]
        if not matched_num and num_cols:
            matched_num = num_cols[0]

        if matched_cat and matched_num:
            agg = df.groupby(matched_cat)[matched_num].sum().reset_index()
            if "top" in query_lower:
                n_match = re.search(r"top\s*(\d+)", query_lower)
                n = int(n_match.group(1)) if n_match else 5
                agg = agg.nlargest(n, matched_num)
            groupby_hint = (
                f"\nPre-computed aggregation ({matched_cat} vs {matched_num}):\n"
                f"{agg.to_dict(orient='records')}"
            )

    if groupby_hint:
        user += f"\n{groupby_hint}\nUse this aggregation for the chart data values."

    try:
        raw    = await llm_call(
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user}
            ],
            model=DEFAULT_MODEL,
            json_mode=True,
        )
        result = _safe_json(raw)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# VISION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/vision/ocr")
async def vision_ocr(image: UploadFile = File(...), openrouter_key: str = Form("")):
    """Run EasyOCR on the uploaded image and return extracted text."""
    try:
        import easyocr
    except ImportError:
        raise HTTPException(status_code=500, detail="easyocr not installed. Run: pip install easyocr")

    content = await image.read()

    try:
        import numpy as np
        from PIL import Image as PILImage

        pil_img   = PILImage.open(io.BytesIO(content)).convert("RGB")
        img_array = np.array(pil_img)

        reader  = easyocr.Reader(["en"], gpu=False, verbose=False)
        results = reader.readtext(img_array)
        text    = " | ".join([r[1] for r in results if r[2] > 0.3])

        return {"text": text or "(No readable text found)", "word_count": len(text.split())}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}")


class VisionAnalyzeRequest(BaseModel):
    ocr_text: str
    image_b64: str
    image_mime: str = "image/png"
    openrouter_key: str = ""


@app.post("/vision/analyze")
async def vision_analyze(req: VisionAnalyzeRequest):
    """Analyse image visually using OpenRouter vision model."""

    combined_prompt = """You are an expert visual analyst. Look at this image carefully and provide a detailed analysis.

Return ONLY this exact JSON — no markdown, no extra text outside the JSON:
{
  "summary": "3-4 sentence detailed description — describe charts, numbers, labels, colors, layout",
  "trends": [
    "specific trend or pattern with details and numbers if visible",
    "another trend",
    "another observation"
  ],
  "anomalies": [
    "anything unusual, unexpected, or worth flagging",
    "another anomaly if present"
  ],
  "actions": [
    "specific insight or recommendation based on what you see",
    "another actionable insight"
  ]
}

Be specific — mention actual numbers, chart types, colors, labels you can see.
Raw JSON only. No markdown. No extra text outside the JSON."""

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{req.image_mime};base64,{req.image_b64}"
                    }
                },
                {"type": "text", "text": combined_prompt}
            ]
        }
    ]

    try:
        raw    = await vision_llm_call(
            messages=messages,
            api_key=req.openrouter_key or OPENROUTER_KEY,
        )
        result = _safe_json(raw)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class VisionChatRequest(BaseModel):
    question: str
    ocr_text: str
    image_b64: str
    image_mime: str = "image/png"
    history: list[dict] = []
    openrouter_key: str = ""


@app.post("/vision/chat")
async def vision_chat(req: VisionChatRequest):
    """Multi-turn follow-up chat about an analysed image."""

    system_text = (
        "You are a visual analyst. Answer questions about the image the user uploaded. "
        "Be specific, reference actual details visible in the image. Never invent information."
    )

    messages: list[dict] = []

    # First message — image + system instruction merged into user role (no system role)
    messages.append({
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {"url": f"data:{req.image_mime};base64,{req.image_b64}"},
            },
            {
                "type": "text",
                "text": f"{system_text}\n\nHere is the image. OCR text also found: {req.ocr_text}"
            },
        ],
    })
    messages.append({
        "role": "assistant",
        "content": "I can see the image clearly. What would you like to know?"
    })

    # Prior conversation turns
    for msg in req.history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Current question
    messages.append({"role": "user", "content": req.question})

    try:
        answer = await vision_llm_call(
            messages=messages,
            api_key=req.openrouter_key or OPENROUTER_KEY,
        )
        return {"answer": answer}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":           "ok",
        "chart_provider":   "Mistral",
        "chart_model":      DEFAULT_MODEL,
        "vision_provider":  "OpenRouter",
        "vision_model":     VISION_MODEL,
        "mistral_key":      "loaded" if MISTRAL_KEY else "MISSING",
        "openrouter_key":   "loaded" if OPENROUTER_KEY else "MISSING",
    }


# ─── Dev runner ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
# 🏭 Factory-GPT — Industrial AI Studio

<div align="center">

![Factory-GPT Banner](https://img.shields.io/badge/Factory--GPT-Industrial%20AI%20Studio-1988E1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A Nokia-branded, glassmorphism-styled AI platform for industrial intelligence.**  
Dashboard generation · Vision AI · AI-powered PPT creation — all in one shell.

[🚀 Quick Start](#-quick-start) · [🏗️ Architecture](#️-architecture) · [✨ Features](#-features) · [📦 Project Structure](#-project-structure) · [⚙️ Configuration](#️-configuration)

</div>

---

## ✨ Features

<table>
<tr>
<td width="33%" align="center">

### 📊 Dashboard Gen
Upload any **CSV or Excel** file and ask in plain English.  
Natural language → Beautiful Recharts visualizations.  
Pie · Donut · Bar · Top-N Bar charts.  
Live palette switcher · Showcase mode.

</td>
<td width="33%" align="center">

### 👁️ Vision AI
Drop any **dashboard screenshot**.  
EasyOCR extracts all text.  
Vision LLM analyses the image deeply —  
trends, anomalies, recommended actions.

</td>
<td width="33%" align="center">

### 📑 PPT Maker
Full **AI-powered slide generator**  
embedded seamlessly via iframe.  
Nokia-style templates · Custom tones  
Live Blank theme · Export-ready decks.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER  :5173                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Factory-GPT Shell                         │  │
│  │   Splash → Login → Sidebar Nav → Settings Drawer            │  │
│  │                                                              │  │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │  │
│  │  │  Dashboard Gen  │  │  Vision AI   │  │   PPT Maker    │ │  │
│  │  │                 │  │              │  │                │ │  │
│  │  │  CSV/Excel      │  │  Image Drop  │  │  <iframe>      │ │  │
│  │  │  Upload         │  │  ┌────────┐  │  │  :5174         │ │  │
│  │  │  ┌──────────┐   │  │  │EasyOCR │  │  │                │ │  │
│  │  │  │ Recharts │   │  │  │  OCR   │  │  │  postMessage   │ │  │
│  │  │  │  Charts  │   │  │  └────────┘  │  │  bridge        │ │  │
│  │  │  └──────────┘   │  │  ┌────────┐  │  │                │ │  │
│  │  │  NL Chat Panel  │  │  │Vision  │  │  └────────────────┘ │  │
│  │  │  ChatInterface  │  │  │  LLM   │  │                     │  │
│  │  └────────┬────────┘  │  └────────┘  │                     │  │
│  │           │           └──────┬───────┘                     │  │
│  └───────────┼──────────────────┼─────────────────────────────┘  │
└──────────────┼──────────────────┼──────────────────────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend  :8000                            │
│                                                                      │
│   POST /dashboard/upload   ──► Pandas CSV/Excel parser               │
│   POST /dashboard/chart    ──► Mistral API ──► Recharts JSON         │
│   POST /vision/ocr         ──► EasyOCR (local, CPU)                  │
│   POST /vision/analyze     ──► OpenRouter Vision LLM ──► Insights   │
│   POST /vision/chat        ──► OpenRouter Vision LLM ──► Answer     │
│   GET  /health             ──► Status check                          │
│                                                                      │
└───────────┬──────────────────────────┬───────────────────────────────┘
            │                          │
            ▼                          ▼
  ┌──────────────────┐      ┌─────────────────────┐
  │   Mistral API    │      │  OpenRouter API      │
  │  mistral-small   │      │  gemma-3-27b:free    │
  │  (chart tasks)   │      │  (vision tasks)      │
  └──────────────────┘      └─────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                  AI PPT Maker  :5174 + :8788                        │
│                                                                      │
│   Vite Frontend :5174  ──►  Express Backend :8788                   │
│   HomePage · EditorPage · SlideshowOverlay                          │
│   POST /api/generate  ──►  OpenRouter  ──►  Slide JSON              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
nokia-factory-gpt/
│
├── factory-gpt/
│   ├── frontend/                        ← React + Vite (port 5173)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ChatInterface.jsx    ← Shared chat UI + voice input
│   │   │   │   ├── DashboardGen.jsx     ← CSV → NL → Charts
│   │   │   │   ├── VisionAI.jsx         ← Image → OCR → LLM insights
│   │   │   │   └── PPTMaker.jsx         ← iframe wrapper + postMessage
│   │   │   ├── App.jsx                  ← Main shell (login, sidebar, settings)
│   │   │   ├── main.jsx                 ← React entry point
│   │   │   └── index.css                ← Tailwind directives
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── package.json
│   │   └── .env                         ← VITE_PPT_MAKER_URL
│   │
│   └── backend/                         ← Python FastAPI (port 8000)
│       ├── main.py                      ← All API endpoints
│       ├── requirements.txt
│       └── .env                         ← MISTRAL_API_KEY, OPENROUTER_API_KEY
│
└── ai-ppt-maker/                        ← Standalone PPT app
    ├── src/
    │   ├── App.jsx                      ← HomePage + EditorPage
    │   ├── main.jsx                     ← postMessage bridge (PPT_READY)
    │   └── styles.css
    ├── server/
    │   └── index.js                     ← Express :8788 → OpenRouter
    ├── vite.config.js                   ← Proxy + forced port 5174
    ├── package.json
    └── .env                             ← OPENROUTER_API_KEY
```

---

## 🚀 Quick Start

### Prerequisites

Make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.10+ | [python.org](https://python.org) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/nokia-factory-gpt.git
cd nokia-factory-gpt
```

---

### Step 2 — Get API Keys

| Key | Where to get | Used for |
|-----|-------------|----------|
| `MISTRAL_API_KEY` | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Dashboard chart generation |
| `OPENROUTER_API_KEY` | [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) | Vision AI image analysis + PPT generation |

---

### Step 3 — Configure environment files

**`factory-gpt/backend/.env`**
```env
MISTRAL_API_KEY=your-mistral-key-here
OPENROUTER_API_KEY=your-openrouter-key-here
```

**`factory-gpt/frontend/.env`**
```env
VITE_PPT_MAKER_URL=http://localhost:5174
```

**`ai-ppt-maker/.env`**
```env
OPENROUTER_API_KEY=your-openrouter-key-here
PORT=8788
```

---

### Step 4 — Install dependencies

```bash
# Factory-GPT Frontend
cd factory-gpt/frontend
npm install

# AI PPT Maker
cd ../../ai-ppt-maker
npm install

# Factory-GPT Backend
cd ../factory-gpt/backend
python -m venv venv

# Activate venv (Windows)
venv\Scripts\activate

# Activate venv (Mac/Linux)
source venv/bin/activate

pip install fastapi uvicorn python-multipart pandas openpyxl httpx pillow python-dotenv
pip install easyocr   # Note: ~1GB download, takes a few minutes
```

---

### Step 5 — Run (3 terminals)

Open **3 separate terminals** and run:

```bash
# ── Terminal 1 ── FastAPI Backend
cd nokia-factory-gpt/factory-gpt/backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
uvicorn main:app --reload --port 8000
```

```bash
# ── Terminal 2 ── AI PPT Maker (starts both Vite:5174 + Express:8788)
cd nokia-factory-gpt/ai-ppt-maker
npm run dev
```

```bash
# ── Terminal 3 ── Factory-GPT Frontend
cd nokia-factory-gpt/factory-gpt/frontend
npm run dev
```

---

### Step 6 — Open in browser

```
http://localhost:5173
```

✅ You should see the Factory-GPT splash screen with Nokia branding.

---

## ⚙️ Configuration

### Port Map

| Service | Port | Terminal |
|---------|------|----------|
| Factory-GPT Frontend (Vite) | `5173` | Terminal 3 |
| AI PPT Maker Frontend (Vite) | `5174` | Terminal 2 |
| AI PPT Maker Backend (Express) | `8788` | Terminal 2 |
| Factory-GPT Backend (FastAPI) | `8000` | Terminal 1 |

### Health Check

Once running, verify everything is working:

```
http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "chart_provider": "Mistral",
  "chart_model": "mistral-small-latest",
  "vision_provider": "OpenRouter",
  "vision_model": "google/gemma-3-27b-it:free",
  "mistral_key": "loaded",
  "openrouter_key": "loaded"
}
```

### Models Used

| Feature | Provider | Model |
|---------|----------|-------|
| Dashboard chart generation | Mistral | `mistral-small-latest` |
| Vision image analysis | OpenRouter | `google/gemma-3-27b-it:free` |
| Vision follow-up chat | OpenRouter | `google/gemma-3-27b-it:free` |
| PPT slide generation | OpenRouter | `openai/gpt-4o-mini` |

---

## 🎯 How to Use

### Dashboard Gen
1. Click **AI Studio** in the sidebar
2. Select **Dashboard Gen**
3. Drop a `.csv` or `.xlsx` file
4. Ask in the chat: *"Pie chart of Sales by Region"*
5. Charts appear instantly — switch palettes with the colour buttons

### Vision AI
1. Click **AI Studio** → **Vision AI**
2. Drop any dashboard screenshot (Power BI, Tableau, Excel, etc.)
3. EasyOCR extracts text (Step 1)
4. Vision LLM analyses the image (Step 2)
5. See **Trends**, **Anomalies**, and **Actions** tiles
6. Ask follow-up questions in the chat panel

### PPT Maker
1. Click **AI Studio** → **PPT Maker**
2. Wait for **● Connected** status (green badge)
3. Type your topic in Main Prompt
4. Choose slide count, theme, tone, template
5. Click **Generate PPT** → edit slides → export

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.3 | UI framework |
| Vite | 5.4 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| Recharts | 2.12 | Chart rendering |
| Lucide React | 0.263 | Icons |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.111 | API framework |
| Uvicorn | 0.29 | ASGI server |
| Pandas | 2.2 | Data processing |
| EasyOCR | 1.7 | Text extraction from images |
| httpx | 0.27 | Async HTTP client |
| Pillow | 10.3 | Image processing |

---

## 🔧 Troubleshooting

<details>
<summary><b>Blank page on localhost:5173</b></summary>

1. Open browser DevTools (`F12`) → Console tab
2. Check for import errors
3. Run `sessionStorage.clear()` in console
4. Hard refresh `Ctrl+Shift+R`
5. Check `index.html` has `<div id="root">` and `<script src="/src/main.jsx">`

</details>

<details>
<summary><b>uvicorn not recognized</b></summary>

Make sure your virtual environment is activated:
```bash
cd factory-gpt/backend
venv\Scripts\activate    # Windows
uvicorn main:app --reload --port 8000
```

</details>

<details>
<summary><b>Chart generation fails (500 error)</b></summary>

1. Check `factory-gpt/backend/.env` has `MISTRAL_API_KEY`
2. Restart backend after editing `.env`
3. Visit `http://localhost:8000/health` — `mistral_key` should say `loaded`

</details>

<details>
<summary><b>Vision AI stuck on Step 2</b></summary>

1. Check `OPENROUTER_API_KEY` in `factory-gpt/backend/.env`
2. Visit `http://localhost:8000/health` — `openrouter_key` should say `loaded`
3. Free vision models have rate limits — wait 15 seconds and retry

</details>

<details>
<summary><b>PPT Maker shows "Connecting..." forever</b></summary>

1. Make sure Terminal 2 (`ai-ppt-maker`) is running
2. Check it started on port `5174` (not 5173)
3. Check `factory-gpt/frontend/.env` has `VITE_PPT_MAKER_URL=http://localhost:5174`

</details>

<details>
<summary><b>Port 5173 already in use</b></summary>

Force correct ports by adding to both `vite.config.js` files:

**factory-gpt/frontend/vite.config.js**
```js
server: { port: 5173, strictPort: true }
```

**ai-ppt-maker/vite.config.js**
```js
server: { port: 5174, strictPort: true }
```

Always start Factory-GPT frontend **before** PPT Maker.

</details>

---

## 📁 Key Files Reference

| File | Description |
|------|-------------|
| `factory-gpt/frontend/src/App.jsx` | Main shell — login, sidebar, settings drawer |
| `factory-gpt/frontend/src/components/ChatInterface.jsx` | Shared chat UI with Web Speech API |
| `factory-gpt/frontend/src/components/DashboardGen.jsx` | CSV upload + NL-to-chart |
| `factory-gpt/frontend/src/components/VisionAI.jsx` | Image OCR + LLM analysis |
| `factory-gpt/frontend/src/components/PPTMaker.jsx` | iframe wrapper + postMessage bridge |
| `factory-gpt/backend/main.py` | All FastAPI endpoints |
| `ai-ppt-maker/src/main.jsx` | PPT_READY postMessage on load |
| `ai-ppt-maker/server/index.js` | Express → OpenRouter → slide JSON |

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Nokia's Industrial AI Studio**

*Factory-GPT — Where Data Meets Intelligence*

</div>
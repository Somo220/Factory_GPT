import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8788;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
  ],
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/generate', async (req, res) => {
  const { prompt, customPrompt, slideCount, tone, theme } = req.body || {};

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  // ✅ Token-safe limits
  const safeSlideCount = Math.min(4, Math.max(2, Number(slideCount) || 4));
  const toneText = String(tone || 'Professional').trim();
  const themeText = String(theme || 'live-blank').trim();

  const systemPrompt =
    'You generate short PowerPoint slides. Output ONLY valid JSON. No extra text.';

  const userPrompt = `
Create ${safeSlideCount} slides.

RULES:
- STRICT JSON only
- NO markdown
- NO explanation
- Max 2 bullets per slide
- Max 6 words per bullet
- Titles max 5 words

FORMAT:
{
  "slides": [
    {
      "title": "Slide title",
      "bullets": ["point1", "point2"]
    }
  ]
}

Topic: ${prompt}
Tone: ${toneText}
Theme: ${themeText}
Extra: ${customPrompt || 'None'}
`;

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: 'Missing OPENROUTER_API_KEY in .env',
    });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'X-Title': 'AI PPT Maker',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 120, // ✅ balanced (not too high, not breaking)
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'OpenRouter API error',
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    console.log("🧠 RAW LLM OUTPUT:\n", content);

    if (!content) {
      return res.status(502).json({
        error: 'No response from AI model.',
      });
    }

    // ✅ Clean markdown if present
    let cleaned = content.replace(/```json|```/g, '').trim();

    // ✅ SAFETY: Try parsing JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ JSON PARSE FAILED:\n", cleaned);

      // 🔥 fallback: create safe slides
      return res.json({
        slides: [
          {
            title: "Generated Content",
            bullets: [
              cleaned.slice(0, 80),
              "Retry for better format"
            ]
          }
        ]
      });
    }

    // ✅ Validate structure
    if (!parsed || !Array.isArray(parsed.slides)) {
      return res.json({
        slides: [
          {
            title: "Invalid AI Format",
            bullets: [
              "Model returned unexpected structure",
              "Try again"
            ]
          }
        ]
      });
    }

    return res.json({ slides: parsed.slides });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    return res.status(500).json({
      error: error.message || 'Backend failed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI PPT Maker running on http://localhost:${PORT}`);
});
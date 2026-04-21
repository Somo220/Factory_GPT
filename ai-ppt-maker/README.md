# AI PPT Maker (React + Backend)

Frontend + backend app for generating PPT outlines with OpenRouter and editing slides in a PowerPoint-like editor.

## Features
- Home page with:
  - Main prompt
  - Custom prompt option (extra instructions)
  - Number of slides
  - Theme and tone
  - Template selection (Default, Nokia style, Custom image)
- Home page background uses `public/nokia-bg.svg`.
- Backend-only OpenRouter API key usage (`OPENROUTER_API_KEY` in `.env`).
- Editor features:
  - Add slide
  - Add text box
  - Add image by URL
  - Font family, size, color
  - Bold / italic
  - Alignment (left, center, right)
  - Bullets toggle
  - Slide Show mode (next/previous + keyboard arrows)

## Backend API
- `GET /api/health`
- `POST /api/generate`

Example request:
```json
{
  "prompt": "Build sales strategy deck",
  "customPrompt": "Include SWOT and KPI slide",
  "slideCount": 8,
  "tone": "Professional",
  "theme": "live-blank"
}
```

## Setup
```bash
npm install
cp .env.example .env
```
Set:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
PORT=8787
```
Run:
```bash
npm run dev
```

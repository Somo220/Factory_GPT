import { useEffect, useMemo, useState } from 'react';

const themes = [
  { id: 'live-blank', label: 'Live Blank' },
  { id: 'clean-dark', label: 'Clean Dark' },
  { id: 'minimal-light', label: 'Minimal Light' },
  { id: 'corporate-blue', label: 'Corporate Blue' },
  { id: 'custom', label: 'Custom Theme' },
];

const templates = [
  { id: 'default', label: 'Default Template' },
  { id: 'nokia', label: 'Nokia Style Template' },
  { id: 'custom-image', label: 'Custom Image Template' },
];

const tones = ['Professional', 'Friendly', 'Creative', 'Formal', 'Persuasive'];

const themeStyleMap = {
  'live-blank': { background: '#ffffff', color: '#111827', fontFamily: 'Calibri, Arial, sans-serif' },
  'clean-dark': { background: '#111827', color: '#f9fafb', fontFamily: 'Segoe UI, Arial, sans-serif' },
  'minimal-light': { background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' },
  'corporate-blue': { background: '#0b2a5b', color: '#f8fbff', fontFamily: 'Arial, sans-serif' },
};

const defaultTextStyle = {
  fontSize: 24,
  fontFamily: 'Calibri, Arial, sans-serif',
  fontWeight: '400',
  fontStyle: 'normal',
  color: '#111827',
  textAlign: 'left',
  bullet: false,
};

const starterSlide = (id, title = 'New Slide') => ({
  id,
  title,
  content: [
    {
      id: `${id}-t1`,
      type: 'text',
      text: 'Click to edit text...',
      x: 50,
      y: 90,
      width: 620,
      height: 80,
      style: { ...defaultTextStyle },
    },
  ],
});

async function generateSlideOutline({ prompt, customPrompt, slideCount, tone, theme }) {
  const response = await fetch('http://localhost:8788/api/generate', { // ✅ FIXED URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, customPrompt, slideCount, tone, theme }),
  });

  let payload;

  try {
    const text = await response.text();   // ✅ read raw first
    console.log("RAW BACKEND RESPONSE:", text);

    payload = JSON.parse(text);           // ✅ safe parse
  } catch (err) {
    console.error("❌ FRONTEND JSON ERROR:", err);
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Backend request failed (${response.status})`);
  }

  if (!Array.isArray(payload.slides)) {
    throw new Error("Unexpected backend response format.");
  }

  return payload.slides;
}

function HomePage({ onGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [slideCount, setSlideCount] = useState(6);
  const [tone, setTone] = useState('Professional');
  const [theme, setTheme] = useState('live-blank');
  const [templateId, setTemplateId] = useState('nokia');
  const [customTemplate, setCustomTemplate] = useState({
    background: '#ffffff',
    color: '#111827',
    fontFamily: 'Calibri, Arial, sans-serif',
    backgroundImage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDisabled = !prompt.trim() || loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const aiSlides = await generateSlideOutline({ prompt, customPrompt, slideCount, tone, theme });
      onGenerate({ aiSlides, theme, tone, customPrompt, templateId, customTemplate });
    } catch (err) {
      setError(err.message || 'Failed to generate presentation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-layout">
      <section className="hero-card">
        <h1>AI PPT Maker</h1>
        <p>Create a PowerPoint-style deck with backend AI generation and editable slides.</p>

        <form onSubmit={handleSubmit} className="prompt-form">
          <label>
            Main Prompt
            <textarea
              rows={4}
              placeholder="Create a strategy deck for launching a new product..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          <label>
            Custom Prompt Option (extra instructions)
            <textarea
              rows={3}
              placeholder="Example: Keep language simple, include market risks, add KPI slide..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </label>

          <div className="grid-row">
            <label>
              Number of slides
              <input
                type="number"
                min={2}
                max={20}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
              />
            </label>

            <label>
              Theme
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                {themes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tone
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                {tones.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid-row">
            <label>
              Template
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {(theme === 'custom' || templateId === 'custom-image') && (
            <div className="grid-row custom-grid">
              <label>
                Custom Background Color
                <input
                  type="color"
                  value={customTemplate.background}
                  onChange={(e) => setCustomTemplate((prev) => ({ ...prev, background: e.target.value }))}
                />
              </label>
              <label>
                Custom Text Color
                <input
                  type="color"
                  value={customTemplate.color}
                  onChange={(e) => setCustomTemplate((prev) => ({ ...prev, color: e.target.value }))}
                />
              </label>
              <label>
                Custom Font Family
                <input
                  type="text"
                  placeholder="Calibri, Arial, sans-serif"
                  value={customTemplate.fontFamily}
                  onChange={(e) => setCustomTemplate((prev) => ({ ...prev, fontFamily: e.target.value }))}
                />
              </label>
              <label className="span-3">
                Custom Template Background Image URL
                <input
                  type="text"
                  placeholder="https://.../image.png"
                  value={customTemplate.backgroundImage}
                  onChange={(e) => setCustomTemplate((prev) => ({ ...prev, backgroundImage: e.target.value }))}
                />
              </label>
            </div>
          )}

          <button type="submit" disabled={isDisabled}>
            {loading ? 'Generating...' : 'Generate PPT'}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}

function SlideshowOverlay({ slides, themeStyle, onClose }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowRight') {
        setIndex((prev) => Math.min(slides.length - 1, prev + 1));
      }
      if (event.key === 'ArrowLeft') {
        setIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, slides.length]);

  const slide = slides[index];

  return (
    <div className="slideshow-overlay">
      <div className="slideshow-topbar">
        <span>
          Slide {index + 1} / {slides.length}
        </span>
        <button type="button" onClick={onClose}>
          Exit Slide Show
        </button>
      </div>
      <div className="slideshow-canvas" style={themeStyle}>
        {slide.content.map((block) => {
          if (block.type === 'image') {
            return (
              <img
                key={`show-${block.id}`}
                src={block.src}
                alt="slide"
                className="slide-image"
                style={{ left: block.x, top: block.y, width: block.width, height: block.height }}
              />
            );
          }
          const style = { ...defaultTextStyle, ...block.style };
          const text = style.bullet
            ? block.text
                .split('\n')
                .map((line) => (line.trim().startsWith('•') ? line : `• ${line}`))
                .join('\n')
            : block.text;

          return (
            <div
              key={`show-${block.id}`}
              className="preview-text"
              style={{
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                fontSize: `${style.fontSize}px`,
                fontFamily: style.fontFamily,
                fontWeight: style.fontWeight,
                fontStyle: style.fontStyle,
                color: style.color,
                textAlign: style.textAlign,
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
      <div className="slideshow-controls">
        <button type="button" onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>
          Previous
        </button>
        <button type="button" onClick={() => setIndex((prev) => Math.min(slides.length - 1, prev + 1))}>
          Next
        </button>
      </div>
    </div>
  );
}

function EditorPage({ presentation, onBack }) {
  const [slides, setSlides] = useState(presentation.slides);
  const [activeSlideId, setActiveSlideId] = useState(presentation.slides[0]?.id);
  const [selectedBlockId, setSelectedBlockId] = useState(presentation.slides[0]?.content?.[0]?.id);
  const [showSlideshow, setShowSlideshow] = useState(false);

  const activeSlide = useMemo(
    () => slides.find((slide) => slide.id === activeSlideId) || slides[0],
    [slides, activeSlideId],
  );

  const selectedBlock = useMemo(
    () => activeSlide?.content.find((block) => block.id === selectedBlockId && block.type === 'text'),
    [activeSlide, selectedBlockId],
  );

  const updateTextBlock = (blockId, text) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id !== activeSlide.id
          ? slide
          : { ...slide, content: slide.content.map((block) => (block.id === blockId ? { ...block, text } : block)) },
      ),
    );
  };

  const updateSelectedStyle = (patch) => {
    if (!selectedBlock) {
      return;
    }

    setSlides((prev) =>
      prev.map((slide) =>
        slide.id !== activeSlide.id
          ? slide
          : {
              ...slide,
              content: slide.content.map((block) =>
                block.id === selectedBlock.id ? { ...block, style: { ...defaultTextStyle, ...block.style, ...patch } } : block,
              ),
            },
      ),
    );
  };

  const addTextBox = () => {
    const blockId = `${activeSlide.id}-t${Date.now()}`;
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id !== activeSlide.id
          ? slide
          : {
              ...slide,
              content: [
                ...slide.content,
                {
                  id: blockId,
                  type: 'text',
                  text: 'New text box',
                  x: 60,
                  y: 240,
                  width: 320,
                  height: 70,
                  style: { ...defaultTextStyle },
                },
              ],
            },
      ),
    );
    setSelectedBlockId(blockId);
  };

  const addSlide = () => {
    const id = `slide-${Date.now()}`;
    const newSlide = starterSlide(id, `Slide ${slides.length + 1}`);
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideId(id);
    setSelectedBlockId(`${id}-t1`);
  };

  const addImageBlock = (url) => {
    if (!url.trim()) {
      return;
    }

    const blockId = `${activeSlide.id}-i${Date.now()}`;
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id !== activeSlide.id
          ? slide
          : {
              ...slide,
              content: [
                ...slide.content,
                { id: blockId, type: 'image', src: url, x: 400, y: 160, width: 220, height: 160 },
              ],
            },
      ),
    );
  };

  const handleAddImage = () => {
    const url = window.prompt('Paste image URL');
    if (url) {
      addImageBlock(url);
    }
  };

  const baseThemeStyle = presentation.templateStyle;

  const renderBlockText = (block) => {
    const style = { ...defaultTextStyle, ...block.style };
    if (!style.bullet) {
      return block.text;
    }
    return block.text
      .split('\n')
      .map((line) => (line.trim().startsWith('•') ? line : `• ${line}`))
      .join('\n');
  };

  return (
    <main className="editor-layout">
      <aside className="left-pane">
        <div className="left-header">
          <button type="button" onClick={onBack}>
            ← Home
          </button>
          <h3>Slides</h3>
        </div>
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`thumb ${slide.id === activeSlide.id ? 'active' : ''}`}
            onClick={() => {
              setActiveSlideId(slide.id);
              const firstText = slide.content.find((c) => c.type === 'text');
              setSelectedBlockId(firstText?.id || null);
            }}
          >
            <span>{index + 1}</span>
            <p>{slide.title}</p>
          </button>
        ))}
      </aside>

      <section className="work-pane">
        <header className="toolbar toolbar-wrap">
          <button type="button" onClick={addSlide}>
            Add Slide
          </button>
          <button type="button" onClick={addTextBox}>
            Add Text
          </button>
          <button type="button" onClick={handleAddImage}>
            Add Image
          </button>
          <button type="button" onClick={() => setShowSlideshow(true)}>
            Slide Show
          </button>

          <div className="toolbar-controls">
            <label>
              Font
              <select
                value={selectedBlock?.style?.fontFamily || defaultTextStyle.fontFamily}
                onChange={(e) => updateSelectedStyle({ fontFamily: e.target.value })}
                disabled={!selectedBlock}
              >
                <option value="Calibri, Arial, sans-serif">Calibri</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
              </select>
            </label>

            <label>
              Size
              <input
                type="number"
                min={10}
                max={80}
                value={selectedBlock?.style?.fontSize || defaultTextStyle.fontSize}
                onChange={(e) => updateSelectedStyle({ fontSize: Number(e.target.value) })}
                disabled={!selectedBlock}
              />
            </label>

            <label>
              Color
              <input
                type="color"
                value={selectedBlock?.style?.color || defaultTextStyle.color}
                onChange={(e) => updateSelectedStyle({ color: e.target.value })}
                disabled={!selectedBlock}
              />
            </label>

            <button type="button" onClick={() => updateSelectedStyle({ fontWeight: '700' })} disabled={!selectedBlock}>
              Bold
            </button>
            <button type="button" onClick={() => updateSelectedStyle({ fontStyle: 'italic' })} disabled={!selectedBlock}>
              Italic
            </button>
            <button type="button" onClick={() => updateSelectedStyle({ textAlign: 'left' })} disabled={!selectedBlock}>
              Left
            </button>
            <button type="button" onClick={() => updateSelectedStyle({ textAlign: 'center' })} disabled={!selectedBlock}>
              Center
            </button>
            <button type="button" onClick={() => updateSelectedStyle({ textAlign: 'right' })} disabled={!selectedBlock}>
              Right
            </button>
            <button
              type="button"
              onClick={() => updateSelectedStyle({ bullet: !(selectedBlock?.style?.bullet || false) })}
              disabled={!selectedBlock}
            >
              Bullets
            </button>
          </div>
        </header>

        <div className="slide-stage-wrap">
          <div className="slide-stage" style={baseThemeStyle}>
            {activeSlide.content.map((block) => {
              if (block.type === 'image') {
                return (
                  <img
                    key={block.id}
                    src={block.src}
                    alt="Slide visual"
                    className="slide-image"
                    style={{ left: block.x, top: block.y, width: block.width, height: block.height }}
                  />
                );
              }

              const style = { ...defaultTextStyle, ...block.style };
              return (
                <textarea
                  key={block.id}
                  value={renderBlockText(block)}
                  onFocus={() => setSelectedBlockId(block.id)}
                  onChange={(e) => updateTextBlock(block.id, e.target.value.replace(/^•\s?/gm, ''))}
                  className={`slide-text-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                  style={{
                    left: block.x,
                    top: block.y,
                    width: block.width,
                    height: block.height,
                    fontSize: `${style.fontSize}px`,
                    fontFamily: style.fontFamily,
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle,
                    color: style.color,
                    textAlign: style.textAlign,
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {showSlideshow && <SlideshowOverlay slides={slides} themeStyle={baseThemeStyle} onClose={() => setShowSlideshow(false)} />}
    </main>
  );
}

function resolveTemplateStyle(theme, templateId, customTemplate) {
  const base = theme === 'custom' ? customTemplate : themeStyleMap[theme] || themeStyleMap['live-blank'];

  if (templateId === 'nokia') {
    return {
      ...base,
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundImage: 'url(/nokia-bg.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  if (templateId === 'custom-image' && customTemplate.backgroundImage.trim()) {
    return {
      ...base,
      backgroundImage: `url(${customTemplate.backgroundImage.trim()})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  return base;
}

function convertOutlineToSlides(outlineSlides, templateStyle) {
  return outlineSlides.map((slide, index) => {
    const id = `slide-${index + 1}`;
    const bullets = Array.isArray(slide.bullets) ? slide.bullets : [];
    return {
      ...starterSlide(id, slide.title || `Slide ${index + 1}`),
      content: [
        {
          id: `${id}-title`,
          type: 'text',
          text: slide.title || `Slide ${index + 1}`,
          x: 50,
          y: 45,
          width: 620,
          height: 50,
          style: {
            ...defaultTextStyle,
            fontSize: 34,
            fontWeight: '700',
            color: templateStyle.color || '#111827',
            fontFamily: templateStyle.fontFamily || defaultTextStyle.fontFamily,
          },
        },
        {
          id: `${id}-body`,
          type: 'text',
          text: bullets.join('\n'),
          x: 65,
          y: 130,
          width: 580,
          height: 230,
          style: {
            ...defaultTextStyle,
            bullet: true,
            color: templateStyle.color || '#111827',
            fontFamily: templateStyle.fontFamily || defaultTextStyle.fontFamily,
          },
        },
      ],
    };
  });
}

export default function App() {
  const [presentation, setPresentation] = useState(null);

  if (!presentation) {
    return (
      <HomePage
        onGenerate={({ aiSlides, theme, tone, customPrompt, templateId, customTemplate }) => {
          const templateStyle = resolveTemplateStyle(theme, templateId, customTemplate);
          setPresentation({
            tone,
            theme,
            customPrompt,
            templateId,
            customTemplate,
            templateStyle,
            slides: convertOutlineToSlides(aiSlides, templateStyle),
          });
        }}
      />
    );
  }

  return <EditorPage presentation={presentation} onBack={() => setPresentation(null)} />;
}

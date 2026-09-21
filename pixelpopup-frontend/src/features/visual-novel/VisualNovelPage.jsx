import { useEffect, useMemo, useRef, useState } from "react";
import "./visualNovel.css";

const STORAGE_KEY = "pp_visual_novel_v1";

const DEFAULT_SCRIPT = [
  {
    id: "arrival",
    background: { type: "image", src: "/images/date/picnic.png", name: "picnic.png" },
    portrait: { src: "/blacky.png", name: "blacky.png" },
    speaker: "BLACKY",
    text: "A new story is waiting. Import a picture or video, then write the next line.",
    next: "choice",
  },
  {
    id: "choice",
    background: { type: "image", src: "/images/date/picnic.png", name: "picnic.png" },
    portrait: { src: "/blacky.png", name: "blacky.png" },
    speaker: "BLACKY",
    text: "Where should the story go from here?",
    choices: [
      { label: "Open the memory", next: "memory" },
      { label: "Play the video scene", next: "video" },
    ],
  },
  {
    id: "memory",
    background: { type: "image", src: "/images/date/dinner.png", name: "dinner.png" },
    portrait: { src: "/blacky.png", name: "blacky.png" },
    speaker: "BLACKY",
    text: "Every picture can become a scene. Add another dialogue, then point it at the next scene.",
    next: "ending",
  },
  {
    id: "video",
    background: { type: "video", src: "/andrea.mp4", name: "andrea.mp4" },
    portrait: { src: "/blacky.png", name: "blacky.png" },
    speaker: "BLACKY",
    text: "Video scenes work the same way: media, dialogue, then a choice or a next scene.",
    next: "ending",
  },
  {
    id: "ending",
    background: { type: "image", src: "/images/date/matcha.png", name: "matcha.png" },
    portrait: { src: "/blacky.png", name: "blacky.png" },
    speaker: "BLACKY",
    text: "The end is only another beginning. Add your own scenes in SCRIPT STUDIO.",
    end: true,
  },
];

function readSavedScript() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_SCRIPT;
  } catch {
    return DEFAULT_SCRIPT;
  }
}

function slugify(value) {
  return String(value || "scene")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "scene";
}

function getNextId(script, base = "scene") {
  const prefix = slugify(base);
  let i = 1;
  let id = prefix;
  while (script.some((scene) => scene.id === id)) {
    i += 1;
    id = `${prefix}-${i}`;
  }
  return id;
}

export default function VisualNovelPage() {
  const [script, setScript] = useState(readSavedScript);
  const [currentId, setCurrentId] = useState(() => readSavedScript()[0]?.id || "arrival");
  const [studioOpen, setStudioOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const objectUrls = useRef([]);
  const clickAudio = useRef(null);
  const shellRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scene = useMemo(
    () => script.find((item) => item.id === currentId) || script[0] || DEFAULT_SCRIPT[0],
    [currentId, script]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(script));
  }, [script]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const playClickSound = (event) => {
    if (!event.target.closest("button, [role='button'], label, select, input, textarea")) return;

    try {
      if (!clickAudio.current) {
        clickAudio.current = new Audio("/bruh.mp3");
        clickAudio.current.preload = "auto";
        clickAudio.current.volume = 0.28;
      }

      clickAudio.current.currentTime = 0;
      void clickAudio.current.play();
    } catch {
      // Sound is enhancement-only; browser autoplay or missing media should not block input.
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shellRef.current?.requestFullscreen?.();
      }
    } catch {
      // Fullscreen is optional and can be denied by the browser.
    }
  };

  const updateScene = (patch) => {
    setScript((previous) =>
      previous.map((item) => (item.id === scene.id ? { ...item, ...patch } : item))
    );
  };

  const goTo = (nextId) => {
    if (!nextId) return;
    setChoiceOpen(false);
    setCurrentId(nextId);
  };

  const advance = () => {
    if (scene.choices?.length && !choiceOpen) {
      setChoiceOpen(true);
      return;
    }
    if (scene.next) goTo(scene.next);
  };

  const importMedia = (event, kind) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);

    if (kind === "portrait") {
      updateScene({ portrait: { src: url, name: file.name } });
    } else {
      updateScene({
        background: {
          type: file.type.startsWith("video/") ? "video" : "image",
          src: url,
          name: file.name,
        },
      });
    }

    event.target.value = "";
  };

  const addScene = () => {
    const id = getNextId(script, "new-scene");
    const newScene = {
      id,
      background: scene.background,
      portrait: scene.portrait,
      speaker: "NEW CHARACTER",
      text: "Write the next moment of the story...",
      end: true,
    };

    setScript((previous) => [
      ...previous.map((item) => (item.id === scene.id && item.end ? { ...item, end: false, next: id } : item)),
      newScene,
    ]);
    setChoiceOpen(false);
    setCurrentId(id);
  };

  const addChoice = () => {
    const target = script.find((item) => item.id !== scene.id)?.id || scene.id;
    updateScene({
      choices: [...(scene.choices || []), { label: "New choice", next: target }],
      end: false,
    });
  };

  const resetScript = () => {
    setScript(DEFAULT_SCRIPT);
    setChoiceOpen(false);
    setCurrentId(DEFAULT_SCRIPT[0].id);
  };

  const background = scene.background || {};
  const portrait = scene.portrait || {};

  return (
    <main className="vn-page min-h-screen p-[22px] text-[#f0eee4] max-md:p-0" onClickCapture={playClickSound}>
      <section ref={shellRef} className="vn-shell mx-auto flex min-h-[calc(100vh-44px)] w-full max-w-[1480px] flex-col overflow-hidden border-[3px] border-[#d1c8ae] bg-[#202226] shadow-[8px_8px_0_#090a0b] max-md:min-h-screen max-md:border-x-0" aria-label="PixelPopup visual novel">
        <header className="vn-topbar flex min-h-[58px] items-center justify-between gap-4">
          <div className="vn-brand flex items-center gap-2">
            <span className="vn-lights flex items-center gap-2" aria-hidden="true"><i /><i /><i /></span>
            <span>PIXELNOVEL.EXE</span>
          </div>
          <div className="vn-topbar-actions flex items-center gap-2.5">
            <span className="vn-scene-counter">SCENE {script.findIndex((item) => item.id === scene.id) + 1}/{script.length}</span>
            <button className="vn-small-button" type="button" onClick={() => setStudioOpen((open) => !open)}>
              {studioOpen ? "CLOSE STUDIO" : "SCRIPT STUDIO"}
            </button>
            <button className="vn-small-button" type="button" onClick={toggleFullscreen}>
              {isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}
            </button>
          </div>
        </header>

        <div className="vn-stage-wrap flex-1 bg-[#17191c] p-5 max-md:p-2">
          <div
            className={`vn-stage relative min-h-[min(720px,70vh)] overflow-hidden bg-[#391d37] bg-cover bg-center [image-rendering:pixelated] ${background.type === "video" ? "vn-stage-video" : ""}`}
            style={background.type === "image" ? { backgroundImage: `url("${background.src}")` } : undefined}
          >
            {background.type === "video" ? (
              <video className="vn-background-media absolute inset-0 h-full w-full object-cover" src={background.src} autoPlay muted loop playsInline />
            ) : null}
            <div className="vn-stage-vignette" />
            <div className="vn-stage-scanlines" />
            <div className="vn-stage-label">{background.name || "NO MEDIA LOADED"}</div>

            <div className="vn-dialogue-area absolute right-[5%] bottom-[4%] left-[5%] z-[2] grid grid-cols-[156px_1fr] items-end max-md:block">
              {portrait.src ? (
                <div className="vn-portrait-frame relative z-[3] h-[166px] w-[166px]">
                  <img src={portrait.src} alt={`${scene.speaker || "Character"} portrait`} />
                </div>
              ) : null}

              <div className="vn-dialogue-box relative min-h-[150px]" onClick={advance} role="button" tabIndex={0} onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") advance();
              }}>
                <div className="vn-speaker">{scene.speaker || "NARRATOR"}</div>
                <p>{scene.text || "..."}</p>
                {!scene.choices?.length && !scene.end ? <span className="vn-next-caret" aria-hidden="true">▼</span> : null}
              </div>

              {choiceOpen && scene.choices?.length ? (
                <div className="vn-choice-list" aria-label="Choices">
                  {scene.choices.map((choice, index) => (
                    <button key={`${choice.label}-${index}`} type="button" onClick={() => goTo(choice.next)}>
                      <span>{String(index + 1).padStart(2, "0")}</span> {choice.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {scene.end ? (
                <button className="vn-end-button" type="button" onClick={() => goTo(script[0]?.id)}>
                  RESTART STORY
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {studioOpen ? (
          <aside className="vn-studio border-t-[3px] border-[#e3c77c] bg-[#111329] p-[22px] max-md:p-4" aria-label="Visual novel script studio">
            <div className="vn-studio-heading flex items-center justify-between gap-4 max-md:items-start max-md:flex-col">
              <div>
                <span className="vn-kicker">AUTHORING MODE</span>
                <h1>Build your story</h1>
              </div>
              <button className="vn-small-button" type="button" onClick={resetScript}>RESET DEMO</button>
            </div>

            <div className="vn-studio-grid mt-5 grid grid-cols-[minmax(190px,0.7fr)_minmax(280px,1.3fr)] gap-[18px] max-md:grid-cols-1">
              <div className="vn-scenes-panel border-2 border-[#41436d] bg-[#1d1e3c] p-4">
                <div className="vn-editor-label">SCENES</div>
                <div className="vn-scene-list">
                  {script.map((item, index) => (
                    <button className={item.id === scene.id ? "is-selected" : ""} key={item.id} type="button" onClick={() => { setChoiceOpen(false); setCurrentId(item.id); }}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{item.id}</strong>
                      <small>{item.background?.type || "image"}</small>
                    </button>
                  ))}
                </div>
                <button className="vn-add-button" type="button" onClick={addScene}>+ ADD SCENE</button>
              </div>

              <div className="vn-editor-panel grid gap-3 border-2 border-[#41436d] bg-[#1d1e3c] p-4">
                <div className="vn-editor-label">EDIT SCENE: {scene.id}</div>
                <label>Speaker<input value={scene.speaker || ""} onChange={(event) => updateScene({ speaker: event.target.value })} /></label>
                <label>Dialogue<textarea rows="4" value={scene.text || ""} onChange={(event) => updateScene({ text: event.target.value })} /></label>

                <div className="vn-import-row flex flex-wrap items-stretch gap-2.5">
                  <label className="vn-file-button">IMPORT BACKGROUND / VIDEO<input type="file" accept="image/*,video/*" onChange={(event) => importMedia(event, "background")} /></label>
                  <label className="vn-file-button">IMPORT PORTRAIT<input type="file" accept="image/*" onChange={(event) => importMedia(event, "portrait")} /></label>
                </div>

                <label>Next scene
                  <select value={scene.next || ""} onChange={(event) => updateScene({ next: event.target.value || undefined, end: !event.target.value })}>
                    <option value="">No automatic next scene</option>
                    {script.filter((item) => item.id !== scene.id).map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
                  </select>
                </label>

                <div className="vn-editor-label vn-choice-heading">CHOICES</div>
                {(scene.choices || []).map((choice, index) => (
                  <div className="vn-choice-editor grid grid-cols-[1fr_0.9fr] gap-2" key={`${choice.label}-${index}`}>
                    <input value={choice.label} aria-label={`Choice ${index + 1} label`} onChange={(event) => {
                      const choices = [...scene.choices];
                      choices[index] = { ...choices[index], label: event.target.value };
                      updateScene({ choices });
                    }} />
                    <select value={choice.next} aria-label={`Choice ${index + 1} destination`} onChange={(event) => {
                      const choices = [...scene.choices];
                      choices[index] = { ...choices[index], next: event.target.value };
                      updateScene({ choices });
                    }}>
                      {script.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
                    </select>
                  </div>
                ))}
                <button className="vn-add-button" type="button" onClick={addChoice}>+ ADD CHOICE</button>
              </div>
            </div>
            <p className="vn-studio-note">Imports are stored in this browser session. Exporting this story to the Django backend can come later through the project&apos;s Page / Scene / Asset contract.</p>
          </aside>
        ) : null}
      </section>
    </main>
  );
}

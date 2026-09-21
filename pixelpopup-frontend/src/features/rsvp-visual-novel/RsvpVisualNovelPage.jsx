import { useEffect, useRef, useState } from "react";
import "./rsvpVisualNovel.css";

const SCENES = {
  welcome: {
    background: "/images/date/picnic.png",
    speaker: "MICA",
    text: "Hey. You found the invitation. I have one question before the story begins...",
    next: "details",
  },
  details: {
    background: "/images/date/dinner.png",
    speaker: "MICA",
    text: "On Saturday, June 15, we are getting married at The Garden House in Davao City.",
    next: "choice",
  },
  choice: {
    background: "/images/date/dinner.png",
    speaker: "MICA",
    text: "How would you like to continue?",
    choices: [
      { label: "I want to be there", next: "rsvp" },
      { label: "Show me the full itinerary", next: "itinerary" },
      { label: "I need to decline", next: "decline" },
    ],
  },
  itinerary: {
    background: "/images/date/matcha.png",
    speaker: "MICA",
    text: "Here is the day: arrive at 2:30, ceremony at 3:00, portraits at 4:00, and dinner at 5:30.",
    next: "rsvp",
  },
  rsvp: {
    background: "/images/date/picnic.png",
    speaker: "RSVP DESK",
    text: "Leave your name and we will save your place at the table.",
  },
  decline: {
    background: "/images/date/matcha.png",
    speaker: "MICA",
    text: "We will miss you, but thank you for letting us know. You are still part of the story.",
    next: "welcome",
  },
  thanks: {
    background: "/images/date/dinner.png",
    speaker: "MICA",
    text: "Your reply has been recorded. We cannot wait to see you there.",
  },
};

const EVENT_FACTS = [
  ["DATE", "Saturday, June 15, 2026"],
  ["TIME", "3:00 PM ceremony"],
  ["PLACE", "The Garden House"],
  ["DRESS", "Formal / semi-formal"],
];

const ITINERARY = [
  ["02:30", "Guest arrival"],
  ["03:00", "Ceremony"],
  ["04:00", "Portraits"],
  ["05:30", "Dinner + dancing"],
];

export default function RsvpVisualNovelPage() {
  const [sceneId, setSceneId] = useState("welcome");
  const [form, setForm] = useState({ name: "", attendance: "yes", guests: "1", note: "" });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef(null);
  const clickAudio = useRef(null);
  const scene = SCENES[sceneId];

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const playClick = (event) => {
    if (!event.target.closest("button, [role='button'], select, input, textarea")) return;
    try {
      if (!clickAudio.current) {
        clickAudio.current = new Audio("/bruh.mp3");
        clickAudio.current.preload = "auto";
        clickAudio.current.volume = 0.25;
      }
      clickAudio.current.currentTime = 0;
      void clickAudio.current.play();
    } catch {
      // Audio is optional enhancement.
    }
  };

  const goTo = (nextScene) => setSceneId(nextScene);

  const advanceDialogue = () => {
    if (scene.next) goTo(scene.next);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen?.();
    } catch {
      // Fullscreen can be unavailable or denied by the browser.
    }
  };

  const updateForm = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const submitRsvp = (event) => {
    event.preventDefault();
    const domName = event.currentTarget?.elements?.guestName?.value?.trim?.() || "";
    const submittedForm = { ...form, name: form.name.trim() || domName };
    if (!submittedForm.name) return;
    try {
      localStorage.setItem("pp_rsvp_visual_novel_v1", JSON.stringify({ ...submittedForm, submittedAt: new Date().toISOString() }));
    } catch {
      // Persistence is optional; the confirmation should still be shown.
    }
    setForm(submittedForm);
    goTo("thanks");
  };

  return (
    <main className="rsvp-vn-page min-h-screen p-0 text-[#f1eee4] sm:p-5" onClickCapture={playClick}>
      <section ref={shellRef} className="rsvp-vn-shell mx-auto flex min-h-screen w-full max-w-[1500px] flex-col overflow-hidden border-0 border-[#d1c8ae] bg-[#202327] shadow-none sm:min-h-[calc(100vh-40px)] sm:border-[3px] sm:shadow-[8px_8px_0_#0b0c0e]" aria-label="RSVP visual novel">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#5a605c] bg-[#2e3335] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5" aria-hidden="true"><i className="h-2.5 w-2.5 bg-[#d66f68]" /><i className="h-2.5 w-2.5 bg-[#d2bd7d]" /><i className="h-2.5 w-2.5 bg-[#91b19b]" /></span>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#e2dbc6]">RSVP.NOVEL</span>
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-[#aeb8ae] sm:inline">A wedding story</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#adb6ad]">{sceneId.toUpperCase()}</span>
            <button className="!bg-[#414746] !text-[#f0ead9] border border-[#bfb79e] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition hover:!bg-[#575f5b]" type="button" onClick={toggleFullscreen}>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</button>
          </div>
        </header>

        <div className="rsvp-vn-stage relative flex-1 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url("${scene.background}")` }}>
          <div className="rsvp-vn-vignette absolute inset-0" />
          <div className="rsvp-vn-scanlines absolute inset-0" />
          <div className="absolute left-5 top-5 z-10 border border-[#d1c8ae]/70 bg-[#202327]/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e2dbc6]">Andrea + Mico / 06.15.26</div>

          {sceneId === "details" || sceneId === "itinerary" ? <EventInfoPanel itinerary={sceneId === "itinerary"} /> : null}
          {sceneId === "rsvp" ? <RsvpPanel form={form} updateForm={updateForm} onSubmit={submitRsvp} /> : null}
          {sceneId === "thanks" ? <ThankYouPanel form={form} onRestart={() => goTo("welcome")} /> : null}
          {sceneId === "decline" ? <DeclinePanel onRestart={() => goTo("welcome")} /> : null}

          {scene.choices?.length ? (
            <div className="absolute bottom-[29%] left-1/2 z-20 grid w-[min(700px,88%)] -translate-x-1/2 gap-2">
              {scene.choices.map((choice, index) => (
                <button className="!bg-[#313a3b] !text-[#f0ead9] border-2 border-[#d1c8ae] px-5 py-3 text-left text-sm font-bold shadow-[4px_4px_0_#0b0c0e] transition hover:-translate-y-0.5 hover:!bg-[#505b55]" type="button" key={choice.label} onClick={() => goTo(choice.next)}><span className="mr-3 text-[#b7cbb7]">0{index + 1}</span>{choice.label}</button>
              ))}
            </div>
          ) : null}

          <DialogueBox scene={scene} onAdvance={advanceDialogue} />
        </div>
      </section>
    </main>
  );
}

function DialogueBox({ scene, onAdvance }) {
  const canAdvance = Boolean(scene.next);
  return (
    <div className="absolute bottom-5 left-1/2 z-30 flex w-[min(1120px,92%)] -translate-x-1/2 items-end gap-3 sm:bottom-8 sm:gap-4">
      <div className="rsvp-vn-portrait hidden h-28 w-28 shrink-0 overflow-hidden border-2 border-[#d1c8ae] bg-[#343c3c] shadow-[4px_4px_0_#0b0c0e] sm:block sm:h-36 sm:w-36"><img src="/blacky.png" alt="Story guide portrait" className="h-full w-full object-contain" /></div>
      <div className={`relative min-h-32 flex-1 border-2 border-[#d1c8ae] bg-[#263033]/95 p-4 shadow-[4px_4px_0_#0b0c0e] sm:min-h-36 sm:p-6 ${canAdvance ? "cursor-pointer" : ""}`} onClick={canAdvance ? onAdvance : undefined} role={canAdvance ? "button" : undefined} tabIndex={canAdvance ? 0 : undefined} onKeyDown={canAdvance ? (event) => { if (event.key === "Enter" || event.key === " ") onAdvance(); } : undefined}>
        <div className="inline-block border border-[#d1c8ae] bg-[#5b6258] px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f0ead9]">{scene.speaker}</div>
        <p className="mt-3 max-w-4xl font-sans text-base font-semibold leading-7 text-[#f1eee4] sm:text-lg">{scene.text}</p>
        {canAdvance ? <span className="absolute bottom-3 right-4 animate-bounce text-[#b7cbb7]" aria-hidden="true">▼</span> : null}
      </div>
    </div>
  );
}

function EventInfoPanel({ itinerary }) {
  return (
    <div className="absolute left-1/2 top-20 z-10 w-[min(760px,88%)] -translate-x-1/2 border-2 border-[#d1c8ae] bg-[#212a2b]/92 p-5 shadow-[5px_5px_0_#0b0c0e] sm:p-7">
      <div className="flex items-center justify-between border-b border-[#70786e] pb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#b7cbb7]"><span>{itinerary ? "Day itinerary" : "Event details"}</span><span>06 / 15 / 26</span></div>
      {itinerary ? (
        <div className="mt-3 divide-y divide-[#70786e]">
          {ITINERARY.map(([time, label]) => <div className="grid grid-cols-[72px_1fr] gap-4 py-3 text-sm text-[#f1eee4]" key={time}><span className="font-mono text-[#c6b889]">{time}</span><span>{label}</span></div>)}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {EVENT_FACTS.map(([label, value]) => <div className="border border-[#70786e] bg-[#313a3b]/70 p-3" key={label}><div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#b7cbb7]">{label}</div><div className="mt-1 text-sm font-semibold text-[#f1eee4]">{value}</div></div>)}
        </div>
      )}
    </div>
  );
}

function RsvpPanel({ form, updateForm, onSubmit }) {
  return (
    <form className="absolute left-1/2 top-10 z-40 w-[min(680px,88%)] -translate-x-1/2 border-2 border-[#d1c8ae] bg-[#20282a]/95 p-5 shadow-[5px_5px_0_#0b0c0e] sm:top-16 sm:p-7" onSubmit={onSubmit}>
      <div className="border-b border-[#70786e] pb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#b7cbb7]">Reply / save your seat</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b7cbb7]">Your name<input name="guestName" className="mt-2 w-full border border-[#889187] bg-[#313a3b] px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#f1eee4] outline-none focus:border-[#d1c8ae]" value={form.name} onChange={updateForm("name")} placeholder="Full name" required /></label>
        <label className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b7cbb7]">Guests<select className="mt-2 w-full border border-[#889187] bg-[#313a3b] px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#f1eee4] outline-none focus:border-[#d1c8ae]" value={form.guests} onChange={updateForm("guests")}><option value="1">Just me</option><option value="2">Me + 1</option><option value="3">Me + 2</option></select></label>
      </div>
      <fieldset className="mt-4"><legend className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b7cbb7]">Attendance</legend><div className="mt-2 grid gap-2 sm:grid-cols-2"><label className={`border px-3 py-3 text-sm ${form.attendance === "yes" ? "border-[#b7cbb7] bg-[#506157] text-[#f1eee4]" : "border-[#889187] bg-[#313a3b] text-[#b9c2b8]"}`}><input className="mr-2" type="radio" name="attendance" value="yes" checked={form.attendance === "yes"} onChange={updateForm("attendance")} />I’ll be there</label><label className={`border px-3 py-3 text-sm ${form.attendance === "no" ? "border-[#b7cbb7] bg-[#506157] text-[#f1eee4]" : "border-[#889187] bg-[#313a3b] text-[#b9c2b8]"}`}><input className="mr-2" type="radio" name="attendance" value="no" checked={form.attendance === "no"} onChange={updateForm("attendance")} />Can’t make it</label></div></fieldset>
      <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.14em] text-[#b7cbb7]">Note <span className="font-normal normal-case tracking-normal text-[#9aa69b]">(optional)</span><textarea className="mt-2 min-h-20 w-full border border-[#889187] bg-[#313a3b] px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#f1eee4] outline-none focus:border-[#d1c8ae]" value={form.note} onChange={updateForm("note")} placeholder="Leave a message for the couple..." /></label>
      <button className="!bg-[#5b6258] !text-[#f0ead9] mt-5 w-full border-2 border-[#d1c8ae] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0b0c0e] transition hover:!bg-[#707b70]" type="button" onClick={(event) => onSubmit({ preventDefault: () => event.preventDefault(), currentTarget: event.currentTarget.form })}>Submit RSVP</button>
    </form>
  );
}

function ThankYouPanel({ form, onRestart }) {
  return <div className="absolute left-1/2 top-24 z-20 w-[min(600px,88%)] -translate-x-1/2 border-2 border-[#d1c8ae] bg-[#212a2b]/95 p-7 text-center shadow-[5px_5px_0_#0b0c0e] sm:p-10"><div className="text-3xl text-[#b7cbb7]">♥</div><div className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#b7cbb7]">RSVP recorded</div><h2 className="mt-3 font-serif text-3xl text-[#f1eee4]">See you at the wedding, {form.name.split(" ")[0]}.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c6cec5]">Your response is saved on this device. The story continues at The Garden House.</p><button className="!bg-[#414746] !text-[#f0ead9] mt-6 border border-[#d1c8ae] px-4 py-3 text-xs font-black uppercase tracking-[0.14em]" type="button" onClick={onRestart}>Restart story</button></div>;
}

function DeclinePanel({ onRestart }) {
  return <div className="absolute left-1/2 top-28 z-20 w-[min(560px,88%)] -translate-x-1/2 border-2 border-[#d1c8ae] bg-[#212a2b]/95 p-7 text-center shadow-[5px_5px_0_#0b0c0e] sm:p-10"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b7cbb7]">Scene paused</div><h2 className="mt-3 font-serif text-3xl text-[#f1eee4]">We’ll miss you.</h2><p className="mt-3 text-sm leading-6 text-[#c6cec5]">Thank you for letting us know. You can replay the invitation anytime.</p><button className="!bg-[#414746] !text-[#f0ead9] mt-6 border border-[#d1c8ae] px-4 py-3 text-xs font-black uppercase tracking-[0.14em]" type="button" onClick={onRestart}>Replay invitation</button></div>;
}

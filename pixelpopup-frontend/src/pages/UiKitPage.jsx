import React, { useState } from "react";
import { overlay } from "../ui/overlay";
import { Window, RetroButton, RetroInput, RetroPanel, RetroSlider, RetroIconButton, RetroLoading, Typewriter, TypewriterPanel, RetroChoicePanel, RetroPasswordGatePanel, RetroTimelinePanel, RetroMapPanel, RetroQuizPanel, RetroMediaLyricPanel   } from "../ui/retro";

import { Star, Heart, MousePointerClick, Sparkles, Music, X, MapPin } from "lucide-react";

export default function UiKitPage() {
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [vol, setVol] = useState(35);

  const testToast = () => {
  overlay.toast({ type: "success", message: "Saved successfully!" });
  overlay.effect({ type: "vhs", ms: 1200, strength: 12, aberration: 3, noise: 0.15 });
  overlay.effect({ type: "sfx", name: "success" });
};

const testModal = () => {
  overlay.showModal({
    title: "CONFIRM",
    subtitle: "Proceed with romance.exe?",
    content: <div className="font-pp font-extrabold">Are you sure?</div>,
    showDefaultActions: true,
    onConfirm: () => overlay.toast({ type: "info", message: "Confirmed!" }),
  });
};

const testLoading = () => {
  overlay.showLoading({ title: "LOADING", subtitle: "Spawning confetti…" });
  setTimeout(() => overlay.hideLoading(), 1500);
};

  return (
    <div className="min-h-screen pp-retro-bg w-screen">
      <div className="mx-auto max-w-full px-4 py-10">
        <div className="mb-6">
          <div className="font-pp text-2xl md:text-4xl font-black text-white drop-shadow">
            PixelPopup.exe UI Kit
          </div>
          <div className="font-pp text-white/80 mt-1">
            Retro windows + buttons + inputs + panels (highly customizable props)
          </div>
        </div>
{/* 
<RetroMediaLyricPanel
  title="LOVE_EDIT.MP4"
  media={{ type: "video", url: "/andrea.mp4", loop: true, muted: false }}
  allowTapSpawn
  tapSpawnPreset={{ emoji: "💖", size: 52, anim: "pop", durationMs: 900 }}
  lyrics={[
    { t: 0.5, text: "hi love...", effects: [{ type: "crt", ms: 900 }] },
    { t: 2.0, text: "i have something to ask 😳", effects: [{ type: "sfx", name: "beep" }] },
    { t: 4.2, text: "will you be my valentine?", effects: [{ type: "vhs", ms: 900, strength: 12 }] },
  ]}
  stickers={[
    { t: 1.8, emoji: "✨", x: 22, y: 40, size: 60, anim: "pop", durationMs: 900 },
    {
      t: 4.2,
      emoji: "💘",
      x: 72,
      y: 45,
      size: 80,
      anim: "zoomIn",
      durationMs: 1200,
      clickable: true,
      effects: [{ type: "confetti", doubleBurst: true }],
      onClick: () => overlay.toast({ type: "success", message: "KILIG MODE ACTIVATED" }),
    },
  ]}
/> */}

<RetroMediaLyricPanel
  title="EDIT.YT"
  useYouTubeApi
  allowTapSpawn
  media={{
    type: "video", url: "/andrea.mp4",
    start: 12,
    loop: true,
    muted: true, // mute youtube so bg music is clean
  }}
  bgMusic={{
    url: "/mine.mp3",
    volume: 0.65,
    loop: true,
    autoplay: true,
    startAt: 1, // sync-ish start
  }}
  lyrics={[
    { t: 12.5, text: "hi love..." },
    { t: 14.0, text: "watch this part 😳", effects: [{ type: "vhs", ms: 800 }] },
  ]}
    stickers={[
    { t: 1.8, emoji: "✨", x: 22, y: 40, size: 60, anim: "pop", durationMs: 900 },
    {
      t: 4.2,
      emoji: "💘",
      x: 72,
      y: 45,
      size: 80,
      anim: "zoomIn",
      durationMs: 1200,
      clickable: true,
      effects: [{ type: "confetti", doubleBurst: true }],
      onClick: () => overlay.toast({ type: "success", message: "KILIG MODE ACTIVATED" }),
    },
  ]}
/>

<RetroQuizPanel
  title="ANNIVERSARY CHECK"
  question="When is our anniversary?"
  answers={[
    { label: "Feb 14", correct: true },
    { label: "March 3", correct: false },
    { label: "June 21", correct: false },
  ]}
  explanation="Good memory 😌"
  maxAttempts={3}
  onCorrect={() => {
    overlay.effect({ type: "confetti" });
  }}
/>

<RetroMapPanel
  showSidebar
  title="SPECIAL PLACES"
  popupTitle="MEMORY"
  defaultSelectedId="how-we-met"
  initialZoom={13}
  onSelect={(place) => console.log("Selected:", place.title)}
  places={[
    {
      id: "how-we-met",
      title: "How We Met",
      subtitle: "Coffee shop",
      badge: "Chapter 1",
      description:
        "This is where everything started. It matters because it’s the moment two strangers became part of the same story.",
      lng: 125.6128,
      lat: 7.0731,
      mediaUrl:
        "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
      mediaType: "image",
      actions: [
        {
          label: "Replay Memory",
          kind: "primary",
          onClick: (place) => console.log("Replay:", place.id),
        },
      ],
    },
    {
      id: "first-date",
      title: "First Date",
      subtitle: "Dinner night",
      badge: "Chapter 2",
      description:
        "Our first real date. It’s important because it’s when we chose to show up for each other on purpose.",
      lng: 125.6062,
      lat: 7.0653,
      mediaUrl:
        "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80",
      mediaType: "image",
      actions: [
        {
          label: "Drop 💖",
          kind: "secondary",
          onClick: (place) => console.log("Heart for:", place.title),
        },
      ],
    },
    {
      id: "proposal-spot",
      title: "Proposal Spot",
      subtitle: "The Big Question",
      badge: "Finale",
      description:
        "This location matters because it’s where a memory becomes a promise — and your timeline becomes a future.",
      lng: 125.6214,
      lat: 7.0795,
      mediaUrl:
        "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1200&q=80",
      mediaType: "image",
      actions: [
        {
          label: "Celebrate 🎉",
          kind: "primary",
          onClick: (place) => console.log("Celebrate:", place.id),
        },
      ],
    },
  ]}
/>

<RetroTimelinePanel
  title="OUR STORY.LOG"
  items={[
    {
      id: "first-chat",
      date: "2023-07-18",
      title: "First chat",
      subtitle: "The start of pixel romance.",
      description: "We talked until 3AM and my phone battery died.",
      icon: <Heart size={18} strokeWidth={3} />,
      actions: [
        {
          label: "Celebrate",
          kind: "primary",
          onClick: () => {
            overlay.effect({ type: "confetti", doubleBurst: true });
            overlay.effect({ type: "sfx", name: "success" });
          },
        },
      ],
    },
    {
      id: "first-date",
      date: "2023-08-02",
      title: "First date spot",
      subtitle: "The legendary location unlock.",
      mediaUrl: "/demo/first-date.jpg",
      mediaType: "image",
      icon: <MapPin size={18} strokeWidth={3} />,
      actions: [
        {
          label: "VHS flashback",
          kind: "secondary",
          onClick: () => overlay.effect({ type: "vhs", ms: 1200, strength: 12 }),
        },
        {
          label: "Open modal",
          kind: "ghost",
          onClick: () =>
            overlay.showModal({
              title: "MEMORY",
              subtitle: "first date",
              content: <div className="font-pp font-extrabold">Insert cute story here.</div>,
              showDefaultActions: true,
            }),
        },
      ],
    },
  ]}
/>

    <RetroPasswordGatePanel
  title="PRIVATE LINK"
  prompt="This page is password-protected."
  hint="anniversary date"
  expectedPassword="0214"
  onSuccess={() => {
    // navigate, or set "unlocked" state, or load next scene
  }}
/>

<div id="warning-window">


        <RetroChoicePanel
  title="VALENTINE PROMPT"
  intro={<div className="font-pp text-sm font-extrabold">Will you be my Valentine?</div>}
  choices={[
    {
      id: "yes",
      label: "YES 💖",
      description: "Unlock the good ending",
      kind: "primary",
      icon: <Heart size={18} strokeWidth={3} />,
      onSelect: () => {
        overlay.effect({ type: "confetti", doubleBurst: true });
        overlay.effect({ type: "sfx", name: "success" });
        overlay.toast({ type: "success", message: "Good ending unlocked!" });
      },
    },
    {
      id: "no",
      label: "NO 😭",
      description: "Danger route…",
      kind: "danger",
      icon: <X size={18} strokeWidth={3} />,
      onSelect: () => {
        overlay.effect({ type: "vhs", ms: 900, strength: 12 });
        overlay.effect({ type: "sfx", name: "error" });
        overlay.effect({ type: "windowShake", selector: "#warning-window", ms: 500, intensity: 10 });
        overlay.showModal({
          title: "ERROR",
          subtitle: "romance.exe has crashed",
          content: <div className="font-pp font-extrabold">You can’t say no 😈</div>,
          showDefaultActions: true,
          confirmText: "OK",
        });
      },
    },
  ]}
/>
</div>

        <TypewriterPanel
        title="LOVE LETTER.TXT"
        rightSlot={<span className="font-pp text-xs opacity-70">draft_03</span>}
        text={"Hi love...\n\nWill you be my Valentine?\n\n(Click text to skip typing.)"}
        beepEnabled
        speedMs={50}
        onSecondary={() => overlay.toast({ type: "info", message: "Skipped typing." })}
        onPrimary={() => {
            overlay.effect({ type: "confetti", doubleBurst: true });
            overlay.effect({ type: "sfx", name: "success" });
        }}
        primaryText="Continue"
        secondaryText="Skip"
        className="my-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left big window */}
          {/* <Typewriter
            className="text-white text-sm"
            text={"PixelPopup.exe is typing...\nClick to skip."}
            beepEnabled
          /> */}

          <div className="lg:col-span-7">
            <Window
              title="Bring Back THE 90's"
              subtitle="Music Party Night • Thursday 9:00 PM - 1:00 AM"
              maxWidthClass="max-w-none"
              rightSlot={
                <div className="flex items-center gap-2">
                  <RetroIconButton title="Star" icon={<Star size={18} strokeWidth={3} />} />
                    <RetroIconButton title="Heart" icon={<Heart size={18} strokeWidth={3} />} />
                </div>
              }
              footer={
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="font-pp text-sm opacity-80">
                    Status: <span className="font-extrabold">Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RetroButton variant="secondary" onClick={testModal}>Preview</RetroButton>
                    <RetroButton onClick={testToast}>Launch</RetroButton>
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <RetroLoading progressMode="determinate" progress={100} /> */}
                <RetroPanel
                  title="Invite Settings"
                  rightSlot={<span className="font-pp text-xs opacity-70">v1.0</span>}
                >
                  <div className="space-y-4">
                    <RetroInput
                      label="Recipient name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Ashley Nicole"
                      rightSlot={<span className="font-pp text-xs opacity-70">.txt</span>}
                    />

                    <RetroInput
                      label="Page password"
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="••••••"
                      type="password"
                      hint="Optional. Enable if you want it private."
                    />

                    <div className="flex items-center gap-2">
                      <RetroButton variant="secondary" className="flex-1">
                        Cancel
                      </RetroButton>
                      <RetroButton className="flex-1" onClick={testLoading}>Save</RetroButton>
                    </div>
                  </div>
                </RetroPanel>

                <RetroPanel title="Audio Mixer">
                  <div className="space-y-4">
                    <RetroSlider label="Volume" value={vol} onChange={(e) => setVol(Number(e.target.value))} />
                    <div className="grid grid-cols-2 gap-2">
                      <RetroButton variant="secondary">Play</RetroButton>
                      <RetroButton variant="secondary">Stop</RetroButton>
                      <RetroButton variant="ghost">Loop: Off</RetroButton>
                      <RetroButton variant="ghost">FX: On</RetroButton>
                    </div>
                  </div>
                </RetroPanel>
              </div>
            </Window>
          </div>

          {/* Right stack */}
          <div className="lg:col-span-5 space-y-6">
            <Window
              title="WARNING"
              subtitle="FILE CORRUPTED"
              titlebarGradient={false}
              titlebarSolidBg="var(--pp-danger)"
              maxWidthClass="max-w-none"
            >
              <div className="font-pp font-extrabold">
                This is a demo warning box.
              </div>
              <div className="mt-2 font-pp text-sm opacity-80">
                Perfect for jump-scare prompts, fake OS alerts, or comedic popups.
              </div>

              <div className="mt-4 flex items-center gap-2">
                <RetroButton variant="secondary" className="flex-1">Try Again</RetroButton>
                <RetroButton variant="danger" className="flex-1">Format</RetroButton>
              </div>
            </Window>

            <Window
              title="Pixel Tools"
              subtitle="Buttons / badges / stickers"
              maxWidthClass="max-w-none"
            >
              <div className="flex flex-wrap gap-3">
                <RetroButton>OK</RetroButton>
                <RetroButton variant="secondary">Cancel</RetroButton>
                <RetroButton variant="danger">Delete</RetroButton>
                <RetroButton variant="ghost">Ghost</RetroButton>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <RetroIconButton title="Cursor" icon={<MousePointerClick size={18} strokeWidth={3} />} />
                <RetroIconButton title="Sparkle" icon={<Sparkles size={18} strokeWidth={3} />} />
                <RetroIconButton title="Music" icon={<Music size={18} strokeWidth={3} />} />
              </div>

              <div className="mt-5">
                <RetroPanel title="Sticker Area" bg="rgba(255,255,255,0.9)">
                    <RetroButton onClick={() => overlay.effect({ type: "confetti", doubleBurst: true })}>
                Confetti
                </RetroButton>
                <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "shake" })}>
                Shake
                </RetroButton>
                <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "flash" })}>
                Flash
                </RetroButton>
                <RetroButton variant="danger" onClick={() => overlay.effect({ type: "glitch" })}>
                Glitch
                </RetroButton>
                <RetroButton variant="ghost" onClick={() => overlay.effect({ type: "cursorTrail" })}>
                Cursor Trail
                </RetroButton>
                  <div className="flex items-center justify-between">
                    <span className="font-pp font-extrabold">TONIGHT</span>
                    <span className="font-pp text-sm opacity-70">★ ★ ★ ★ ☆</span>
                  </div>
                </RetroPanel>
              </div>
            </Window>
          </div>
        </div>
      </div>
    </div>
  );
}

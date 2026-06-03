// src/engine/flows/megaDemoFlow.js
export const megaDemoFlow = {
  id: "mega-demo",
  start: "boot",

  nodes: {
    // -------------------------------------------------
    // BOOT (Typewriter)
    // -------------------------------------------------
    boot: {
      scene: "TypewriterPanel",
      mutations: [
        { type: "set", path: "vars.unlocked", value: false },
        { type: "set", path: "vars.vipVisited", value: false },
        { type: "set", path: "vars.score", value: 0 },
        { type: "set", path: "vars.attempts", value: 0 },
        { type: "set", path: "vars.badges", value: [] },
        { type: "set", path: "vars.lastPlaceId", value: null },
        { type: "set", path: "vars.lastTimelineId", value: null },
      ],
      props: {
        title: "MEGA_DEMO_BOOT.LOG",
        text:
          "Welcome to the MEGA Demo.\n\nThis flow exercises:\n- Choice\n- Password Gate\n- Quiz\n- Timeline\n- Map\n- Media Lyric\n\nAnd vars/guards/mutations.\n\nClick Continue.",
        primaryText: "Continue",
        secondaryText: "Skip",
      },
      on: {
        primary: "hub",
        secondary: "hub",
      },
    },

    // -------------------------------------------------
    // HUB (Choice)
    // -------------------------------------------------
    hub: {
      scene: "ChoicePanel",
      props: {
        title: "HUB.EXE",
        intro: "Pick a module to test:",
        choices: [
          { id: "quiz", label: "Quiz Module", description: "Score + unlock path." },
          { id: "gate", label: "Password Gate", description: "Unlock VIP access." },
          { id: "timeline", label: "Timeline", description: "Work experience feed." },
          { id: "map", label: "Map", description: "Select places, track last selection." },
          { id: "media", label: "Media/Lyric", description: "Video + lyrics + stickers." },
          { id: "vip", label: "VIP Route", description: "Guarded by unlocked=true." },
          { id: "end", label: "End Demo", description: "Go to summary/endings." },
        ],
      },
      on: {
        "select:quiz": "quizIntro",
        "select:gate": "gateIntro",
        "select:timeline": "timeline",
        "select:map": "map",
        "select:media": "media",
        "select:vip": [
          { when: { var: "unlocked", eq: true }, to: "vip" },
          { to: "lockedVip" },
        ],
        "select:end": "summary",
      },
    },

    // -------------------------------------------------
    // QUIZ INTRO (Typewriter)
    // -------------------------------------------------
    quizIntro: {
      scene: "TypewriterPanel",
      props: {
        title: "QUIZ_MODULE.README",
        text:
          "Answer correctly to gain score and unlock VIP.\nWrong answers reduce score.\n\nProceed?",
        primaryText: "Start Quiz",
        secondaryText: "Back",
      },
      on: {
        primary: "quiz",
        secondary: "hub",
      },
    },

    // -------------------------------------------------
    // QUIZ (QuizPanel)
    // -------------------------------------------------
    quiz: {
      scene: "QuizPanel",
      mutations: [{ type: "inc", path: "vars.attempts", by: 1 }],
      props: {
        title: "SKILL_CHECK.EXE",
        question: "What is 8 + 7 ?",
        answers: [
          { label: "14", correct: false },
          { label: "15", correct: true },
          { label: "16", correct: false },
        ],
        explanation: "Correct answer is 15.",
        maxAttempts: 3,
      },
      on: {
        correct: {
          to: "quizWin",
          mutations: [
            { type: "inc", path: "vars.score", by: 15 },
            { type: "set", path: "vars.unlocked", value: true },
            { type: "push", path: "vars.badges", value: "quiz_passed" },
          ],
        },
        wrong: {
          to: "quizLose",
          mutations: [
            { type: "inc", path: "vars.score", by: -5 },
            { type: "push", path: "vars.badges", value: "quiz_wrong" },
          ],
        },
        done: "hub",
      },
    },

    quizWin: {
      scene: "TypewriterPanel",
      props: {
        title: "QUIZ_SUCCESS",
        text: "Correct!\n\nScore increased and VIP unlocked.\nReturn to hub.",
        primaryText: "Back to Hub",
      },
      on: { primary: "hub" },
    },

    quizLose: {
      scene: "TypewriterPanel",
      props: {
        title: "QUIZ_FAIL",
        text: "Wrong.\n\nScore decreased.\nTry again or return to hub.",
        primaryText: "Try Again",
        secondaryText: "Back",
      },
      on: {
        primary: "quiz",
        secondary: "hub",
      },
    },

    // -------------------------------------------------
    // PASSWORD GATE INTRO (Typewriter)
    // -------------------------------------------------
    gateIntro: {
      scene: "TypewriterPanel",
      props: {
        title: "GATE_MODULE.README",
        text:
          "Enter password to unlock VIP.\nHint: 0214 (demo)\n\nProceed?",
        primaryText: "Open Gate",
        secondaryText: "Back",
      },
      on: { primary: "gate", secondary: "hub" },
    },

    // -------------------------------------------------
    // PASSWORD GATE (PasswordGatePanel)
    // NOTE: your panel must call onSuccess/onFail/onCancel
    // SceneEngine already wires those into engine events.
    // -------------------------------------------------
    gate: {
      scene: "PasswordGatePanel",
      props: {
        title: "PRIVATE_LINK",
        prompt: "This area is password-protected.",
        hint: "demo: 0214",
        expectedPassword: "0214",
      },
      on: {
        success: {
          to: "gateSuccess",
          mutations: [
            { type: "set", path: "vars.unlocked", value: true },
            { type: "push", path: "vars.badges", value: "gate_unlocked" },
          ],
        },
        fail: {
          to: "gateFail",
          mutations: [{ type: "inc", path: "vars.score", by: -2 }],
        },
        cancel: "hub",
      },
    },

    gateSuccess: {
      scene: "TypewriterPanel",
      props: {
        title: "ACCESS_GRANTED",
        text: "Password accepted.\nVIP unlocked.\nBack to hub.",
        primaryText: "Back to Hub",
      },
      on: { primary: "hub" },
    },

    gateFail: {
      scene: "TypewriterPanel",
      props: {
        title: "ACCESS_DENIED",
        text: "Wrong password.\nScore small penalty.\nTry again?",
        primaryText: "Try Again",
        secondaryText: "Back",
      },
      on: { primary: "gate", secondary: "hub" },
    },

    // -------------------------------------------------
    // TIMELINE (TimelinePanel)
    // NOTE: your TimelinePanel must support onSelect(item) OR per-action onClick
    // We'll use onSelect route keys: select:<id>
    // -------------------------------------------------
    timeline: {
      scene: "TimelinePanel",
      props: {
        title: "WORK_TIMELINE.LOG",
        items: [
          {
            id: "job1",
            date: "2022-01-01",
            title: "Frontend Lead",
            subtitle: "React / UI Systems",
            description: "Built component libraries, overlays, and motion systems.",
            actions: [
              { label: "Mark Done", kind: "primary" },
              { label: "Back", kind: "ghost" },
            ],
          },
          {
            id: "job2",
            date: "2023-06-01",
            title: "Fullstack Developer",
            subtitle: "React + Django",
            description: "APIs, auth, dashboards, realtime features.",
            actions: [{ label: "Mark Done", kind: "primary" }],
          },
          {
            id: "job3",
            date: "2024-09-01",
            title: "Senior FullStack",
            subtitle: "Product + UX + Systems",
            description: "Built flows, authoring, and reusable UI scenes.",
            actions: [{ label: "Mark Done", kind: "primary" }],
          },
        ],
      },
      on: {
        // if your TimelinePanel emits select:<id>, we track it
        "select:job1": {
          to: "timelinePicked",
          mutations: [
            { type: "set", path: "vars.lastTimelineId", value: "job1" },
            { type: "push", path: "vars.badges", value: "timeline_job1" },
          ],
        },
        "select:job2": {
          to: "timelinePicked",
          mutations: [
            { type: "set", path: "vars.lastTimelineId", value: "job2" },
            { type: "push", path: "vars.badges", value: "timeline_job2" },
          ],
        },
        "select:job3": {
          to: "timelinePicked",
          mutations: [
            { type: "set", path: "vars.lastTimelineId", value: "job3" },
            { type: "push", path: "vars.badges", value: "timeline_job3" },
          ],
        },
        // fallback if the panel emits generic select
        select: {
          to: "timelinePicked",
          mutations: [{ type: "set", path: "vars.lastTimelineId", value: "{{vars.lastTimelineId}}" }],
        },
        default: "hub",
      },
    },

    timelinePicked: {
      scene: "TypewriterPanel",
      props: {
        title: "TIMELINE_EVENT",
        text:
          "Timeline item selected.\n\nReturning to hub.",
        primaryText: "Back to Hub",
      },
      on: { primary: "hub" },
    },

    // -------------------------------------------------
    // MAP (MapPanel)
    // -------------------------------------------------
    map: {
      scene: "MapPanel",
      props: {
        showSidebar: true,
        title: "PLACES.DAT",
        popupTitle: "PLACE",
        defaultSelectedId: "hq",
        initialZoom: 12,
        places: [
          {
            id: "hq",
            title: "HQ",
            subtitle: "Main base",
            badge: "WORK",
            description: "Main working hub / office location.",
            lng: 125.6128,
            lat: 7.0731,
            mediaUrl:
              "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
            mediaType: "image",
          },
          {
            id: "client",
            title: "Client Site",
            subtitle: "Deployments",
            badge: "OPS",
            description: "Where releases happen and bugs appear.",
            lng: 125.6062,
            lat: 7.0653,
            mediaUrl:
              "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80",
            mediaType: "image",
          },
          {
            id: "lab",
            title: "R&D Lab",
            subtitle: "Experiments",
            badge: "RND",
            description: "Prototype playground for new modules.",
            lng: 125.6214,
            lat: 7.0795,
            mediaUrl:
              "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1200&q=80",
            mediaType: "image",
          },
        ],
      },
      on: {
        "select:hq": {
          to: "mapPicked",
          mutations: [
            { type: "set", path: "vars.lastPlaceId", value: "hq" },
            { type: "inc", path: "vars.score", by: 1 },
          ],
        },
        "select:client": {
          to: "mapPicked",
          mutations: [
            { type: "set", path: "vars.lastPlaceId", value: "client" },
            { type: "inc", path: "vars.score", by: 2 },
          ],
        },
        "select:lab": {
          to: "mapPicked",
          mutations: [
            { type: "set", path: "vars.lastPlaceId", value: "lab" },
            { type: "inc", path: "vars.score", by: 3 },
          ],
        },
        default: "hub",
      },
    },

    mapPicked: {
      scene: "TypewriterPanel",
      props: {
        title: "MAP_SELECT",
        text: "Place selected.\nScore updated.\nBack to hub.",
        primaryText: "Back to Hub",
      },
      on: { primary: "hub" },
    },

    // -------------------------------------------------
    // MEDIA (MediaLyricPanel)
    // -------------------------------------------------
    media: {
      scene: "MediaLyricPanel",
      props: {
        title: "MEDIA_TEST.MP4",
        media: { type: "video", url: "/andrea.mp4", loop: true, muted: true },
        bgMusic: { url: "/mine.mp3", volume: 0.5, loop: true, autoplay: true, startAt: 1 },
        allowTapSpawn: true,
        tapSpawnPreset: { emoji: "✨", size: 52, anim: "pop", durationMs: 900 },
        lyrics: [
          { t: 0.4, text: "testing lyric sync...", effects: [{ type: "crt", ms: 900 }] },
          { t: 2.0, text: "spawn sticker on tap 👇", effects: [{ type: "sfx", name: "beep" }] },
          { t: 4.0, text: "done demo", effects: [{ type: "confetti", doubleBurst: true }] },
        ],
        stickers: [
          { t: 1.2, emoji: "💖", x: 25, y: 45, size: 60, anim: "pop", durationMs: 900 },
          { t: 2.2, emoji: "🔥", x: 70, y: 50, size: 70, anim: "zoomIn", durationMs: 1200 },
        ],
      },
      on: {
        done: {
          to: "hub",
          mutations: [{ type: "push", path: "vars.badges", value: "media_done" }],
        },
        default: "hub",
      },
    },

    // -------------------------------------------------
    // VIP LOCKED (Typewriter)
    // -------------------------------------------------
    lockedVip: {
      scene: "TypewriterPanel",
      props: {
        title: "VIP_LOCKED",
        text:
          "VIP route is locked.\n\nComplete Quiz or Password Gate first.",
        primaryText: "Back",
      },
      on: { primary: "hub" },
    },

    // -------------------------------------------------
    // VIP (Typewriter with branching based on score)
    // -------------------------------------------------
    vip: {
      scene: "TypewriterPanel",
      mutations: [
        { type: "toggle", path: "vars.vipVisited" },
        { type: "push", path: "vars.badges", value: "vip_entered" },
      ],
      props: {
        title: "VIP_ACCESS_GRANTED",
        text:
          "Welcome to VIP.\n\nThis node toggles vipVisited and grants a badge.\n\nContinue to ending evaluation.",
        primaryText: "Evaluate Ending",
        secondaryText: "Back to Hub",
      },
      on: {
        secondary: "hub",
        primary: [
          { when: { var: "score", gte: 20 }, to: "endingGood" },
          { when: { var: "score", gte: 10 }, to: "endingNeutral" },
          { to: "endingLow" },
        ],
      },
    },

    // -------------------------------------------------
    // SUMMARY (Typewriter) + Ending routes
    // -------------------------------------------------
    summary: {
      scene: "TypewriterPanel",
      props: {
        title: "SUMMARY.DAT",
        text:
          "Demo summary:\n\n- You can revisit Hub anytime.\n- Endings depend on score + VIP.\n\nProceed to ending evaluation.",
        primaryText: "Evaluate Ending",
        secondaryText: "Back",
      },
      on: {
        secondary: "hub",
        primary: [
          { when: { var: "unlocked", eq: true }, to: "vip" },
          { to: "endingLow" },
        ],
      },
    },

    endingGood: {
      scene: "TypewriterPanel",
      props: {
        title: "GOOD_ENDING",
        text:
          "High score achieved.\n\nYou mastered the engine.\n\n(Done)",
        primaryText: "Done",
      },
      on: { primary: "done" },
    },

    endingNeutral: {
      scene: "TypewriterPanel",
      props: {
        title: "NEUTRAL_ENDING",
        text:
          "VIP reached.\nScore is decent.\n\n(Done)",
        primaryText: "Done",
      },
      on: { primary: "done" },
    },

    endingLow: {
      scene: "TypewriterPanel",
      props: {
        title: "LOW_ENDING",
        text:
          "Low score / VIP not unlocked.\n\nTry Quiz or Password Gate.\n\n(Done)",
        primaryText: "Back to Hub",
        secondaryText: "Done",
      },
      on: { primary: "hub", secondary: "done" },
    },
  },
};

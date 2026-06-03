import React from "react";
import { Heart, MapPin, Briefcase } from "lucide-react";

export const demoFlow = {
  id: "demo",
  start: "intro",
  scenes: [
    {
      id: "intro",
      kind: "typewriter",
      props: (vars, engine) => ({
        title: "SCENE_ENGINE.TXT",
        text:
          "Welcome.\n\nThis is the core SceneEngine.\nIt mounts panels as scenes, supports branching, and triggers overlay effects.",
        beepEnabled: true,
        speedMs: 32,
        primaryText: "Continue",
        secondaryText: "Skip",
        onPrimary: () => engine.next(),
        onSecondary: () => engine.next(),
      }),
      effects: [
        { type: "effect", payload: { type: "crt", ms: 900 } },
        { type: "effect", payload: { type: "sfx", name: "beep", volume: 0.05 } },
      ],
    },

    {
      id: "choose",
      kind: "choice",
      props: (vars, engine) => ({
        title: "ROUTE_SELECT.EXE",
        intro: <div className="font-pp text-sm font-extrabold">Pick a route:</div>,
        choices: [
          {
            id: "work",
            label: "WORK EXPERIENCE",
            description: "Timeline panel route",
            kind: "primary",
            icon: <Briefcase size={18} strokeWidth={3} />,
            onSelect: () => engine.next("work"),
          },
          {
            id: "map",
            label: "MAP ROUTE",
            description: "Map panel route",
            kind: "secondary",
            icon: <MapPin size={18} strokeWidth={3} />,
            onSelect: () => engine.next("map"),
          },
        ],
      }),
      branches: {
        work: "timeline",
        map: "map",
      },
    },

    {
      id: "timeline",
      kind: "timeline",
      props: (vars, engine) => ({
        title: "WORK_EXPERIENCE.LOG",
        items: [
          {
            id: "a",
            date: "2024 – Present",
            title: "Senior FullStack Developer",
            subtitle: "Frontend-heavy • UI systems",
            description: "Built interactive overlays, panels, and reusable UI foundations.",
            icon: <Heart size={18} strokeWidth={3} />,
            actions: [
              {
                label: "Celebrate",
                kind: "primary",
                onClick: () => {
                  engine.overlay.effect({ type: "confetti", doubleBurst: true });
                  engine.overlay.effect({ type: "sfx", name: "success" });
                },
              },
              {
                label: "Next",
                kind: "secondary",
                onClick: () => engine.next(),
              },
            ],
          },
        ],
      }),
      next: "end",
    },

    {
      id: "map",
      kind: "map",
      props: (vars, engine) => ({
        showSidebar: true,
        title: "PLACES.MAP",
        popupTitle: "DETAILS",
        defaultSelectedId: "base",
        initialZoom: 12,
        places: [
          {
            id: "base",
            title: "Home Base",
            subtitle: "Davao City",
            badge: "PH",
            description: "Remote-first, building UI systems and product experiences.",
            lng: 125.6128,
            lat: 7.0731,
            mediaType: "image",
            mediaUrl:
              "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
            actions: [
              {
                label: "Next",
                kind: "primary",
                onClick: () => engine.next(),
              },
            ],
          },
        ],
      }),
      next: "end",
    },

    {
      id: "end",
      kind: "typewriter",
      props: (vars, engine) => ({
        title: "END.LOG",
        text: "Flow ended.\n\nNext: we’ll add a BranchingFlow authoring format + persistence.\n",
        beepEnabled: true,
        speedMs: 28,
        primaryText: "Restart",
        secondaryText: "Close",
        onPrimary: () => engine.restart(),
        onSecondary: () => {
          engine.overlay.toast({ type: "info", message: "Done." });
        },
      }),
      effects: [{ type: "effect", payload: { type: "vhs", ms: 700, strength: 12 } }],
    },
  ],
};

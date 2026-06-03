// src/engine/flows/advancedDemoFlow.js

export const advancedDemoFlow = {
  id: "advanced-demo",
  start: "intro",

  nodes: {

    // -------------------------------------------------
    // INTRO
    // -------------------------------------------------
    intro: {
      scene: "TypewriterPanel",
      mutations: [
        { type: "set", path: "vars.unlocked", value: false },
        { type: "set", path: "vars.score", value: 0 },
      ],
      props: {
        title: "SYSTEM_BOOT.LOG",
        text:
          "Welcome to the Branching Engine Demo.\n\nCan you unlock the VIP route?",
        primaryText: "Continue",
      },
      on: {
        primary: "routeSelect",
      },
    },

    // -------------------------------------------------
    // ROUTE SELECT
    // -------------------------------------------------
    routeSelect: {
      scene: "ChoicePanel",
      props: {
        title: "ROUTE_SELECT.EXE",
        intro: "Pick a route:",
        choices: [
          {
            id: "normal",
            label: "Normal Route",
            description: "Safe path.",
          },
          {
            id: "vip",
            label: "VIP Route",
            description: "Requires unlock.",
          },
        ],
      },

      on: {
        "select:normal": "quiz",

        "select:vip": [
          {
            when: { var: "unlocked", eq: true },
            to: "vipNode",
          },
          {
            to: "locked",
          },
        ],
      },
    },

    // -------------------------------------------------
    // LOCKED SCREEN
    // -------------------------------------------------
    locked: {
      scene: "TypewriterPanel",
      props: {
        title: "ACCESS_DENIED",
        text: "VIP route is locked.\n\nAnswer the quiz correctly first.",
        primaryText: "Go Back",
      },
      on: {
        primary: "routeSelect",
      },
    },

    // -------------------------------------------------
    // QUIZ NODE
    // -------------------------------------------------
    quiz: {
      scene: "QuizPanel",
      props: {
        title: "SKILL_CHECK.EXE",
        question: "2 + 2 = ?",
        answers: [
          { label: "3", correct: false },
          { label: "4", correct: true },
        ],
        maxAttempts: 2,
      },

      on: {
        correct: {
          to: "unlockSuccess",
          mutations: [
            { type: "set", path: "vars.unlocked", value: true },
            { type: "inc", path: "vars.score", by: 10 },
          ],
        },

        wrong: {
          to: "wrongAnswer",
          mutations: [
            { type: "inc", path: "vars.score", by: -5 },
          ],
        },
      },
    },

    // -------------------------------------------------
    // WRONG ANSWER
    // -------------------------------------------------
    wrongAnswer: {
      scene: "TypewriterPanel",
      props: {
        title: "WRONG_INPUT",
        text: "Incorrect.\nScore penalized.",
        primaryText: "Try Again",
      },
      on: {
        primary: "quiz",
      },
    },

    // -------------------------------------------------
    // UNLOCK SUCCESS
    // -------------------------------------------------
    unlockSuccess: {
      scene: "TypewriterPanel",
      props: {
        title: "UNLOCKED",
        text:
          "Correct!\nVIP route unlocked.\n\nScore increased.",
        primaryText: "Proceed",
      },
      on: {
        primary: "routeSelect",
      },
    },

    // -------------------------------------------------
    // VIP NODE
    // -------------------------------------------------
    vipNode: {
      scene: "TypewriterPanel",
      mutations: [
        { type: "toggle", path: "vars.vipVisited" },
      ],
      props: {
        title: "VIP_ACCESS_GRANTED",
        text:
          "Welcome to VIP zone.\n\nYou unlocked it properly.",
        primaryText: "Finish",
      },
      on: {
        primary: [
          {
            when: { var: "score", gte: 10 },
            to: "goodEnding",
          },
          {
            to: "neutralEnding",
          },
        ],
      },
    },

    // -------------------------------------------------
    // GOOD ENDING
    // -------------------------------------------------
    goodEnding: {
      scene: "TypewriterPanel",
      props: {
        title: "GOOD_ENDING",
        text:
          "High score achieved.\n\nYou mastered the engine.",
        primaryText: "Done",
      },
      on: {
        primary: "done",
      },
    },

    // -------------------------------------------------
    // NEUTRAL ENDING
    // -------------------------------------------------
    neutralEnding: {
      scene: "TypewriterPanel",
      props: {
        title: "NEUTRAL_ENDING",
        text:
          "VIP reached.\n\nBut score was low.",
        primaryText: "Done",
      },
      on: {
        primary: "done",
      },
    },

  },
};

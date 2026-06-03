import React from "react";
import {
  TypewriterPanel,
  RetroChoicePanel,
  RetroTimelinePanel,
  RetroMapPanel,
  RetroQuizPanel,
  RetroMediaLyricPanel,
} from "../ui/retro";

export const sceneRegistry = {
  TypewriterPanel: TypewriterPanel,
  ChoicePanel: RetroChoicePanel,
  TimelinePanel: RetroTimelinePanel,
  MapPanel: RetroMapPanel,
  QuizPanel: RetroQuizPanel,
  MediaLyricPanel: RetroMediaLyricPanel,
};

export function resolveScene(sceneName) {
  return sceneRegistry[sceneName] || null;
}

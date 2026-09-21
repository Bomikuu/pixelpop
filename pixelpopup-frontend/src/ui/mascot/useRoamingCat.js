import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);
const easeOutCubic = (value) => 1 - ((1 - value) ** 3);

function matchesRoute(pattern, pathname) {
  return pattern === "*" || (pattern.endsWith("*") ? pathname.startsWith(pattern.slice(0, -1)) : pathname === pattern);
}

function pickWeightedMessage(messages, pathname, previousId) {
  const eligible = messages.filter((item) => item.id !== previousId && item.routes.some((route) => matchesRoute(route, pathname)));
  const pool = eligible.length ? eligible : messages.filter((item) => item.routes.some((route) => matchesRoute(route, pathname)));
  const total = pool.reduce((sum, item) => sum + Math.max(item.weight || 1, 1), 0);
  let choice = Math.random() * total;
  return pool.find((item) => {
    choice -= Math.max(item.weight || 1, 1);
    return choice <= 0;
  }) || pool[0] || null;
}

function getSpriteSize(config) {
  if (window.innerWidth <= 640) return config.mobileSize;
  if (window.innerWidth <= 900) return config.tabletSize;
  return config.desktopSize;
}

function isVisible(rect) {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

function getExclusionRects(config) {
  const selector = config.exclusionSelectors.join(",");
  return [...document.querySelectorAll(selector)]
    .map((element) => element.getBoundingClientRect())
    .filter(isVisible)
    .map((rect) => ({
      left: rect.left - config.exclusionPadding,
      right: rect.right + config.exclusionPadding,
      top: rect.top - config.exclusionPadding,
      bottom: rect.bottom + config.exclusionPadding,
    }));
}

function overlaps(candidate, exclusions) {
  return exclusions.some((rect) => !(
    candidate.right <= rect.left || candidate.left >= rect.right || candidate.bottom <= rect.top || candidate.top >= rect.bottom
  ));
}

function findSafePosition(config, size, preferredCorner = null) {
  const minimumX = config.edgePadding;
  const maximumX = Math.max(minimumX, window.innerWidth - size.width - config.edgePadding);
  const minimumY = Math.max(config.edgePadding + 72, window.innerHeight * 0.52);
  const maximumY = Math.max(minimumY, window.innerHeight - size.height - config.edgePadding);
  const exclusions = getExclusionRects(config);
  const candidates = [];

  if (preferredCorner === "bottom-right") candidates.push({ x: maximumX, y: maximumY });
  candidates.push(
    { x: minimumX, y: maximumY },
    { x: maximumX, y: maximumY },
    { x: minimumX, y: minimumY },
    { x: maximumX, y: minimumY },
  );
  for (let index = 0; index < 18; index += 1) {
    candidates.push({ x: randomBetween(minimumX, maximumX), y: randomBetween(minimumY, maximumY) });
  }

  return candidates.find(({ x, y }) => !overlaps({ left: x, right: x + size.width, top: y, bottom: y + size.height }, exclusions))
    || { x: maximumX, y: maximumY };
}

function findSafeSpeechPosition(config, size, current) {
  const bubbleWidth = window.innerWidth <= 640 ? 192 : 240;
  const bubbleHeight = window.innerWidth <= 640 ? 124 : 116;
  const minimumX = config.edgePadding;
  const maximumX = Math.max(minimumX, window.innerWidth - size.width - config.edgePadding);
  const minimumY = Math.max(config.edgePadding + bubbleHeight + 72, window.innerHeight * 0.46);
  const maximumY = Math.max(minimumY, window.innerHeight - size.height - config.edgePadding);
  const exclusions = getExclusionRects(config);
  const middleY = clamp(window.innerHeight * 0.66, minimumY, maximumY);
  const candidates = [
    current,
    { x: minimumX, y: maximumY },
    { x: maximumX, y: maximumY },
    { x: minimumX, y: middleY },
    { x: maximumX, y: middleY },
    { x: minimumX, y: minimumY },
    { x: maximumX, y: minimumY },
  ];
  for (let index = 0; index < 18; index += 1) {
    candidates.push({ x: randomBetween(minimumX, maximumX), y: randomBetween(minimumY, maximumY) });
  }

  return candidates.find(({ x, y }) => {
    const alignRight = x > window.innerWidth / 2;
    const bubbleLeft = alignRight ? x + size.width - bubbleWidth : x;
    const bubbleBottom = y + 8;
    const spriteRect = { left: x, right: x + size.width, top: y, bottom: y + size.height };
    const bubbleRect = {
      left: bubbleLeft,
      right: bubbleLeft + bubbleWidth,
      top: bubbleBottom - bubbleHeight,
      bottom: bubbleBottom,
    };
    return bubbleRect.left >= config.edgePadding
      && bubbleRect.right <= window.innerWidth - config.edgePadding
      && bubbleRect.top >= config.edgePadding
      && !overlaps(spriteRect, exclusions)
      && !overlaps(bubbleRect, exclusions);
  }) || findSafePosition(config, size, "bottom-right");
}

export default function useRoamingCat({ config, messages, pathname, mascotRef }) {
  const [state, setState] = useState("idle");
  const [facing, setFacing] = useState("left");
  const [bubble, setBubble] = useState(null);
  const [bubbleAlign, setBubbleAlign] = useState("right");
  const [suppressed, setSuppressed] = useState(false);
  const [hiddenForSession, setHiddenForSession] = useState(false);
  const [activityCycle, setActivityCycle] = useState(0);
  const positionRef = useRef({ x: 0, y: 0 });
  const timerRef = useRef(0);
  const speechTimerRef = useRef(0);
  const frameRef = useRef(0);
  const clickResetRef = useRef(0);
  const initializedRef = useRef(false);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startPointer: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    suppressClick: false,
  });
  const lastMessageIdRef = useRef(null);
  const lastSpeechAtRef = useRef(0);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const routeMessages = useMemo(() => messages.filter((item) => item.routes.some((route) => matchesRoute(route, pathname))), [messages, pathname]);

  const clearActivity = useCallback(() => {
    window.clearTimeout(timerRef.current);
    window.clearTimeout(speechTimerRef.current);
    window.cancelAnimationFrame(frameRef.current);
  }, []);

  const applyPosition = useCallback((position) => {
    positionRef.current = position;
    if (mascotRef.current) mascotRef.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
  }, [mascotRef]);

  const showSpeech = useCallback(() => {
    if (!routeMessages.length || suppressed || hiddenForSession) return;
    const message = pickWeightedMessage(routeMessages, pathname, lastMessageIdRef.current);
    if (!message) return;
    const speechPosition = findSafeSpeechPosition(config, getSpriteSize(config), positionRef.current);
    applyPosition(speechPosition);
    lastMessageIdRef.current = message.id;
    lastSpeechAtRef.current = Date.now();
    setBubbleAlign(speechPosition.x > window.innerWidth / 2 ? "right" : "left");
    setBubble(message);
    setState("speaking");
    window.clearTimeout(speechTimerRef.current);
    speechTimerRef.current = window.setTimeout(() => {
      setBubble(null);
      setState("idle");
    }, config.speechDuration);
  }, [applyPosition, config, hiddenForSession, pathname, routeMessages, suppressed]);

  const moveTo = useCallback((destination) => {
    if (reducedMotion || suppressed || hiddenForSession) {
      applyPosition(destination);
      return;
    }
    const start = { ...positionRef.current };
    const distance = Math.hypot(destination.x - start.x, destination.y - start.y);
    const duration = clamp(distance * 7, 1500, 4000);
    const startedAt = performance.now();
    setFacing(destination.x < start.x ? "left" : "right");
    setBubble(null);
    setState("walking");

    const animate = (timestamp) => {
      const progress = clamp((timestamp - startedAt) / duration, 0, 1);
      const eased = easeOutCubic(progress);
      applyPosition({ x: start.x + ((destination.x - start.x) * eased), y: start.y + ((destination.y - start.y) * eased) });
      if (progress < 1) frameRef.current = window.requestAnimationFrame(animate);
      else setState(Math.random() > 0.55 ? "idle-alt" : "idle");
    };
    frameRef.current = window.requestAnimationFrame(animate);
  }, [applyPosition, hiddenForSession, reducedMotion, suppressed]);

  useEffect(() => {
    if (hiddenForSession || suppressed) return undefined;
    const size = getSpriteSize(config);
    if (!initializedRef.current) {
      applyPosition(findSafePosition(config, size, "bottom-right"));
      initializedRef.current = true;
    }
    const schedule = () => {
      const idleDuration = randomBetween(config.minimumIdleDuration, config.maximumIdleDuration);
      timerRef.current = window.setTimeout(() => {
        const mobile = window.innerWidth <= 640;
        const speechReady = Date.now() - lastSpeechAtRef.current >= randomBetween(config.minimumSpeechInterval, config.maximumSpeechInterval);
        const roll = Math.random();
        if (!mobile && speechReady && roll < 0.2) showSpeech();
        else if (config.enableSleepingState && roll > 0.92) setState("sleeping");
        else if (!mobile || config.movementEnabledOnMobile) moveTo(findSafePosition(config, getSpriteSize(config)));
        else setState(Math.random() > 0.5 ? "idle-alt" : "idle");
        schedule();
      }, idleDuration);
    };
    schedule();
    return clearActivity;
  }, [activityCycle, applyPosition, clearActivity, config, hiddenForSession, moveTo, showSpeech, suppressed]);

  useEffect(() => {
    let resizeFrame = 0;
    const keepSafe = () => {
      if (dragRef.current.active) return;
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        const size = getSpriteSize(config);
        const safe = findSafePosition(config, size, "bottom-right");
        const current = positionRef.current;
        const outOfBounds = current.x < config.edgePadding || current.y < config.edgePadding
          || current.x + size.width > window.innerWidth - config.edgePadding
          || current.y + size.height > window.innerHeight - config.edgePadding;
        const currentRect = { left: current.x, right: current.x + size.width, top: current.y, bottom: current.y + size.height };
        if (outOfBounds || overlaps(currentRect, getExclusionRects(config))) applyPosition(safe);
      });
    };
    window.addEventListener("resize", keepSafe);
    window.addEventListener("scroll", keepSafe, { passive: true });
    return () => {
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", keepSafe);
      window.removeEventListener("scroll", keepSafe);
    };
  }, [applyPosition, config]);

  useEffect(() => {
    const updateSuppression = () => {
      const overlayOpen = Boolean(document.querySelector("dialog[open], [role='dialog'][aria-modal='true']"));
      const documentHidden = config.pauseWhenDocumentHidden && document.hidden;
      setSuppressed(overlayOpen || documentHidden);
    };
    const observer = new MutationObserver(updateSuppression);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open", "aria-modal"],
    });
    document.addEventListener("visibilitychange", updateSuppression);
    updateSuppression();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateSuppression);
    };
  }, [config.pauseWhenDocumentHidden]);

  const dismissBubble = useCallback(() => {
    window.clearTimeout(speechTimerRef.current);
    setBubble(null);
    setState("idle");
  }, []);

  const hideForSession = useCallback(() => {
    clearActivity();
    setHiddenForSession(true);
  }, [clearActivity]);

  const beginDrag = useCallback((event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    clearActivity();
    window.clearTimeout(clickResetRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition: { ...positionRef.current },
      suppressClick: false,
    };
    setBubble(null);
    setState("dragging");
  }, [clearActivity]);

  const updateDrag = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    const deltaX = event.clientX - drag.startPointer.x;
    const deltaY = event.clientY - drag.startPointer.y;
    if (Math.hypot(deltaX, deltaY) >= 6) drag.moved = true;
    if (Math.abs(deltaX) > 1) setFacing(deltaX < 0 ? "left" : "right");

    const size = getSpriteSize(config);
    const maximumX = Math.max(config.edgePadding, window.innerWidth - size.width - config.edgePadding);
    const maximumY = Math.max(config.edgePadding, window.innerHeight - size.height - config.edgePadding);
    const minimumY = Math.min(config.edgePadding + 72, maximumY);
    applyPosition({
      x: clamp(drag.startPosition.x + deltaX, config.edgePadding, maximumX),
      y: clamp(drag.startPosition.y + deltaY, minimumY, maximumY),
    });
  }, [applyPosition, config]);

  const endDrag = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.active = false;
    drag.suppressClick = drag.moved;
    setState("idle");
    setActivityCycle((cycle) => cycle + 1);
    clickResetRef.current = window.setTimeout(() => {
      dragRef.current.suppressClick = false;
    }, 0);
  }, []);

  const activate = useCallback((event) => {
    if (dragRef.current.suppressClick) {
      event.preventDefault();
      dragRef.current.suppressClick = false;
      return;
    }
    showSpeech();
  }, [showSpeech]);

  useEffect(() => () => window.clearTimeout(clickResetRef.current), []);

  return {
    state,
    facing,
    bubble,
    bubbleAlign,
    suppressed,
    hiddenForSession,
    activate,
    beginDrag,
    updateDrag,
    endDrag,
    dismissBubble,
    hideForSession,
  };
}

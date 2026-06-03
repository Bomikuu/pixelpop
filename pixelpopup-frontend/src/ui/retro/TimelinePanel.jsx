import React, { useMemo, useState } from "react";
import RetroPanel from "./Panel";
import RetroButton from "./Button";
import RetroIconButton from "./IconButton";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function TimelinePanel({
  // Panel
  title = "TIMELINE",
  rightSlot,
  className,
  bg,
  borderColor,
  shadow,

  // Data
  // items: [{ id, date, title, subtitle, description, mediaUrl, mediaType, icon, color, actions }]
  items = [],

  // Layout
  dense = false,
  showMedia = true,
  mediaAspectClass = "aspect-video",
  defaultExpanded = false,
  allowCollapse = true,

  // Styling tokens
  lineColor = "var(--pp-border)",
  dotBg = "var(--pp-accent)",
  dotBorder = "var(--pp-border)",
  cardBg = "rgba(255,255,255,0.92)",
  cardBorder = "var(--pp-border)",
  cardShadow = "var(--pp-shadow)",

  // Controls
  showExpandAll = true,
  expandAllText = "Expand all",
  collapseAllText = "Collapse all",

  // Events
  onSelect, // (item) => void  ✅ used by SceneEngine
  onDone,   // optional (not required)
}) {
  const padding = dense ? "p-3" : "p-4";

  const normalized = useMemo(() => {
    return (items || []).map((it, i) => ({
      id: it.id ?? String(i),
      date: it.date ?? "",
      title: it.title ?? `Memory ${i + 1}`,
      subtitle: it.subtitle,
      description: it.description,
      mediaUrl: it.mediaUrl,
      mediaType: it.mediaType || "image",
      icon: it.icon,
      color: it.color,
      actions: it.actions || [],
    }));
  }, [items]);

  const [openMap, setOpenMap] = useState(() => {
    const m = {};
    normalized.forEach((it) => {
      m[it.id] = Boolean(defaultExpanded);
    });
    return m;
  });

  const setAll = (value) => {
    if (!allowCollapse && value === false) return;
    setOpenMap((prev) => {
      const next = { ...prev };
      normalized.forEach((it) => (next[it.id] = value));
      return next;
    });
  };

  const allExpanded = normalized.length > 0 && normalized.every((it) => openMap[it.id]);
  const anyExpanded = normalized.some((it) => openMap[it.id]);

  return (
    <RetroPanel
      title={title}
      rightSlot={
        <div className="flex items-center gap-2">
          {showExpandAll ? (
            <RetroButton
              variant="ghost"
              size="sm"
              onClick={() => setAll(allExpanded ? false : true)}
              disabled={!normalized.length || (!allowCollapse && allExpanded)}
              className="!px-3 !py-2"
            >
              {allExpanded ? collapseAllText : expandAllText}
            </RetroButton>
          ) : null}
          {rightSlot}
        </div>
      }
      className={className}
      bg={bg}
      borderColor={borderColor}
      shadow={shadow}
    >
      <div className={padding}>
        {!normalized.length ? (
          <div className="font-pp text-sm font-extrabold opacity-80">
            No timeline items yet.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[14px] top-2 bottom-2 w-[3px] rounded"
              style={{ background: lineColor }}
            />

            <div className="space-y-4">
              {normalized.map((it) => (
                <TimelineItem
                  key={it.id}
                  item={it}
                  open={Boolean(openMap[it.id])}
                  onToggle={() => {
                    setOpenMap((prev) => {
                      const next = { ...prev };
                      const newVal = !Boolean(prev[it.id]);
                      if (!allowCollapse && newVal === false) return prev;
                      next[it.id] = newVal;
                      return next;
                    });
                  }}
                  onSelect={onSelect}
                  showMedia={showMedia}
                  mediaAspectClass={mediaAspectClass}
                  dotBg={it.color?.dotBg ?? dotBg}
                  dotBorder={it.color?.dotBorder ?? dotBorder}
                  cardBg={it.color?.cardBg ?? cardBg}
                  cardBorder={it.color?.cardBorder ?? cardBorder}
                  cardShadow={it.color?.cardShadow ?? cardShadow}
                />
              ))}
            </div>

            {anyExpanded ? null : (
              <div className="mt-4 font-pp text-xs opacity-70">
                Tip: click a memory card to expand.
              </div>
            )}

            {/* Optional footer exit (if you ever want it) */}
            {onDone ? (
              <div className="mt-4 flex justify-end">
                <RetroButton variant="ghost" size="sm" onClick={() => onDone?.()} className="!px-3 !py-2">
                  Back
                </RetroButton>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </RetroPanel>
  );
}

function TimelineItem({
  item,
  open,
  onToggle,
  onSelect,
  showMedia,
  mediaAspectClass,
  dotBg,
  dotBorder,
  cardBg,
  cardBorder,
  cardShadow,
}) {
  const hasDetails = Boolean(
    item.subtitle ||
      item.description ||
      (showMedia && item.mediaUrl) ||
      item.actions?.length
  );

  const handleCardClick = () => {
    // selection event (engine uses this)
    onSelect?.(item);

    // expand/collapse behavior
    if (hasDetails) onToggle?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div className="relative pl-10">
      {/* Dot */}
      <div
        className="absolute left-[6px] top-4 h-5 w-5 rounded-full border-[3px]"
        style={{ background: dotBg, borderColor: dotBorder, boxShadow: "var(--pp-shadow)" }}
        title={item.date}
      />

      {/* Card (NOT a <button> to avoid nested button hydration issues) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={cx(
          "w-full text-left border-[3px] rounded-xl overflow-hidden",
          "transition-transform outline-none",
          hasDetails ? "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]" : ""
        )}
        style={{ background: cardBg, borderColor: cardBorder, boxShadow: cardShadow }}
      >
        <div className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                <div className="font-pp font-extrabold text-sm md:text-base truncate">
                  {item.title}
                </div>
              </div>

              {item.date ? (
                <div className="mt-1 font-pp text-xs opacity-70">{item.date}</div>
              ) : null}

              {item.subtitle ? (
                <div className="mt-2 font-pp text-xs md:text-sm opacity-85">
                  {item.subtitle}
                </div>
              ) : null}
            </div>

            {hasDetails ? (
              <div className="shrink-0">
                <span
                  className="font-pp text-[10px] font-extrabold px-2 py-1 border-[3px] rounded-lg"
                  style={{
                    borderColor: "var(--pp-border)",
                    boxShadow: "var(--pp-shadow)",
                    background: "rgba(255,255,255,0.75)",
                  }}
                >
                  {open ? "OPEN" : "OPEN?"}
                </span>
              </div>
            ) : null}
          </div>

          {open ? (
            <div className="mt-3">
              {showMedia && item.mediaUrl ? (
                <div
                  className={cx("w-full border-[3px] rounded-xl overflow-hidden", mediaAspectClass)}
                  style={{
                    borderColor: "var(--pp-border)",
                    boxShadow: "var(--pp-shadow)",
                    background: "rgba(255,255,255,0.7)",
                  }}
                >
                  {item.mediaType === "video" ? (
                    <video src={item.mediaUrl} className="h-full w-full object-cover" controls />
                  ) : (
                    <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
              ) : null}

              {item.description ? (
                <div className="mt-3 font-pp text-xs md:text-sm opacity-90">
                  {item.description}
                </div>
              ) : null}

              {item.actions?.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 justify-end">
                  {item.actions.map((a, i) => (
                    <RetroButton
                      key={a.label || i}
                      variant={a.kind || "secondary"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        a.onClick?.(item);
                      }}
                      disabled={Boolean(a.disabled)}
                      className="!px-3 !py-2"
                    >
                      {a.label}
                    </RetroButton>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

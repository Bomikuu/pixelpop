import React, { useMemo } from "react";
import RetroPanel from "./Panel";
import RetroButton from "./Button";
import RetroIconButton from "./IconButton";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function ChoicePanel({
  // Panel
  title = "CHOOSE",
  rightSlot,
  className,
  bg,
  borderColor,
  shadow,

  // Layout
  columns = 2, // 1 | 2 | 3
  dense = false,
  gapClass = "gap-3",
  fullWidthButtons = true,

  // Choices
  // choices: [{ id, label, description, icon, kind, disabled, onSelect }]
  // kind: "primary" | "secondary" | "danger" | "ghost" | "icon"
  choices = [],

  // Events
  onChoose, // (choice) => void

  // Optional header/extra content
  intro,
  footer,

  // Styling tokens
  buttonClassName,
  iconButtonSizeClass = "h-12 w-12",
  showIndex = false,

  // Keyboard
  enableHotkeys = true, // 1..9 number keys map to choices
}) {
  const gridCols = useMemo(() => {
    if (columns === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (columns === 1) return "grid-cols-1";
    return "grid-cols-1 sm:grid-cols-2";
  }, [columns]);

  const padding = dense ? "p-3" : "p-4";

  const normalized = useMemo(() => {
    return (choices || []).map((c, i) => ({
      id: c.id ?? String(i),
      kind: c.kind || "primary",
      label: c.label ?? `Choice ${i + 1}`,
      description: c.description,
      icon: c.icon,
      disabled: Boolean(c.disabled),
      onSelect: c.onSelect,
      _index: i,
    }));
  }, [choices]);

  // Hotkeys (1..9)
  React.useEffect(() => {
    if (!enableHotkeys) return;

    const onKeyDown = (e) => {
      // ignore if typing in inputs
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const n = Number(e.key);
      if (!Number.isFinite(n) || n < 1 || n > 9) return;

      const idx = n - 1;
      const choice = normalized[idx];
      if (!choice || choice.disabled) return;

      handleChoose(choice);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableHotkeys, normalized]);

  const handleChoose = (choice) => {
    choice?.onSelect?.(choice);
    onChoose?.(choice);
  };

  return (
    <RetroPanel
      title={title}
      rightSlot={rightSlot}
      className={className}
      bg={bg}
      borderColor={borderColor}
      shadow={shadow}
    >
      <div className={padding}>
        {intro ? <div className="mb-3">{intro}</div> : null}

        <div className={cx("grid", gridCols, gapClass)}>
          {normalized.map((c, i) => (
            <ChoiceCard
              key={c.id}
              choice={c}
              index={i}
              showIndex={showIndex}
              fullWidthButtons={fullWidthButtons}
              buttonClassName={buttonClassName}
              iconButtonSizeClass={iconButtonSizeClass}
              onChoose={handleChoose}
            />
          ))}
        </div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </RetroPanel>
  );
}

function ChoiceCard({
  choice,
  index,
  showIndex,
  fullWidthButtons,
  buttonClassName,
  iconButtonSizeClass,
  onChoose,
}) {
  const {
    kind,
    label,
    description,
    icon,
    disabled,
  } = choice;

  const baseCard =
    "border-[3px] rounded-xl overflow-hidden";
  const baseInner =
    "p-3 md:p-4";

  const frameStyle = {
    borderColor: "var(--pp-border)",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "var(--pp-shadow)",
  };

  const labelRow = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-pp font-extrabold text-sm md:text-base truncate">
          {showIndex ? `${index + 1}. ` : ""}{label}
        </div>
        {description ? (
          <div className="mt-1 font-pp text-xs opacity-80">
            {description}
          </div>
        ) : null}
      </div>

      {icon ? (
        <div className="shrink-0">
          <div
            className="border-[3px] rounded-lg p-2"
            style={{
              borderColor: "var(--pp-border)",
              background: "rgba(255,255,255,0.8)",
              boxShadow: "var(--pp-shadow)",
            }}
          >
            {icon}
          </div>
        </div>
      ) : null}
    </div>
  );

  const actionRow = (
    <div className="mt-3 flex items-center justify-end">
      {kind === "icon" ? (
        <RetroIconButton
          title={label}
          icon={icon || <span className="font-pp font-extrabold">GO</span>}
          onClick={() => onChoose(choice)}
          disabled={disabled}
          sizeClass={iconButtonSizeClass}
          className={cx(fullWidthButtons ? "w-full" : "")}
        />
      ) : (
        <RetroButton
          variant={kind}
          onClick={() => onChoose(choice)}
          disabled={disabled}
          className={cx(fullWidthButtons ? "w-full" : "", buttonClassName)}
        >
          {label}
        </RetroButton>
      )}
    </div>
  );

  return (
    <div className={baseCard} style={frameStyle}>
      <div className={baseInner}>
        {labelRow}
        {actionRow}
      </div>
    </div>
  );
}

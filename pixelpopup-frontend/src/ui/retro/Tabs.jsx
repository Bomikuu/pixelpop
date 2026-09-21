import React, { useId, useState } from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroTabs({
  items = [],
  value,
  defaultValue,
  onValueChange,
  className,
  tabsClassName,
  panelClassName,
}) {
  const generatedId = useId().replace(/:/g, "");
  const firstValue = items[0]?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstValue);
  const activeValue = value ?? internalValue;
  const activeItem = items.find((item) => item.value === activeValue) ?? items[0];

  const selectTab = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const onKeyDown = (event, index) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    selectTab(items[nextIndex].value);
    document.getElementById(`pp-tab-${generatedId}-${items[nextIndex].value}`)?.focus();
  };

  if (!activeItem) return null;

  return (
    <div className={cx("font-pp", className)}>
      <div
        role="tablist"
        aria-label="Component preview tabs"
        className={cx("flex flex-wrap gap-2 border-b-[3px] pb-3", tabsClassName)}
        style={{ borderColor: "var(--pp-border)" }}
      >
        {items.map((item, index) => {
          const selected = item.value === activeItem.value;
          return (
            <button
              key={item.value}
              id={`pp-tab-${generatedId}-${item.value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`pp-panel-${generatedId}-${item.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="border-[3px] px-3 py-2 text-sm font-extrabold transition-transform hover:-translate-y-px"
              style={{
                borderColor: "var(--pp-border)",
                background: selected ? "var(--pp-accent)" : "white",
                color: "#0f172a",
                boxShadow: selected ? "var(--pp-shadow)" : "none",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        id={`pp-panel-${generatedId}-${activeItem.value}`}
        role="tabpanel"
        aria-labelledby={`pp-tab-${generatedId}-${activeItem.value}`}
        tabIndex={0}
        className={cx("pt-4 outline-none", panelClassName)}
      >
        {activeItem.content}
      </div>
    </div>
  );
}

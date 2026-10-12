import { useRef } from "react";

// Use text-backed numeric controls: native number inputs admit exponent notation
// and do not expose a caret range for validating replacements and pasted text.
export default function useNumericInput(props) {
  const { type, inputMode, min, step, pattern, value, defaultValue } = props;
  const numeric = type === "number" ||
    ((!type || type === "text" || type === "password") && ["numeric", "decimal"].includes(inputMode));
  const decimal = inputMode === "decimal" || (type === "number" &&
    (step === "any" || (step != null && !Number.isInteger(Number(step)))));
  const signed = type === "number" ? min == null || Number(min) < 0 :
    (min != null && Number(min) < 0) || pattern?.startsWith("-?");
  const allowed = new RegExp(`^${signed ? "-?" : ""}\\d*${decimal ? "(?:\\.\\d*)?" : ""}$`);
  const previous = useRef(String(value ?? defaultValue ?? ""));
  if (!numeric) return props;

  const accepts = (next) => allowed.test(next);
  const replacement = (input, text) => {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    return input.value.slice(0, start) + text + input.value.slice(end);
  };
  const blockInsertion = (event, text) => {
    if (text != null && !accepts(replacement(event.currentTarget, text))) event.preventDefault();
  };

  return {
    ...props,
    type: type === "number" ? "text" : type,
    inputMode: inputMode || (decimal ? "decimal" : "numeric"),
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length === 1) blockInsertion(event, event.key);
    },
    onBeforeInput: (event) => {
      props.onBeforeInput?.(event);
      if (!event.defaultPrevented) blockInsertion(event, event.data ?? event.nativeEvent?.data);
    },
    onPaste: (event) => {
      props.onPaste?.(event);
      if (!event.defaultPrevented) blockInsertion(event, event.clipboardData.getData("text"));
    },
    onDrop: (event) => {
      props.onDrop?.(event);
      // Reject an invalid drop rather than stripping characters and changing its amount.
      if (!event.defaultPrevented && !accepts(event.dataTransfer.getData("text"))) event.preventDefault();
    },
    onChange: (event) => {
      const next = event.currentTarget.value;
      if (!accepts(next)) {
        event.currentTarget.value = String(value ?? previous.current);
        return;
      }
      previous.current = next;
      props.onChange?.(event);
    },
  };
}

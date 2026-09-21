const patternShapes = {
  hero: [
    ["square", "-left-10 top-[18%] size-36 rotate-12"],
    ["line", "right-[8%] top-[22%] w-40 -rotate-12"],
    ["circle", "bottom-[12%] right-[18%] size-24"],
  ],
  overview: [
    ["square", "-left-12 top-20 size-32 rotate-12"],
    ["line", "right-[6%] top-24 w-44 -rotate-12"],
    ["circle", "bottom-10 right-[20%] size-20"],
  ],
  showcase: [
    ["circle", "-left-14 top-[25%] size-40"],
    ["square", "right-[5%] top-20 size-24 -rotate-12"],
    ["line", "bottom-20 left-[44%] w-52 rotate-6"],
  ],
  expertise: [
    ["square", "left-[5%] top-14 size-20 rotate-12"],
    ["circle", "right-[8%] top-[18%] size-32"],
    ["line", "bottom-16 left-[22%] w-36 -rotate-6"],
  ],
  features: [
    ["square", "-right-12 top-24 size-40 -rotate-12"],
    ["line", "left-[6%] top-[30%] w-40 rotate-12"],
    ["circle", "bottom-12 left-[12%] size-20"],
  ],
  banner: [
    ["square", "left-[4%] -top-16 size-32 rotate-12"],
    ["line", "right-[9%] top-10 w-48 -rotate-6"],
  ],
  faq: [
    ["circle", "-left-10 top-[16%] size-28"],
    ["square", "right-[8%] top-20 size-20 rotate-12"],
    ["line", "bottom-20 right-[18%] w-36 rotate-12"],
  ],
  next: [
    ["square", "left-[8%] -bottom-12 size-24 rotate-12"],
    ["line", "right-[10%] top-1/2 w-32 -rotate-6"],
  ],
};

export default function AstaServicePattern({ variant, tone = "light" }) {
  const shapes = patternShapes[variant] || patternShapes.overview;
  const borderColor = tone === "dark" ? "border-white/10" : "border-[#1570ef]/10";
  const lineColor = tone === "dark" ? "bg-white/10" : "bg-[#1570ef]/10";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {shapes.map(([type, className], index) => (
        <span
          className={`absolute ${type === "line" ? `h-px ${lineColor}` : `border ${borderColor} ${type === "circle" ? "rounded-full" : ""}`} ${className}`}
          key={`${type}-${index}`}
        />
      ))}
    </div>
  );
}

const clusters = [
  { x: 28, y: 32, columns: 5, rows: 4, gap: 11 },
  { x: 137, y: 77, columns: 4, rows: 3, gap: 10 },
  { x: 60, y: 146, columns: 3, rows: 3, gap: 12 },
];

function DotField({ flipped = false }) {
  return <svg aria-hidden="true" viewBox="0 0 240 220" className={`pointer-events-none absolute h-52 w-56 text-blue-300/35 ${flipped ? "bottom-0 left-0 rotate-180" : "right-0 top-0"}`}>
    {clusters.map(({ x, y, columns, rows, gap }, cluster) => <g key={cluster} opacity={cluster === 1 ? "0.55" : "1"}>
      {Array.from({ length: columns * rows }, (_, index) => <circle
        key={index} cx={x + (index % columns) * gap}
        cy={y + Math.floor(index / columns) * gap}
        r={cluster === 1 ? "2.2" : "2.8"} fill="currentColor"
      />)}
    </g>)}
  </svg>;
}

export function BoardPattern() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <DotField />
    <DotField flipped />
  </div>;
}

export function CardPattern() {
  return <svg aria-hidden="true" viewBox="0 0 112 112"
    className="pointer-events-none absolute right-0 top-0 h-28 w-28 text-blue-300/40">
    <path d="M45 8 104 67M30 12l78 78M16 22l88 88M17 45l62 62M22 70l37 37"
      fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
  </svg>;
}

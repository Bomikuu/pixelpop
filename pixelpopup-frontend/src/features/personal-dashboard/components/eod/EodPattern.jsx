import { X } from "lucide-react";

export default function EodPattern({ tone = "neutral" }) {
  const color = { unlogged: "text-rose-400/45", logged: "text-emerald-400/45", neutral: "text-blue-300/45" }[tone];

  return <span aria-hidden="true" className={`pointer-events-none absolute inset-0 grid grid-cols-10 grid-rows-6 place-items-center transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none ${color}`}>
    {Array.from({ length: 60 }, (_, index) => <X key={index} size={8} strokeWidth={3} />)}
  </span>;
}

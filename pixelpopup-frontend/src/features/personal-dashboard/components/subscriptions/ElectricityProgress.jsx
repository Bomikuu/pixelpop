import "./electricityMeterPrediction.css";

export default function ElectricityProgress({ position, fill, label, description, valid, animationKey, baseline }) {
  return <div key={animationKey} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={position} aria-valuetext={description} className="relative h-3.5 rounded-full bg-slate-200" style={{ "--meter-progress": position / 100, "--meter-position": `${position}%` }}>
    <div className={`electricity-meter-fill h-full origin-left rounded-full ${fill}`} style={{ transform: `scaleX(${position / 100})` }} />
    {valid && <span aria-hidden="true" className="pointer-events-none absolute -inset-6 overflow-hidden">
      {baseline != null && <span className="absolute inset-6"><span className="absolute -bottom-2 -top-2 border-l border-dashed border-slate-700" style={{ left: `${baseline}%` }} /></span>}
      <span className="electricity-meter-marker absolute inset-6" style={{ transform: `translateX(${position}%)` }}>
        <span className={`absolute -bottom-2 -top-3 w-0.5 ${fill}`} />
        <span className={`absolute left-0 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${fill}`}><span className={`electricity-meter-pulse absolute -inset-1 rounded-full ${fill}`} /></span>
      </span>
    </span>}
  </div>;
}

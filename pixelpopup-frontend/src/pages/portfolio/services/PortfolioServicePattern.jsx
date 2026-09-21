const patternStyles = {
  dots: {
    backgroundImage: "radial-gradient(circle, rgba(47, 91, 255, 0.2) 1.2px, transparent 1.2px)",
    backgroundSize: "24px 24px",
  },
  crosses: {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='52' height='52' viewBox='0 0 52 52'%3E%3Cpath d='M23 23l6 6M29 23l-6 6' fill='none' stroke='%232f5bff' stroke-opacity='.12' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundSize: "52px 52px",
  },
};

export default function PortfolioServicePattern({ variant = "dots", className = "" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        ...patternStyles[variant],
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
        maskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
      }}
      aria-hidden="true"
    />
  );
}

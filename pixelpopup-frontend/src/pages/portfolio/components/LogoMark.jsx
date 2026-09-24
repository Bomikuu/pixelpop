export default function LogoMark({ className = "" }) {
  return (
    <span className={`portfolio-logo-mark ${className}`.trim()} aria-hidden="true">
      <img
        src="/portfolio/assets/mico-logo.webp"
        width="48"
        height="48"
        alt=""
        className="portfolio-logo-mark__image"
      />
    </span>
  );
}

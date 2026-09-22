import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import AstaReveal from "../AstaReveal";
import activities from "../data/activities.json";
import AstaSectionHeading from "./AstaSectionHeading";

function ActivityLightbox({ entries, index, onChange, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const active = entries[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  function move(direction) {
    onChange((index + direction + entries.length) % entries.length);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  }

  return (
    <dialog ref={dialogRef} className="asta-gallery-dialog" aria-labelledby="asta-gallery-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={handleKeyDown}>
      <div className="asta-gallery-dialog__frame">
        <div className="asta-gallery-dialog__media">
          <img src={active.image} alt={active.alt} />
          <button ref={closeButtonRef} type="button" className="asta-gallery-dialog__close" onClick={onClose} aria-label="Close activity gallery"><X aria-hidden="true" /></button>
          <button type="button" className="asta-gallery-dialog__previous" onClick={() => move(-1)} aria-label="Previous activity"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" className="asta-gallery-dialog__next" onClick={() => move(1)} aria-label="Next activity"><ChevronRight aria-hidden="true" /></button>
        </div>
        <div className="asta-gallery-dialog__caption">
          <div><span>{active.category}</span><h2 id="asta-gallery-dialog-title">{active.title}</h2></div>
          <p>{active.description}</p>
          <small>{String(index + 1).padStart(2, "0")} / {String(entries.length).padStart(2, "0")}</small>
        </div>
      </div>
    </dialog>
  );
}

export default function AstaGallerySection() {
  const orderedActivities = [...activities].sort((a, b) => a.order - b.order);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const openerRef = useRef(null);

  function openActivity(event, index) {
    openerRef.current = event.currentTarget;
    setSelectedIndex(index);
  }

  function closeActivity() {
    setSelectedIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  return (
    <section className="asta-home-section asta-home-gallery" id="culture" aria-labelledby="asta-gallery-title">
      <div className="asta-agency-container">
        <AstaReveal>
          <AstaSectionHeading id="asta-gallery-title" eyebrow="Life at ASTA" title="Company Activities" description="The work matters, and so do the people doing it. Browse real moments from team gatherings, celebrations, and time together." />
        </AstaReveal>
        <AstaReveal className="asta-activity-collage" delay={80}>
          <div className="asta-activity-collage__grid" role="list" aria-label="ASTA company activities">
            {orderedActivities.map((activity, index) => {
              const variants = ["feature", "portrait", "standard", "wide", "tall", "standard", "wide", "standard", "feature", "portrait"];
              const variant = variants[index % variants.length];

              return (
                <article key={activity.id} className={`asta-activity-collage__item asta-activity-collage__item--${variant}`} role="listitem">
                  <button type="button" onClick={(event) => openActivity(event, index)} aria-label={`View activity photo: ${activity.title}`} aria-haspopup="dialog">
                    <img src={activity.image} alt={activity.alt} loading="lazy" />
                    <span className="asta-activity-collage__shade" aria-hidden="true" />
                    <span className="asta-activity-collage__caption" aria-hidden="true">
                      <strong>{activity.title}</strong>
                      <span>{activity.category}</span>
                    </span>
                    <span className="asta-activity-collage__expand" aria-hidden="true"><Expand /></span>
                  </button>
                </article>
              );
            })}
          </div>
        </AstaReveal>
      </div>
      <style>{`
        .asta-activity-collage {
          margin-top: clamp(2rem, 5vw, 4.5rem);
        }

        .asta-activity-collage__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-auto-flow: dense;
          grid-auto-rows: clamp(9rem, 31vw, 13rem);
          gap: clamp(0.5rem, 1vw, 0.875rem);
        }

        .asta-activity-collage__item {
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          background: #eaf3ff;
        }

        .asta-activity-collage__item--feature,
        .asta-activity-collage__item--wide {
          grid-column: span 2;
        }

        .asta-activity-collage__item--feature,
        .asta-activity-collage__item--portrait,
        .asta-activity-collage__item--tall {
          grid-row: span 2;
        }

        .asta-activity-collage__item > button {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          padding: 0;
          overflow: hidden;
          border: 0;
          background: transparent;
          color: #ffffff;
          cursor: zoom-in;
          text-align: left;
        }

        .asta-activity-collage__item img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), filter 420ms ease;
        }

        .asta-activity-collage__shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 38%, rgba(3, 14, 35, 0.82) 100%);
          opacity: 0;
          transition: opacity 260ms ease;
        }

        .asta-activity-collage__caption {
          position: absolute;
          right: clamp(0.875rem, 2vw, 1.5rem);
          bottom: clamp(0.875rem, 2vw, 1.5rem);
          left: clamp(0.875rem, 2vw, 1.5rem);
          display: grid;
          gap: 0.25rem;
          opacity: 0;
          transform: translateY(0.75rem);
          transition: opacity 260ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .asta-activity-collage__caption strong {
          font-family: "Saira Condensed", sans-serif;
          font-size: clamp(1.2rem, 2vw, 1.75rem);
          font-weight: 700;
          line-height: 1.05;
        }

        .asta-activity-collage__caption span {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .asta-activity-collage__expand {
          position: absolute;
          top: 0.875rem;
          right: 0.875rem;
          display: grid;
          width: 2.5rem;
          height: 2.5rem;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          color: #075fe6;
          opacity: 0;
          transform: translateY(-0.5rem);
          transition: opacity 240ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .asta-activity-collage__expand svg {
          width: 1rem;
          height: 1rem;
        }

        .asta-activity-collage__item > button:hover img,
        .asta-activity-collage__item > button:focus-visible img {
          transform: scale(1.045);
          filter: saturate(1.04);
        }

        .asta-activity-collage__item > button:hover .asta-activity-collage__shade,
        .asta-activity-collage__item > button:focus-visible .asta-activity-collage__shade,
        .asta-activity-collage__item > button:hover .asta-activity-collage__caption,
        .asta-activity-collage__item > button:focus-visible .asta-activity-collage__caption,
        .asta-activity-collage__item > button:hover .asta-activity-collage__expand,
        .asta-activity-collage__item > button:focus-visible .asta-activity-collage__expand {
          opacity: 1;
          transform: translateY(0);
        }

        .asta-activity-collage__item > button:focus-visible {
          outline: 3px solid #075fe6;
          outline-offset: -3px;
        }

        @media (min-width: 640px) {
          .asta-activity-collage__grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            grid-auto-rows: clamp(9rem, 18vw, 12rem);
          }
        }

        @media (min-width: 1024px) {
          .asta-activity-collage__grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            grid-auto-rows: clamp(8rem, 9vw, 10.5rem);
          }

          .asta-activity-collage__item--feature {
            grid-column: span 3;
          }

          .asta-activity-collage__item--portrait {
            grid-column: span 2;
          }
        }

        @media (hover: none) {
          .asta-activity-collage__shade {
            opacity: 0.72;
          }

          .asta-activity-collage__caption {
            opacity: 1;
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .asta-activity-collage__item img,
          .asta-activity-collage__shade,
          .asta-activity-collage__caption,
          .asta-activity-collage__expand {
            transition: none;
          }

          .asta-activity-collage__item > button:hover img,
          .asta-activity-collage__item > button:focus-visible img {
            transform: none;
          }
        }
      `}</style>
      {selectedIndex !== null ? <ActivityLightbox entries={orderedActivities} index={selectedIndex} onChange={setSelectedIndex} onClose={closeActivity} /> : null}
    </section>
  );
}

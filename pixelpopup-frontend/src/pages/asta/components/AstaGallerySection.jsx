import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
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
  const orderedActivities = [...activities].sort((a, b) => a.order - b.order).slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const openerRef = useRef(null);
  const tabsRef = useRef(null);
  const active = orderedActivities[activeIndex];

  useEffect(() => {
    const tabs = tabsRef.current;
    const activeTab = tabs?.children[activeIndex];
    if (!tabs || !activeTab) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const centeredOffset = activeTab.offsetLeft - (tabs.clientWidth - activeTab.clientWidth) / 2;
    tabs.scrollTo({
      left: Math.max(0, centeredOffset),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [activeIndex]);

  function move(direction) {
    setActiveIndex((current) => (current + direction + orderedActivities.length) % orderedActivities.length);
  }

  function openActivity(event) {
    openerRef.current = event.currentTarget;
    setSelectedIndex(activeIndex);
  }

  function closeActivity() {
    setSelectedIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  function handleCarouselKeyDown(event) {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  }

  return (
    <section className="asta-home-section asta-home-gallery" id="culture" aria-labelledby="asta-gallery-title">
      <div className="asta-agency-container">
        <AstaReveal>
          <AstaSectionHeading id="asta-gallery-title" eyebrow="Life at ASTA" title="Company Activities" description="The work matters, and so do the people doing it. Browse real moments from team gatherings, celebrations, and time together." />
        </AstaReveal>
        <AstaReveal className="asta-activity-carousel" delay={80}>
          <div className="asta-activity-carousel__toolbar">
            <p aria-live="polite"><strong>{String(activeIndex + 1).padStart(2, "0")}</strong><span>/ {String(orderedActivities.length).padStart(2, "0")}</span></p>
            <div>
              <button type="button" onClick={() => move(-1)} aria-label="Previous company activity"><ArrowLeft aria-hidden="true" /></button>
              <button type="button" onClick={() => move(1)} aria-label="Next company activity"><ArrowRight aria-hidden="true" /></button>
            </div>
          </div>
          <div className="asta-activity-carousel__stage" role="region" aria-roledescription="carousel" aria-label="ASTA company activities" tabIndex="0" onKeyDown={handleCarouselKeyDown}>
            <button className="asta-activity-carousel__media" type="button" onClick={openActivity} aria-label={`Expand activity photo: ${active.title}`} aria-haspopup="dialog">
              <img key={active.id} src={active.image} alt={active.alt} loading="lazy" />
              <span className="asta-activity-carousel__expand"><Expand aria-hidden="true" /> Expand</span>
            </button>
            <div className="asta-activity-carousel__caption">
              <span>{active.category}</span>
              <h3>{active.title}</h3>
              <p>{active.description}</p>
            </div>
          </div>
          <div ref={tabsRef} className="asta-activity-carousel__tabs" role="tablist" aria-label="Choose a company activity">
            {orderedActivities.map((activity, index) => (
              <button key={activity.id} type="button" role="tab" aria-selected={index === activeIndex} onClick={() => setActiveIndex(index)}>
                <img src={activity.image} alt="" loading="lazy" />
                <span><small>{String(index + 1).padStart(2, "0")}</small>{activity.title}</span>
              </button>
            ))}
          </div>
        </AstaReveal>
      </div>
      {selectedIndex !== null ? <ActivityLightbox entries={orderedActivities} index={selectedIndex} onChange={(index) => { setSelectedIndex(index); setActiveIndex(index); }} onClose={closeActivity} /> : null}
    </section>
  );
}

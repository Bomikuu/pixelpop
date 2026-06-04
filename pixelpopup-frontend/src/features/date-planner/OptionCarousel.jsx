import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePlannerCard from "./DatePlannerCard";

const VISIBLE_COUNT = 4;

/**
 * OptionCarousel — Horizontal scrollable carousel with prev/next arrows.
 * Used when there are 5+ options to display.
 *
 * @param {{ items: Array, selected: string|string[], onToggle: (id: string) => void, type: 'activity'|'detail' }} props
 */
export default function OptionCarousel({ items = [], selected, onToggle, type = "activity" }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(items.length / VISIBLE_COUNT);
  const start = page * VISIBLE_COUNT;
  const visibleItems = items.slice(start, start + VISIBLE_COUNT);

  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  const handlePrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const handleNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  const isSelected = (id) =>
    Array.isArray(selected) ? selected.includes(id) : selected === id;

  return (
    <div className="dp-carousel">
      <button
        className={`dp-carousel-arrow dp-carousel-arrow--prev ${!hasPrev ? "dp-carousel-arrow--disabled" : ""}`}
        onClick={handlePrev}
        disabled={!hasPrev}
        type="button"
        aria-label="Previous"
      >
        ‹
      </button>

      <div className="dp-carousel-track">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            className="dp-carousel-page"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {visibleItems.map((item) => (
              <DatePlannerCard
                key={item.id}
                selected={isSelected(item.id)}
                onClick={() => onToggle(item.id)}
                image={item.image}
                label={item.label}
                description={item.description}
                genre={item.genre}
                large={type === "activity"}
                small={type === "detail"}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        className={`dp-carousel-arrow dp-carousel-arrow--next ${!hasNext ? "dp-carousel-arrow--disabled" : ""}`}
        onClick={handleNext}
        disabled={!hasNext}
        type="button"
        aria-label="Next"
      >
        ›
      </button>

      {/* Page dots */}
      {totalPages > 1 && (
        <div className="dp-carousel-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`dp-carousel-dot ${i === page ? "dp-carousel-dot--active" : ""}`}
              onClick={() => setPage(i)}
              type="button"
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

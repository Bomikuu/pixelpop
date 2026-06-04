import React from "react";
import { motion } from "framer-motion";

/**
 * DatePlannerCard — Reusable selectable card for activities, cuisines, movies, matcha places.
 *
 * @param {{ selected: boolean, onClick: () => void, image: string, label: string, description?: string, genre?: string, small?: boolean, large?: boolean, showMore?: boolean }} props
 */
export default function DatePlannerCard({
  selected = false,
  onClick,
  image,
  label,
  description,
  genre,
  small = false,
  large = false,
  showMore = false,
}) {
  if (showMore) {
    return (
      <motion.div
        className={`dp-card dp-card--more ${small ? "dp-card--small" : ""}`}
        onClick={onClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="dp-card-more-icon">•••</div>
        <div className="dp-card-label">More</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`dp-card ${small ? "dp-card--small" : ""} ${large ? "dp-card--large" : ""} ${selected ? "dp-card--selected" : ""}`}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      layout
    >
      {selected && (
        <motion.div
          className="dp-card-check"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          ✓
        </motion.div>
      )}

      {image && (
        <img
          className="dp-card-image"
          src={image}
          alt={label}
          loading="lazy"
          draggable={false}
        />
      )}

      <div className="dp-card-label" style={{ whiteSpace: "pre-line" }}>
        {label}
      </div>

      {description && (
        <div className="dp-card-desc" style={{ whiteSpace: "pre-line" }}>
          {description}
        </div>
      )}

      {genre && <div className="dp-card-genre">{genre}</div>}
    </motion.div>
  );
}

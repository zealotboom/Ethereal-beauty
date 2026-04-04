import { useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

const PREVIEW_LENGTH = 140;
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function PoemCard({ poem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const scale = useSpring(1, { stiffness: 220, damping: 18 });
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  const authorLabel = poem.source === "api" ? "Famous Poet" : poem.author || "Anonymous";
  const shouldTruncate = poem.content.length > PREVIEW_LENGTH;
  const previewText = shouldTruncate ? `${poem.content.slice(0, PREVIEW_LENGTH).trim()}...` : poem.content;
  const displayedContent = isExpanded ? poem.content : previewText;

  const handleMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const rotateYValue = ((event.clientX - bounds.left) / bounds.width - 0.5) * 4;
    const rotateXValue = (((event.clientY - bounds.top) / bounds.height) - 0.5) * -4;
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  return (
    <motion.article
      className="poem-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseEnter={() => scale.set(1.03)}
      onMouseLeave={resetTilt}
    >
      <div className="poem-meta">
        <span>{authorLabel}</span>
        <span>{formatDate(poem.createdAt)}</span>
      </div>
      <h2>{poem.title}</h2>
      <p className={`poem-content${isExpanded ? " expanded" : ""}`}>{displayedContent}</p>
      {shouldTruncate ? (
        <button
          className="toggle-button"
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </motion.article>
  );
}

export default PoemCard;

import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { getAssetUrl } from "../lib/api.js";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function ImageCard({ item, label, onOpen }) {
  const imageSrc = item.imageUrl.startsWith("/uploads") ? getAssetUrl(item.imageUrl) : item.imageUrl;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const timeoutRef = useRef(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const scale = useSpring(1, { stiffness: 220, damping: 18 });
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;

  useEffect(() => {
    setIsLoaded(false);
    setHasFailed(false);

    timeoutRef.current = window.setTimeout(() => {
      setHasFailed(true);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [imageSrc]);

  const handleMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const offsetY = event.clientY - bounds.top;
    const rotateYValue = ((offsetX / bounds.width) - 0.5) * 4;
    const rotateXValue = (((offsetY / bounds.height) - 0.5) * -4);

    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  const handleLoad = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsLoaded(true);
  };

  const handleError = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setHasFailed(true);
  };

  if (hasFailed || !imageSrc) {
    return null;
  }

  return (
    <motion.article
      className="image-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseEnter={() => scale.set(1.03)}
      onMouseLeave={resetTilt}
    >
      <button
        className="image-card-button"
        type="button"
        onClick={() => onOpen({ ...item, imageUrl: imageSrc, feedLabel: label })}
        disabled={!isLoaded}
      >
        {!isLoaded ? (
          <div className="image-loading-shell" aria-hidden="true">
            <div className="skeleton-shimmer" />
          </div>
        ) : null}
        <img
          className={`feed-image ${isLoaded ? "feed-image-loaded" : "feed-image-loading"}`}
          src={imageSrc}
          alt={item.caption || item.name || label}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      </button>
      <div className="image-card-body">
        <p className="section-label">{label}</p>
        <p className="image-card-title">{item.caption || item.name || "Untitled"}</p>
        {item.user ? <p className="image-card-meta">{item.user}</p> : null}
      </div>
    </motion.article>
  );
}

export default ImageCard;

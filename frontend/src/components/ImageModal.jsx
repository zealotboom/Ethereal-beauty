import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

function ImageModal({ item, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close image preview">
              X
            </button>
            <img className="modal-image" src={item.imageUrl} alt={item.caption || item.name || "Preview"} />
            <div className="modal-body">
              <p className="section-label">{item.feedLabel || (item.source === "user" ? "Community" : "Preview")}</p>
              <p className="image-card-title">{item.caption || item.name || "Untitled"}</p>
              {item.user ? <p className="image-card-meta">{item.user}</p> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default ImageModal;

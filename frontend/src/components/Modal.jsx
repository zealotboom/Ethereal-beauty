import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

function Modal({ isOpen, onClose, title, children }) {
  const contentRef = useRef(null);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !portalTarget) {
    return null;
  }

  return createPortal(
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="popup-window" ref={contentRef} role="dialog" aria-modal="true" aria-label={title}>
        <div className="popup-header">
          <h3 className="popup-title">{title}</h3>
          <button type="button" className="chat-close" onClick={onClose} aria-label={`Close ${title}`}>
            x
          </button>
        </div>
        {children}
      </div>
    </>,
    portalTarget
  );
}

export default Modal;

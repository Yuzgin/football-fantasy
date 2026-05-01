import { useEffect } from 'react';
import './BeastGifOverlay.css';

/** GIFs don’t expose a reliable “animation ended” event; tune this to your clip length. */
const BEAST_GIF_DISPLAY_MS = 5000;

export default function BeastGifOverlay({ open, gifKey, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(onClose, BEAST_GIF_DISPLAY_MS);
    return () => window.clearTimeout(t);
  }, [open, gifKey, onClose]);

  if (!open) return null;

  return (
    <div
      className="beast-gif-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Beast"
      onClick={onClose}
    >
      <div className="beast-gif-overlay__dim" aria-hidden />
      <img
        key={gifKey}
        className="beast-gif-overlay__img"
        src="/Beast.gif"
        alt=""
        draggable={false}
      />
    </div>
  );
}

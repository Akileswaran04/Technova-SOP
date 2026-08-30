import { useEffect } from "react";

/**
 * Toast — lightweight auto-dismissing notification.
 * Show/hide via `message` prop (empty string = hidden).
 */
export default function Toast({ message, type = "success", onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDismiss?.(), 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  const bg =
    type === "error"
      ? "var(--danger)"
      : type === "warning"
        ? "var(--warning)"
        : "var(--success)";

  return (
    <div className="seller-toast" style={{ background: bg }}>
      <span>{message}</span>
      <button className="seller-toast-close" onClick={onDismiss}>
        ✕
      </button>
    </div>
  );
}

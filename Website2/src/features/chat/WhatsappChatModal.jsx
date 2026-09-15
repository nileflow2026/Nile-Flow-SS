import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const WhatsappChatModal = ({ messages, onSend, onClose, isSending, error }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = event.currentTarget.elements.message.value;

    if (text.trim()) {
      onSend(text);
      event.currentTarget.reset();
    }
  };

  return createPortal(
    <div className="wa-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="wa-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-chat-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="wa-chat-header">
          <div>
            <span className="wa-chat-eyebrow">WhatsApp support</span>
            <h2 id="wa-chat-title">Nile Flow Support</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close chat">
            ×
          </button>
        </div>

        <div className="wa-chat-messages" aria-live="polite">
          {messages.length === 0 && (
            <p className="wa-chat-empty">Send us a message and our support team will get back to you.</p>
          )}
          {messages.map((msg, index) => (
            <div
              key={`${msg.timestamp ?? "message"}-${index}`}
              className={`wa-chat-message ${msg.type === "user" ? "is-user" : ""}`}
            >
              {msg.text}
              <span>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {error && <p className="wa-chat-error" role="alert">{error}</p>}
        </div>

        <form className="wa-input-area" onSubmit={handleSubmit}>
          <input ref={inputRef} type="text" name="message" placeholder="Type a message..." aria-label="Message" />
          <button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>,
    document.body,
  );
};

export default WhatsappChatModal;
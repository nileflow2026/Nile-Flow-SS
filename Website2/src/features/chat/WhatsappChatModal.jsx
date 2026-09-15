import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCheck, Send, Smile, X } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "😊", "😍", "🥰", "😎", "🤝", "👍", "👏", "🙏",
  "❤️", "💚", "🎉", "✨", "🔥", "💡", "📦", "🛍️", "🚚", "✅",
  "😅", "🤔", "😢", "😮", "😡", "🙌", "💯", "⭐", "🌍", "☀️",
];

const WhatsappChatModal = ({ messages, onSend, onClose, isSending, error, connectionStatus }) => {
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const pickerRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showEmojiPicker) {
        setShowEmojiPicker(false);
        return;
      }
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
  }, [onClose, showEmojiPicker]);

  useEffect(() => {
    const messageList = messagesRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = draft.trim();

    if (text.trim()) {
      onSend(text);
      setDraft("");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const nextDraft = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
    setDraft(nextDraft);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      input?.focus();
      const cursorPosition = start + emoji.length;
      input?.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const statusLabel = connectionStatus === "online" ? "Online now" : "Usually replies quickly";

  return createPortal(
    <div className="wa-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="wa-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-chat-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="wa-chat-header">
          <div className="wa-chat-avatar" aria-hidden="true">
            <img src="/logo.png" alt="" />
          </div>
          <div>
            <span className="wa-chat-eyebrow">Nile Flow Support</span>
            <h2 id="wa-chat-title">Nile Flow Support</h2>
            <span className={`wa-chat-status ${connectionStatus === "online" ? "is-online" : ""}`}>
              <span /> {statusLabel}
            </span>
          </div>
          <button className="wa-icon-button" type="button" onClick={onClose} aria-label="Close chat">
            <X size={19} />
          </button>
        </header>

        <div ref={messagesRef} className="wa-chat-messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="wa-chat-welcome">
              <div className="wa-welcome-icon">
                <img src="/logo.png" alt="" />
              </div>
              <strong>Welcome to Nile Flow Support</strong>
              <p>Ask us anything about products, orders, or delivery. We're here to help.</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={`${msg.timestamp ?? "message"}-${index}`}
              className={`wa-chat-message ${msg.type === "user" ? "is-user" : ""}`}
            >
              {msg.text}
              <span className="wa-chat-meta">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {msg.type === "user" && <CheckCheck size={13} />}
              </span>
            </div>
          ))}
          {error && <p className="wa-chat-error" role="alert">{error}</p>}
        </div>

        <form className="wa-input-area" onSubmit={handleSubmit}>
          <div className="wa-emoji-picker-wrap" ref={pickerRef}>
            {showEmojiPicker && (
              <div className="wa-emoji-picker" role="dialog" aria-label="Emoji picker">
                <div className="wa-emoji-picker-title">Choose an emoji</div>
                <div className="wa-emoji-grid">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="wa-emoji-option"
                      onClick={() => insertEmoji(emoji)}
                      aria-label={`Insert ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              className={`wa-composer-icon ${showEmojiPicker ? "is-active" : ""}`}
              type="button"
              onClick={() => setShowEmojiPicker((isOpen) => !isOpen)}
              aria-label="Add emoji"
              aria-expanded={showEmojiPicker}
              title="Emoji"
            >
            <Smile size={19} />
            </button>
          </div>
          <textarea
            ref={inputRef}
            name="message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message"
            aria-label="Message"
            rows="1"
          />
          <button className="wa-send-button" type="submit" disabled={isSending || !draft.trim()} aria-label="Send message">
            <Send size={17} />
          </button>
        </form>
      </section>
    </div>,
    document.body,
  );
};

export default WhatsappChatModal;
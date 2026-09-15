import React, { useEffect, useState } from "react";
import { httpClient } from "@api/client/HttpClient";
import io from "socket.io-client";
import WhatsappChatModal from "./WhatsappChatModal";

const useChatMessages = () => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [messageId, setMessageId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const chatSocket = io("https://nile-flow-backend-5dqm.onrender.com", {
      transports: ["websocket"],
    });

    chatSocket.on("chat-reply", (reply) => {
      setMessages((prev) => [...prev, reply]);
    });
    chatSocket.on("connect_error", () => {
      setError("Live support is temporarily unavailable. Your message can still be sent.");
    });
    setSocket(chatSocket);

    return () => chatSocket.disconnect();
  }, []);

  useEffect(() => {
    if (socket && messageId) {
      socket.emit("join-chat-room", messageId);
    }
  }, [socket, messageId]);

  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) return;

    setIsSending(true);
    setError("");
    const message = {
      text: trimmedText,
      type: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);

    try {
      const response = await httpClient.post(
        "/api/contact-nile-flow/contact",
        {
          username: "Guest visitor",
          email: "guest@nileflowafrica.com",
          message: trimmedText,
        },
        { skipAuth: true, withCredentials: false },
      );
      const responseData = response.data || {};
      const nextMessageId = responseData.messageId;
      if (nextMessageId) setMessageId(nextMessageId);
      if (responseData.reply) {
        setMessages((prev) => [
          ...prev,
          { text: responseData.reply, type: "support", timestamp: new Date().toISOString() },
        ]);
      }
    } catch {
      setMessages((prev) => prev.filter((item) => item !== message));
      setError("We could not send your message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return { messages, sendMessage, isSending, error };
};

const WhatsappChat = () => {
  const [show, setShow] = useState(false);

  // Only show on /home path, not on / (LandingPage)
  // Using window.location instead of useLocation() since this component
  // lives outside the React Router context (before AppProviders).
  const onlyOnHome = window.location.pathname === "/home";

  const { messages, sendMessage, isSending, error } = useChatMessages();

  return (
    <div>
      {/* Only render the floating button and chat modal on home page */}
      {onlyOnHome && (
        <>
          <button
            type="button"
            onClick={() => setShow(true)}
            className="wa-floating-chat-btn"
            aria-label="Open WhatsApp chat"
          >
            💬
          </button>

          {show && (
            <WhatsappChatModal
              messages={messages}
              onSend={sendMessage}
              onClose={() => setShow(false)}
              isSending={isSending}
              error={error}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WhatsappChat;

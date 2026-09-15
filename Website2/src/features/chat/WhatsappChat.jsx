import React, { useEffect, useState } from "react";
import { httpClient } from "@api/client/HttpClient";
import io from "socket.io-client";
import WhatsappChatModal from "./WhatsappChatModal";

const useChatMessages = () => {
  const storageKey = "nile-flow-support-chat";
  const hydratedRef = React.useRef(false);
  const messageIdRef = React.useRef(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [messageId, setMessageId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    try {
      const savedChat = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (savedChat?.messageId) setMessageId(savedChat.messageId);
      if (Array.isArray(savedChat?.messages)) setMessages(savedChat.messages);
    } catch {
      localStorage.removeItem(storageKey);
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    messageIdRef.current = messageId;
    if (!hydratedRef.current) return;
    localStorage.setItem(storageKey, JSON.stringify({ messageId, messages }));
  }, [messageId, messages]);

  useEffect(() => {
    const chatSocket = io("https://nile-flow-backend-5dqm.onrender.com", {
      transports: ["websocket"],
    });

    chatSocket.on("chat-reply", (reply) => {
      setMessages((prev) => [...prev, reply]);
    });
    chatSocket.on("connect", () => {
      setConnectionStatus("online");
      setError("");
      if (messageIdRef.current) chatSocket.emit("join-chat-room", messageIdRef.current);
    });
    chatSocket.on("connect_error", () => {
      setConnectionStatus("offline");
      setError("Live support is temporarily unavailable. Your message can still be sent.");
    });
    chatSocket.on("disconnect", () => setConnectionStatus("offline"));
    setSocket(chatSocket);

    return () => chatSocket.disconnect();
  }, []);

  useEffect(() => {
    if (socket?.connected && messageId) {
      socket.emit("join-chat-room", messageId);
    }
  }, [socket, messageId]);

  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) return;

    const isFirstMessage = !messageId;
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
          conversationId: isFirstMessage ? undefined : messageId,
        },
        { skipAuth: true, withCredentials: false },
      );
      const responseData = response.data || {};
      const nextMessageId = responseData.messageId;
      if (isFirstMessage && nextMessageId) setMessageId(nextMessageId);
      if (isFirstMessage && responseData.reply) {
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

  return { messages, sendMessage, isSending, error, connectionStatus };
};

const WhatsappChat = () => {
  const [show, setShow] = useState(false);

  // Only show on /home path, not on / (LandingPage)
  // Using window.location instead of useLocation() since this component
  // lives outside the React Router context (before AppProviders).
  const onlyOnHome = window.location.pathname === "/home";

  const { messages, sendMessage, isSending, error, connectionStatus } = useChatMessages();

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
              connectionStatus={connectionStatus}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WhatsappChat;

import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import WhatsappChatModal from "./WhatsappChatModal";

const useWebSocket = (onlyOnHome) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect socket if we're on the home page (or no restriction)
    if (onlyOnHome && window.location.pathname !== "/home") {
      return; // Skip socket initialization entirely
    }

    const newSocket = io("https://nile-flow-backend-5dqm.onrender.com", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
    });

    newSocket.on("new_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on("message_echo", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [onlyOnHome, window.location.pathname]);

  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit("send_message", { text, userId: "current_user" });
    }
  };

  return { messages, sendMessage };
};

const WhatsappChat = () => {
  const [show, setShow] = useState(false);

  // Only show on /home path, not on / (LandingPage)
  // Using window.location instead of useLocation() since this component
  // lives outside the React Router context (before AppProviders).
  const onlyOnHome = window.location.pathname === "/home";

  const { messages, sendMessage } = useWebSocket(onlyOnHome);

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

          {show && <WhatsappChatModal messages={messages} onSend={sendMessage} onClose={() => setShow(false)} />}
        </>
      )}
    </div>
  );
};

export default WhatsappChat;

import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";

const AI_API_URL = import.meta.env.VITE_API_URL || "https://ethereal-beauty-1.onrender.com";

function RobotChat({ onOpen = () => {} }) {
  return (
    <div className="floating-widget floating-widget-robot">
      <button type="button" className="utility-launcher robot-launcher" aria-label="Open AI chat" onClick={onOpen}>
        <span className="utility-icon" aria-hidden="true">
          AI
        </span>
      </button>
    </div>
  );
}

export function AIChatContent({ onClose = () => {} }) {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmedMessage = messageInput.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    const userEntry = {
      role: "user",
      label: "You",
      content: trimmedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((current) => [...current, userEntry]);
    setMessageInput("");
    setIsLoading(true);

    try {
      const response = await fetch (`${AI_API_URL}/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: localStorage.getItem("user") || "default",
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || "Unable to reach the AI right now.");
      }

      const payload = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          label: "Zealot",
          content: payload.reply || "State the problem more clearly. Precision makes better answers possible.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (_error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          label: "Zealot",
          content: "The channel is unavailable for a moment. Return with the same question, but keep it precise.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-floating-origin">
      <Draggable nodeRef={dragRef} handle=".ai-header">
        <div ref={dragRef} className="ai-container">
          <div className="ai-header">
            <span>Zealot</span>
            <button type="button" className="ai-close" onClick={onClose} aria-label="Close Zealot">
              x
            </button>
          </div>

          <div className="chat-messages ai-messages" ref={messagesRef}>
            {messages.length === 0 ? (
              <p className="chat-empty">Ask directly. Zealot will answer with clarity.</p>
            ) : (
              messages.map((entry, index) => (
                <div
                  key={`${entry.role}-${index}-${entry.content}`}
                  className={entry.role === "assistant" ? "chat-bubble ai-bubble" : "chat-bubble ai-user-bubble"}
                >
                  <span className="chat-sender">{entry.label}</span>
                  <p>{entry.content}</p>
                  <span className="chat-timestamp">{entry.timestamp}</span>
                </div>
              ))
            )}
            {isLoading ? <p className="robot-thinking">AI is thinking...</p> : null}
          </div>

          <div className="chat-compose-row">
            <input
              type="text"
              className="chat-input ai-input"
              placeholder="Ask Zealot..."
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <button type="button" className="primary-button ai-send" onClick={handleSend} disabled={isLoading}>
              Send
            </button>
          </div>
        </div>
      </Draggable>
    </div>
  );
}

export default RobotChat;

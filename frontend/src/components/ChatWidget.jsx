import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getStoredIdentity, saveEmailIdentity } from "../lib/userIdentity.js";

const SOCKET_URL = https://ethereal-beauty-1.onrender.com;

const createRoomId = (firstUserId, secondUserId) =>
  [firstUserId.trim(), secondUserId.trim()].sort().join("__");

function ChatWidget({ onOpen = () => {} }) {
  return (
    <div className="floating-widget floating-widget-chat">
      <button type="button" className="chat-launcher" aria-label="Open chat" onClick={onOpen}>
        <span className="widget-launcher-text">Chat</span>
      </button>
    </div>
  );
}

export function UserChatContent() {
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [connectedUserId, setConnectedUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesRef = useRef(null);
  const socketRef = useRef(null);

  const hasIdentity = Boolean(userId && userEmail);
  const isConnectedToUser = Boolean(roomId && connectedUserId);

  useEffect(() => {
    const identity = getStoredIdentity();
    setUserId(identity.userId);
    setUserEmail(identity.email);
    setEmailInput(identity.email);

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    socket.on("receive_message", (payload) => {
      setMessages((current) => [
        ...current,
        {
          ...payload,
          timestamp: payload.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSaveEmail = () => {
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail.includes("@")) {
      return;
    }

    const identity = saveEmailIdentity(trimmedEmail);
    setUserId(identity.userId);
    setUserEmail(identity.email);
    setTargetUserId("");
    setConnectedUserId("");
    setRoomId("");
    setMessages([]);
  };

  const handleConnect = () => {
    const nextTargetUserId = targetUserId.trim();

    if (!socketRef.current || !hasIdentity || !nextTargetUserId || nextTargetUserId === userId) {
      return;
    }

    const nextRoomId = createRoomId(userId, nextTargetUserId);
    socketRef.current.emit("join_room", nextRoomId);
    setRoomId(nextRoomId);
    setConnectedUserId(nextTargetUserId);
    setMessages([]);
  };

  const handleSendMessage = () => {
    const trimmedMessage = messageInput.trim();

    if (!socketRef.current || !isConnectedToUser || !trimmedMessage) {
      return;
    }

    const payload = {
      room: roomId,
      message: trimmedMessage,
      sender: userId,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    socketRef.current.emit("send_message", payload);
    setMessages((current) => [...current, payload]);
    setMessageInput("");
  };

  return (
    <>
      <p className="chat-status">
        {hasIdentity ? `${userEmail} - ${userId}` : "Set your email to start chatting"}
      </p>
      <p className="chat-status">
        {isConnectedToUser ? `Connected to ${connectedUserId}` : isSocketConnected ? "Online" : "Offline"}
      </p>

      {!hasIdentity ? (
        <div className="chat-connect-row">
          <input
            type="email"
            className="chat-input"
            placeholder="Enter your email"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSaveEmail();
              }
            }}
          />
          <button type="button" className="primary-button" onClick={handleSaveEmail}>
            Save
          </button>
        </div>
      ) : (
        <>
          <div className="chat-connect-row">
            <input
              type="text"
              className="chat-input"
              placeholder="Enter another user's ID"
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
            />
            <button type="button" className="secondary-button" onClick={handleConnect}>
              Connect
            </button>
          </div>

          <div className="chat-messages" ref={messagesRef}>
            {messages.length === 0 ? (
              <p className="chat-empty">
                {isConnectedToUser ? "No messages yet." : "Connect to another user to start chatting."}
              </p>
            ) : (
              messages.map((entry, index) => (
                <div
                  key={`${entry.sender}-${index}-${entry.message}`}
                  className={entry.sender === userId ? "chat-bubble chat-bubble-self" : "chat-bubble"}
                >
                  <span className="chat-sender">{entry.sender}</span>
                  <p>{entry.message}</p>
                  <span className="chat-timestamp">{entry.timestamp || ""}</span>
                </div>
              ))
            )}
          </div>

          <div className="chat-compose-row">
            <input
              type="text"
              className="chat-input"
              placeholder={isConnectedToUser ? "Type a message..." : "Connect before sending"}
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage();
                }
              }}
              disabled={!isConnectedToUser}
            />
            <button type="button" className="primary-button" onClick={handleSendMessage} disabled={!isConnectedToUser}>
              Send
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default ChatWidget;

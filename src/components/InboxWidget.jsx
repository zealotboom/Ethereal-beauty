import { useEffect, useMemo, useState } from "react";

const INBOX_STORAGE_KEY = "ethereal-inbox-items";
const LEGACY_INBOX_IDS = new Set(["inbox-1", "inbox-2", "inbox-3"]);

function InboxWidget({ onOpen = () => {} }) {
  return (
    <div className="floating-widget floating-widget-inbox">
      <button type="button" className="utility-launcher inbox-launcher" aria-label="Open inbox" onClick={onOpen}>
        <span className="utility-icon" aria-hidden="true">
          Inbox
        </span>
        <span className="utility-label">Inbox</span>
      </button>
    </div>
  );
}

export function InboxContent() {
  const [items, setItems] = useState([]);
  const [activeReplyId, setActiveReplyId] = useState("");
  const [replyInput, setReplyInput] = useState("");

  useEffect(() => {
    const storedItems = localStorage.getItem(INBOX_STORAGE_KEY);

    if (storedItems) {
      try {
        const parsedItems = JSON.parse(storedItems);
        const hasOnlyLegacyItems =
          Array.isArray(parsedItems) &&
          parsedItems.length > 0 &&
          parsedItems.every((item) => LEGACY_INBOX_IDS.has(item.id));

        setItems(hasOnlyLegacyItems || !Array.isArray(parsedItems) ? [] : parsedItems);
      } catch (_error) {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const repliedCount = useMemo(() => items.filter((item) => item.replied).length, [items]);

  const handleReply = (itemId) => {
    const trimmedReply = replyInput.trim();

    if (!trimmedReply) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              replied: true,
              replyText: trimmedReply,
              preview: `You: ${trimmedReply}`,
            }
          : item
      )
    );
    setReplyInput("");
    setActiveReplyId("");
  };

  return (
    <>
      <p className="chat-status">
        {items.length === 0 ? "No messages yet" : `${repliedCount} replied conversations`}
      </p>

      <div className="inbox-list">
        {items.length === 0 ? (
          <p className="chat-empty">No messages yet</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="inbox-item">
              <div className="inbox-item-header">
                <strong>{item.sender}</strong>
                <span className={`reply-badge ${item.replied ? "reply-badge-done" : ""}`}>
                  {item.replied ? "Replied" : "Waiting"}
                </span>
              </div>
              <p className="inbox-preview">{item.preview}</p>

              {activeReplyId === item.id ? (
                <div className="inbox-reply-row">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Type your reply..."
                    value={replyInput}
                    onChange={(event) => setReplyInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleReply(item.id);
                      }
                    }}
                  />
                  <button type="button" className="primary-button" onClick={() => handleReply(item.id)}>
                    Send
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setActiveReplyId(item.id);
                    setReplyInput(item.replyText || "");
                  }}
                >
                  Reply
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default InboxWidget;

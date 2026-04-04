export const SYSTEM_PROMPT = {
  role: "system",
  content:
    "You are a helpful AI assistant. Maintain context across messages. If something is unclear, ask a clarifying question.",
};

export const MAX_MEMORY_MESSAGES = 10;

const conversations = Object.create(null);

const normalizeUserId = (userId) => String(userId || "default").trim() || "default";

export const getConversationMessages = (userId = "default") => {
  const normalizedUserId = normalizeUserId(userId);
  return conversations[normalizedUserId] ? [...conversations[normalizedUserId]] : [];
};

export const setConversationMessages = (userId = "default", messages = []) => {
  const normalizedUserId = normalizeUserId(userId);
  conversations[normalizedUserId] = messages.slice(-MAX_MEMORY_MESSAGES);
  return getConversationMessages(normalizedUserId);
};

export const appendConversationMessage = (userId = "default", message) => {
  const normalizedUserId = normalizeUserId(userId);
  const currentMessages = getConversationMessages(normalizedUserId);
  const nextMessages = [...currentMessages, message].slice(-MAX_MEMORY_MESSAGES);
  conversations[normalizedUserId] = nextMessages;
  return [...nextMessages];
};

export const buildConversationForModel = (userId = "default") => {
  return [SYSTEM_PROMPT, ...getConversationMessages(userId)];
};

export const clearConversation = (userId = "default") => {
  const normalizedUserId = normalizeUserId(userId);
  delete conversations[normalizedUserId];
};

export const clearAllConversations = () => {
  Object.keys(conversations).forEach((userId) => {
    delete conversations[userId];
  });
};

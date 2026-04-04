import OpenAI from "openai";
import {
  appendConversationMessage,
  buildConversationForModel,
  getConversationMessages,
} from "../utils/chatMemory.js";

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);

const client = hasOpenAIKey
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : hasOpenRouterKey
    ? new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      })
    : null;

const model = hasOpenAIKey ? "gpt-4o-mini" : "openai/gpt-3.5-turbo";

const createCompletion = async (messages) => {
  if (!client) {
    throw new Error("No AI provider key is configured.");
  }

  const response = await client.chat.completions.create({
    model,
    messages,
  });

  return response.choices?.[0]?.message?.content?.trim() || "I'm not sure how to answer that yet.";
};

export const createChatService = ({ completeChat = createCompletion } = {}) => {
  return async ({ userId = "default", message }) => {
    const trimmedMessage = String(message || "").trim();

    if (!trimmedMessage) {
      throw new Error("A message is required.");
    }

    // Add the user's message before generating the reply so memory stays continuous.
    appendConversationMessage(userId, {
      role: "user",
      content: trimmedMessage,
    });

    const conversation = buildConversationForModel(userId);
    const reply = await completeChat(conversation);

    appendConversationMessage(userId, {
      role: "assistant",
      content: reply,
    });

    return {
      reply,
      history: getConversationMessages(userId),
    };
  };
};

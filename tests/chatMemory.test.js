import assert from "node:assert/strict";
import test from "node:test";
import { createChatService } from "../services/chatService.js";
import { clearAllConversations, getConversationMessages } from "../utils/chatMemory.js";

test("chat memory keeps context so the assistant can recall the user's name", async () => {
  clearAllConversations();

  const service = createChatService({
    completeChat: async (messages) => {
      const latestUserMessage = messages.at(-1)?.content || "";
      const nameIntroduction = messages.find(
        (entry) => entry.role === "user" && /^My name is /i.test(entry.content)
      );

      if (/what is my name\??/i.test(latestUserMessage) && nameIntroduction) {
        return `Your name is ${nameIntroduction.content.replace(/^My name is /i, "").trim()}.`;
      }

      return "I'll remember that.";
    },
  });

  await service({
    userId: "zealot-test",
    message: "My name is Zealot",
  });

  const result = await service({
    userId: "zealot-test",
    message: "What is my name?",
  });

  assert.match(result.reply, /Zealot/);
  assert.equal(getConversationMessages("zealot-test").length, 4);
});

test("chat memory keeps only the last ten messages per user", async () => {
  clearAllConversations();

  const service = createChatService({
    completeChat: async () => "ok",
  });

  for (let index = 0; index < 7; index += 1) {
    await service({
      userId: "trim-test",
      message: `message-${index}`,
    });
  }

  const history = getConversationMessages("trim-test");

  assert.equal(history.length, 10);
  assert.equal(history[0].content, "message-2");
  assert.equal(history.at(-1)?.content, "ok");
});

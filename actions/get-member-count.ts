import { bot } from "..";
import { updateSettings } from "../helpers/api";

export const getMemberCount = async (chatId: number) => {
  await bot.api.getChatMemberCount(chatId).then((count: number) => {
    // Set count as 0 if there are 2 or less members in the chat
    // because this would mean it’s a private chat with the bot.
    // Then subtract 1 from the count to account for the bot itself.
    const memberCount = count <= 2 ? 0 : count - 1;

    updateSettings(chatId, "chat_size", memberCount);
  });
};

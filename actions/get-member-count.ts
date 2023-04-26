import { bot } from "..";
import { updateSettings } from "../helpers/api";

/**
 * Save group chat size to database for anonymous analytics.
 * @param chatId Telegram Chat ID
 */
export const getMemberCount = async (chatId: number) => {
  try {
    await bot.api
      .getChatMemberCount(chatId)
      .then((count: number) => {
        // Set count as 0 if there are 2 or less members in the chat
        // because this would mean it’s a private chat with the bot.
        // Otherwise subtract 1 from the count to account for the bot itself.
        const memberCount = count <= 2 ? 0 : count - 1;

        updateSettings(chatId, "chat_size", memberCount);
      })
      .catch(() => {
        console.error(`[Error] Could not get member count.`);
      });
  } catch (error) {
    console.error(`[Error] Could not get member count.`);
    // @ts-ignore
    console.error(error.message);
    return;
  }
};

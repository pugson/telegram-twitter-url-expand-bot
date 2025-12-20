import { bot } from "..";
import { updateSettings } from "../helpers/api";
import { logger } from "../helpers/logger";

/**
 * Save group chat size to database for anonymous analytics.
 * @param chatId Telegram Chat ID
 */
export const getMemberCount = async (chatId: number) => {
  try {
    const count = await bot.api.getChatMemberCount(chatId);
    // Set count as 0 if there are 2 or less members in the chat
    // because this would mean it's a private chat with the bot.
    // Otherwise subtract 1 from the count to account for the bot itself.
    const memberCount = count <= 2 ? 0 : count - 1;

    try {
      await updateSettings(chatId, "chat_size", memberCount);
    } catch (error) {
      logger.error("Error updating chat size: {error}", { error });
    }
  } catch (error) {
    logger.error("Could not get member count: {error}", { error });
    return;
  }
};

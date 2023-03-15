import { bot } from "..";

/**
 * Displays the "is typing..." animated indicator inside Telegram.
 * @param chatId ID of current chat.
 */
export const showBotActivity = async (chatId: number) => {
  try {
    bot.api.sendChatAction(chatId, "typing");
  } catch (error) {
    console.error(`[Error] Could not display bot activity indicator.`);
    console.error(error.message);
  }
};

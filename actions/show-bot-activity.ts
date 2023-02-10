import { bot } from "..";

/**
 * Displays the "is typing..." animated indicator inside Telegram.
 * @param chatId ID of current chat.
 */
export const showBotActivity = async (chatId: number) => {
  bot.sendChatAction(chatId, "typing");
};

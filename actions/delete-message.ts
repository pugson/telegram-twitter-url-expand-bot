import { bot } from "..";

/**
 * Delete a Telegram message in chat.
 * @param chatId Telegram Chat ID
 * @param msgId Telegram Message ID
 */
export const deleteMessage = async (chatId: string | number, msgId: number) => {
  await bot.api.deleteMessage(chatId, msgId);
};

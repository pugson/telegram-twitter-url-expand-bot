import { bot } from "../..";

/**
 * Delete a Telegram message in chat.
 * @param chatId
 * @param msgId
 */
export const deleteMessage = async (chatId: number, msgId: number) => {
  await bot.api.deleteMessage(chatId, msgId);
};

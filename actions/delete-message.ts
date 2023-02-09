import { bot } from "..";

export const deleteMessage = async (msg: any, chatId: string) => {
  bot.deleteMessage(chatId, msg.message_id);
};

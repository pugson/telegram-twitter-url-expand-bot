import { bot } from "../helpers/bot";

export const deleteMessage = async (msg: any, chatId: string) => {
  bot.deleteMessage(chatId, msg.id);
};

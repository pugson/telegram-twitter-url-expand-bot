import { ChatId, MessageId } from "node-telegram-bot-api";
import { bot } from "..";

export const deleteMessage = async (chatId: ChatId, msgId: number) => {
  bot.deleteMessage(chatId, msgId.toString());
};

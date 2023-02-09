import { bot } from "..";

export const showBotActivity = async (chatId: string) => {
  bot.sendChatAction(chatId, "typing");
};

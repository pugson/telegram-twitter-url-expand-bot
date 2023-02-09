import { bot } from "../helpers/bot";

export const showBotActivity = async (chatId: string) => {
  bot.sendChatAction(chatId, "typing");
};

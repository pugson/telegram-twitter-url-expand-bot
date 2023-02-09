import { bot } from "../helpers/bot";

export const getMemberCount = async (chatId: string) => {
  bot.getChatMembersCount(chatId).then((count: number) => {
    console.log(count);
  });
};

import Tgfancy from "tgfancy";

export const bot = new Tgfancy(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
export const sendMessage = (bot.sendMessage as Function) || (() => {});

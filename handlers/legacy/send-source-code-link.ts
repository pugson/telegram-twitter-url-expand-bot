import { showBotActivity } from "./show-bot-activity";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "./delete-message";
import { bot } from "..";

bot.onText(/^\/source/, async (msg: any) => {
  const chatId = msg.chat.id;

  showBotActivity(chatId);
  deleteMessage(msg, chatId);
  bot.sendMessage(
    chatId,
    `This bot’s source code is available on GitHub: https://github.com/pugson/telegram-twitter-url-expand-bot`
  );

  trackEvent("command.sourceCode");
});

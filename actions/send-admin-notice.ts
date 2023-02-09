import { trackEvent } from "../helpers/analytics";
import { bot } from "../helpers/bot";
import { deleteMessage } from "./delete-message";
import { showBotActivity } from "./show-bot-activity";

bot.onText(/^\/admin/, async (msg: any) => {
  const chatId = msg.chat.id;

  showBotActivity(chatId);
  deleteMessage(msg, chatId);
  bot.sendMessage(
    chatId,
    `An admin of this chat needs to give this bot admin permissions to automatically delete messages when expanding links.`
  );

  trackEvent("command.admin");
});

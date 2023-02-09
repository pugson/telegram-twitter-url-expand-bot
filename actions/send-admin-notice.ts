import { bot } from "..";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "./delete-message";
import { showBotActivity } from "./show-bot-activity";

// TODO: Check if bot is admin in chat before auto-deleting a message
// https://core.telegram.org/bots/api#getmydefaultadministratorrights
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

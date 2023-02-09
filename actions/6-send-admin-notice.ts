import { trackEvent } from "../helpers/analytics";
import { bot } from "../helpers/bot";

bot.onText(/^\/admin/, async (msg) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `An admin of this chat needs to give this bot admin permissions to automatically delete messages when expanding links.`,
    {
      reply_to_message_id: msg.message_id,
    }
  );

  trackEvent("command.admin");
});

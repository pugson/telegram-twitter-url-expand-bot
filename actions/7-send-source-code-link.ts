import { trackEvent } from "../helpers/analytics";
import { bot } from "../helpers/bot";

bot.onText(/^\/source/, async (msg) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `This bot’s source code is available on GitHub: https://github.com/pugson/telegram-twitter-url-expand-bot`,
    {
      reply_to_message_id: msg.message_id,
    }
  );

  trackEvent("command.sourceCode");
});

import { bot } from "..";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { showBotActivity } from "../actions/show-bot-activity";

bot.command("start", async (ctx: Context) => {
  if (!ctx.msg) return;

  const chatId = ctx?.msg?.chat.id;
  const msgId = ctx?.msg?.message_id;
  const privateChat = ctx?.msg?.chat.type === "private";

  showBotActivity(chatId);
  deleteMessage(chatId, msgId);
  ctx.reply(
    `👋 Hello! I’m a bot that expands Twitter, Instagram, and TikTok URLs. Send me a link and I’ll expand it for you. 🔗🖼️

Configure link expanding with /autoexpand
Configure receiving changelog updates with /changelog
`,
    privateChat
      ? {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Add me to your group",
                  url: "tg://resolve?domain=TwitterLinkExpanderBot&startgroup&admin=delete_messages&custom_title=bot",
                },
              ],
            ],
          },
        }
      : undefined
  );

  trackEvent("command.start");
});

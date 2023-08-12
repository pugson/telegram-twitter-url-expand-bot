import { bot } from "..";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { showBotActivity } from "../actions/show-bot-activity";

bot.command("start", async (ctx: Context) => {
  if (!ctx.msg) return;

  try {
    // This needs to be wrapped in try/catch because someone can block the bot
    // and it will throw an error that prevents the bot from starting since it’s the entry command.
    const chatId = ctx?.msg?.chat.id;
    const msgId = ctx?.msg?.message_id;
    const privateChat = ctx?.msg?.chat.type === "private";
    const topicId = ctx.msg?.message_thread_id;

    showBotActivity(ctx, chatId);
    deleteMessage(chatId, msgId);
    ctx
      .reply(
        `👋 Hello! I’m a bot that expands Twitter, Instagram, TikTok, and Posts․cv URLs. Send me a link and I’ll expand it for you. 🔗🖼️

Commands:
/autoexpand - Configure link expanding
/changelog - Configure receiving changelog updates

You can also add me to your channel and I will edit messages with links to expand them automatically.
`,
        privateChat
          ? {
              message_thread_id: topicId ?? undefined,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "Add me to your group (if you’re an admin)",
                      url: "tg://resolve?domain=TwitterLinkExpanderBot&startgroup&admin=delete_messages",
                    },
                  ],
                  [
                    {
                      text: "Add me to your group (if you’re a member)",
                      url: "tg://resolve?domain=TwitterLinkExpanderBot&startgroup",
                    },
                  ],
                  [
                    {
                      text: "Add me to your channel",
                      url: "tg://resolve?domain=TwitterLinkExpanderBot&startchannel&admin=edit_messages",
                    },
                  ],
                ],
              },
            }
          : {
              message_thread_id: topicId ?? undefined,
            }
      )
      .catch(() => {
        console.error(`[Error] [start.ts:61] Failed to send start message.`);
        return;
      });

    trackEvent("command.start");
  } catch (error) {
    console.error({
      message: "Error replying to the start command",
      error,
    });
    return;
  }
});

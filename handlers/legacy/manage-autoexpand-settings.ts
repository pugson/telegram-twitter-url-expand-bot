import { getMemberCount } from "./get-member-count";
import { Message } from "node-telegram-bot-api";
import { bot } from "..";
import { showBotActivity } from "./show-bot-activity";
import { trackEvent } from "../helpers/analytics";
import { createSettings, getSettings, updateSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { autoexpandMessageTemplate } from "../helpers/templates";
import { deleteMessage } from "./delete-message";

const FIELD_NAME = "autoexpand";

/**
 * Manage autoexpand settings
 */
bot.onText(/^\/autoexpand/, async (msg: Message) => {
  const chatId = msg.chat.id;
  showBotActivity(chatId);

  try {
    // Get autoexpand settings for this chat
    const settings = await getSettings(chatId);

    if (settings) {
      deleteMessage(chatId, msg.message_id);
      // Reply with template and buttons to control autoexpand settings
      bot.sendMessage(chatId, autoexpandMessageTemplate(settings.autoexpand), {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: settings.autoexpand ? "❌ Disable" : "✅ Enable",
                callback_data: `autoexpand:${settings.autoexpand ? "off" : "on"}`,
              },
              {
                text: "✨ Done",
                callback_data: "autoexpand:done",
              },
            ],
          ],
        },
      });
    } else {
      deleteMessage(chatId, msg.message_id);
      // Create default settings for this chat
      createSettings(chatId, true);
      // Reply with template and buttons to control autoexpand settings (default: on)
      bot.sendMessage(chatId, autoexpandMessageTemplate(true), {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "❌ Disable",
                callback_data: `autoexpand:off`,
              },
              {
                text: "✨ Done",
                callback_data: "autoexpand:done",
              },
            ],
          ],
        },
      });
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }
});

/**
 * Handle button responses to /autoexpand
 */
bot.on("callback_query", async (answer: any) => {
  const chatId = answer.message.chat.id;
  const messageId = answer.message.message_id;
  const data = answer.data;

  getMemberCount(chatId);

  if (data.includes("autoexpand:done")) {
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("autoexpand:off")) {
    updateSettings(chatId, FIELD_NAME, false);
    bot.editMessageText(autoexpandMessageTemplate(false), {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Enable",
              callback_data: `autoexpand:on`,
            },
            {
              text: "✨ Done",
              callback_data: "autoexpand:done",
            },
          ],
        ],
      },
    });
    trackEvent("settings.autoexpand.disable");

    return;
  }

  if (data.includes("autoexpand:on")) {
    updateSettings(chatId, FIELD_NAME, true);
    bot.editMessageText(autoexpandMessageTemplate(true), {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "❌ Disable",
              callback_data: `autoexpand:off`,
            },
            {
              text: "✨ Done",
              callback_data: "autoexpand:done",
            },
          ],
        ],
      },
    });
    trackEvent("settings.autoexpand.enable");

    return;
  }
});

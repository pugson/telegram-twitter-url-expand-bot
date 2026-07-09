import { Context } from "grammy";
import { InlineKeyboardButton } from "@grammyjs/types";
import { trackEvent } from "../helpers/analytics";
import { getSettings, updateSettings } from "../helpers/api";
import { TOGGLEABLE_PLATFORMS } from "../helpers/platforms";
import { platformsSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { checkAdminStatus } from "../helpers/admin";
import { logger } from "../helpers/logger";

const FIELD_NAME = "disabled_platforms";
const TOGGLE_PREFIX = "platforms:toggle:";

/**
 * Build the inline keyboard grid with one toggle button per platform.
 * @param disabled List of disabled platform keys for this chat
 */
export function platformsSettingsKeyboard(disabled: string[]): InlineKeyboardButton[][] {
  const rows: InlineKeyboardButton[][] = [];

  for (let i = 0; i < TOGGLEABLE_PLATFORMS.length; i += 2) {
    rows.push(
      TOGGLEABLE_PLATFORMS.slice(i, i + 2).map((platform) => ({
        text: `${disabled.includes(platform.key) ? "❌" : "✅"} ${platform.label}`,
        callback_data: `${TOGGLE_PREFIX}${platform.key}`,
      }))
    );
  }

  rows.push([
    {
      text: "✨ Done",
      callback_data: "platforms:done",
    },
  ]);

  return rows;
}

/**
 * Handle button responses to /platforms
 * @param ctx Telegram context
 */
export async function handlePlatformsSettings(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  // Only process platforms callbacks
  if (!data.startsWith("platforms:")) return;

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    logger.error("Error getting settings: {error}", { error });
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    logger.error("Non-admin tried to change locked platform settings");
    return;
  }

  if (data === "platforms:done") {
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer platforms done callback query");
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.startsWith(TOGGLE_PREFIX)) {
    const key = data.slice(TOGGLE_PREFIX.length);

    // Ignore unknown platform keys (e.g. from stale buttons)
    if (!TOGGLEABLE_PLATFORMS.some((platform) => platform.key === key)) return;

    const disabled = new Set<string>(settings?.disabled_platforms ?? []);
    const isDisabling = !disabled.has(key);

    if (isDisabling) {
      disabled.add(key);
    } else {
      disabled.delete(key);
    }

    try {
      await updateSettings(chatId, FIELD_NAME, Array.from(disabled));
    } catch (error) {
      logger.error("Error updating platform settings: {error}", { error });
    }

    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer platforms toggle callback query");
      return;
    });

    await ctx.api
      .editMessageText(chatId, messageId, platformsSettingsTemplate(disabled.size), {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: platformsSettingsKeyboard(Array.from(disabled)),
        },
      })
      .catch(() => {
        logger.error("Cannot edit platforms settings message");
        return;
      });

    trackEvent(`settings.platforms.${isDisabling ? "disable" : "enable"}.${key}`);
    return;
  }
}

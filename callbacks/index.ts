import { Context } from "grammy";
import { bot } from "..";
import { getMemberCount } from "../actions/get-member-count";
import { handleManualExpand } from "./manual-expand";
import { handleExpandedLinkDestruction } from "./destruct-expanded-link";
import { handleAutoexpandSettings } from "./settings-autoexpand";
import { handlePlatformsSettings } from "./settings-platforms";
import { handleLockSettings } from "./settings-lock";
import { handleChangelogSettings } from "./settings-changelog";
import { handlePermissionsSettings } from "./settings-permissions";
import { handleUndo } from "./undo";
import { handleSwitchService } from "./switch-service";
import { isBanned } from "../helpers/banned";
import { logger } from "../helpers/logger";

// Multiple bot.on("callback_query") functions cannot run in parallel.
// The bot will only register the first one and ignore the rest.
// This file runs the bot.on("callback_query") listener and imports functions
// that are specific to the callback_query data to keep it more clean.
bot.on("callback_query", async (ctx: Context) => {
  const chatId = ctx.update?.callback_query?.message?.chat.id;
  const data = ctx.update?.callback_query?.data;

  if (!chatId || !data) return;
  if (isBanned(chatId)) return;

  // Telegram accepts one answer per callback query, and the button keeps
  // spinning until it gets one. Handlers answer when they have something to
  // show; anything left unanswered (e.g. locked settings, stale buttons)
  // gets an empty answer at the end. ctx.api is per-update, so this
  // transformer only sees calls made for this callback.
  let answered = false;
  ctx.api.config.use((prev, method, payload, signal) => {
    if (method === "answerCallbackQuery") answered = true;
    return prev(method, payload, signal);
  });

  try {
    // Handle expand callbacks
    await handleManualExpand(ctx);
    await handleExpandedLinkDestruction(ctx);
    await handleUndo(ctx);
    await handleSwitchService(ctx);
    await handleAutoexpandSettings(ctx);
    await handlePlatformsSettings(ctx);
    await handleLockSettings(ctx);
    await handleChangelogSettings(ctx);
    await handlePermissionsSettings(ctx);
  } finally {
    if (!answered) {
      await ctx.answerCallbackQuery().catch(() => {
        logger.warn("Cannot answer callback query");
      });
    }
  }

  // Save anonymous chat member count to database
  getMemberCount(chatId).catch(() => {
    logger.warn("Could not get member count for chat {chatId}", { chatId });
  });
});

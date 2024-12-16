import { Context } from "grammy";
import { bot } from "..";
import { getMemberCount } from "../actions/get-member-count";
import { handleManualExpand } from "./manual-expand";
import { handleExpandedLinkDestruction } from "./destruct-expanded-link";
import { handleAutoexpandSettings } from "./settings-autoexpand";
import { handleLockSettings } from "./settings-lock";
import { handleChangelogSettings } from "./settings-changelog";
import { handlePermissionsSettings } from "./settings-permissions";
import { handleUndo } from "./undo";
import { isBanned } from "../helpers/banned";

// Multiple bot.on("callback_query") functions cannot run in parallel.
// The bot will only register the first one and ignore the rest.
// This file runs the bot.on("callback_query") listener and imports functions
// that are specific to the callback_query data to keep it more clean.
bot.on("callback_query", async (ctx: Context) => {
  const chatId = ctx.update?.callback_query?.message?.chat.id;
  const data = ctx.update?.callback_query?.data;

  if (!chatId || !data) return;
  if (isBanned(chatId)) return;

  // Save chat member count to database
  getMemberCount(chatId);

  // Handle expand callbacks
  if (data.includes("expand:")) {
    await handleManualExpand(ctx);
    return;
  }

  // Handle destruct callbacks
  if (data.includes("destruct:")) {
    await handleExpandedLinkDestruction(ctx);
    return;
  }

  // Handle undo callbacks
  if (data === "undo") {
    await handleUndo(ctx);
    return;
  }

  // Handle settings callbacks
  if (data.includes("settings:autoexpand")) {
    await handleAutoexpandSettings(ctx);
    return;
  }

  if (data.includes("settings:lock")) {
    await handleLockSettings(ctx);
    return;
  }

  if (data.includes("settings:changelog")) {
    await handleChangelogSettings(ctx);
    return;
  }

  if (data.includes("settings:permissions")) {
    await handlePermissionsSettings(ctx);
    return;
  }
});

import { Context } from "grammy";
import { bot } from "..";
import { getMemberCount } from "../actions/get-member-count";
import { handleManualExpand } from "./manual-expand";
import { handleAutoexpandSettings } from "./settings-autoexpand";
import { handleChangelogSettings } from "./settings-changelog";
import { handlePermissionsSettings } from "./settings-permissions";
import { handleLockSettings } from "./settings-lock";
import { handleExpandedLinkDestruction } from "./destruct-expanded-link";
import { isBanned } from "../helpers/banned";

// Multiple bot.on("callback_query") functions cannot run in parallel.
// The bot will only register the first one and ignore the rest.
// This file runs the bot.on("callback_query") listener and imports functions
// that are specific to the callback_query data to keep it more clean.
bot.on("callback_query", async (ctx: Context) => {
  const chatId = ctx.update?.callback_query?.message?.chat.id;

  if (!chatId) return;
  if (isBanned(chatId)) return;

  // Handle specific callbacks / button presses
  handleManualExpand(ctx);
  handleExpandedLinkDestruction(ctx);
  handleAutoexpandSettings(ctx);
  handleChangelogSettings(ctx);
  handlePermissionsSettings(ctx);
  handleLockSettings(ctx);

  // Save chat member count to database
  getMemberCount(chatId);
});

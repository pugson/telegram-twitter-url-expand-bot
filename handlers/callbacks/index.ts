import { Context } from "grammy";
import { bot } from "../..";
import { getMemberCount } from "../actions/get-member-count";
import { handleAutoexpandSettings } from "./settings-autoexpand";
import { handleChangelogSettings } from "./settings-changelog";

// Multiple bot.on("callback_query") functions cannot run in parallel.
// The bot will only register the first one and ignore the rest.
// This file runs the bot.on("callback_query") listener and imports functions
// that are specific to the callback_query data to keep it more clean.
bot.on("callback_query", async (ctx: Context) => {
  const chatId = ctx.update?.callback_query?.message?.chat.id;

  if (!chatId) return;

  // Handle specific callbacks / button presses
  handleAutoexpandSettings(ctx);
  handleChangelogSettings(ctx);

  // Save chat member count to database
  getMemberCount(chatId);
});

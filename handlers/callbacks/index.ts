import { Context } from "grammy";
import { bot } from "../..";
import { handleAutoexpandSettings } from "./settings-autoexpand";
import { handleChangelogSettings } from "./settings-changelog";

// Multiple bot.on("callback_query") functions cannot run in parallel.
// The bot will only register the first one and ignore the rest.
// This file runs the bot.on("callback_query") listener and imports functions
// that are specific to the callback_query data to keep it more clean.
bot.on("callback_query", async (ctx: Context) => {
  handleAutoexpandSettings(ctx);
  handleChangelogSettings(ctx);
});

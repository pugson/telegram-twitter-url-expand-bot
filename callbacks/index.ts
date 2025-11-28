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
import { handleSwitchService } from "./switch-service";
import { isBanned } from "../helpers/banned";

bot.on("callback_query", async (ctx: Context) => {
  const chatId = ctx.update?.callback_query?.message?.chat.id;
  const data = ctx.update?.callback_query?.data;

  if (!chatId || !data) return;
  if (isBanned(chatId)) return;

  await handleManualExpand(ctx);
  await handleExpandedLinkDestruction(ctx);
  await handleUndo(ctx);
  await handleSwitchService(ctx);
  await handleAutoexpandSettings(ctx);
  await handleLockSettings(ctx);
  await handleChangelogSettings(ctx);
  await handlePermissionsSettings(ctx);

  getMemberCount(chatId).catch(() => {
    console.warn(`[Warning] Could not get member count for chat ${chatId}`);
  });
});

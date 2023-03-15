import { Context } from "grammy";
import { bot } from ".";
import { askToExpand } from "./actions/ask-to-expand";
import { saveToCache } from "./helpers/cache";
import { LINK_REGEX } from "./helpers/link-regex";
import { createSettings, getSettings } from "./helpers/api";
import { expandLink } from "./actions/expand-link";
import { deleteMessage } from "./actions/delete-message";
import { isInstagram, isTikTok } from "./helpers/platforms";
import { trackEvent } from "./helpers/analytics";
import { showBotActivity } from "./actions/show-bot-activity";

bot.on("message::url", async (ctx: Context) => {
  if (!ctx.msg) return;
  // User context
  const userInfo = {
    username: ctx.from?.username,
    firstName: ctx.from?.first_name,
    lastName: ctx.from?.last_name,
    userId: ctx.from?.id,
  };
  // Message context
  const chatId = ctx.msg?.chat.id;
  const msgId = ctx.msg?.message_id;
  const isDeletable = !ctx.msg?.caption; // deletable if not a caption of media
  const entities = ctx.entities(); // all links in message
  const message = ctx.msg?.text ?? ctx.msg?.caption ?? ""; // text or caption
  const messageWithNoLinks = entities.reduce((msg, entity) => msg.replace(entity.text, ""), message);

  // Get autoexpand settings for this chat
  const settings = await getSettings(chatId);
  const autoexpand = settings?.autoexpand;

  // Create default settings for this chat if they don’t exist
  if (!settings) {
    await createSettings(chatId, false, true);
  }

  // Loop through all links in message
  entities.forEach(async (entity, index) => {
    const url = entity.text;
    const matchingLink = LINK_REGEX.test(url);

    // Ignore if not a link from supported sites
    if (!matchingLink) return;

    showBotActivity(ctx, chatId);
    const identifier = `${ctx.msg?.chat?.id}:${ctx.msg?.message_id}:${index}`;

    if (autoexpand) {
      // Expand link automatically with provided context
      await expandLink(ctx, url, messageWithNoLinks, userInfo, "auto");
      // Delete message if it’s not a caption
      if (isDeletable) deleteMessage(chatId, msgId, ctx);

      // Track autoexpand event and platform
      const insta = isInstagram(url);
      const tiktok = isTikTok(url);
      const platform = insta ? "instagram" : tiktok ? "tiktok" : "twitter";
      trackEvent(`expand.auto.${platform}`);
    } else {
      // Save message context to cache then ask to expand
      await saveToCache(identifier, ctx);
      await askToExpand(ctx, identifier, url, isDeletable);
    }
  });
});

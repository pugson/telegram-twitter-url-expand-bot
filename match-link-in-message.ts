import { Context } from "grammy";
import { bot } from ".";
import { askToExpand } from "./actions/ask-to-expand";
import { saveToCache } from "./helpers/cache";
import { LINK_REGEX } from "./helpers/link-regex";
import { expandedMessageTemplate } from "./helpers/templates";
import { createSettings, getSettings } from "./helpers/api";
import { expandLink } from "./actions/expand-link";

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
  const entities = ctx.entities();
  const message = ctx.msg?.text ?? ctx.msg?.caption ?? "";
  const messageWithNoLinks = entities.reduce((msg, entity) => msg.replace(entity.text, ""), message);

  // Get autoexpand settings for this chat
  const settings = await getSettings(chatId);
  const autoexpand = settings?.autoexpand;

  // Loop through all links in message
  entities.forEach(async (entity, index) => {
    const url = entity.text;
    const matchingLink = LINK_REGEX.test(url);

    if (!matchingLink) return;

    const identifier = `${ctx.msg?.chat?.id}:${ctx.msg?.message_id}:${index}`;
    await saveToCache(identifier, ctx);

    if (settings) {
      if (autoexpand) {
        expandLink(ctx, chatId, msgId, identifier, url, messageWithNoLinks, isDeletable, userInfo);
      } else {
        askToExpand(chatId, msgId, identifier, url, isDeletable);
      }
    } else {
      // Create default settings for this chat
      createSettings(chatId, false, true);
      askToExpand(chatId, msgId, identifier, url, isDeletable);
    }

    // no undo anymore
    // when user clicks expand, we expand and delete the message
    // no going back

    // ctx.reply(expandedMessageTemplate(username, userId, firstName, lastName, justTextMessage, url));
  });
});

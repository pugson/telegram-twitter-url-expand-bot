import { Context } from "grammy";
import { bot } from ".";
import { askToExpand } from "./actions/ask-to-expand";
import { saveToCache } from "./helpers/cache";
import { LINK_REGEX } from "./helpers/link-regex";
import { expandedMessageTemplate } from "./helpers/templates";

// TODO:
// delete message only if it’s a text message
// do not delete photos, videos, etc.
bot.on("message::url", async (ctx: Context) => {
  if (!ctx.msg) return;
  // User context
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  const lastName = ctx.from?.last_name;
  const userId = ctx.from?.id;
  // Message context
  const chatId = ctx.msg?.chat.id;
  const msgId = ctx.msg?.message_id;
  const isDeletable = !ctx.msg?.caption; // deletable if no caption
  const message = ctx.msg?.text ?? ctx.msg?.caption ?? "";
  const entities = ctx.entities();
  const justTextMessage = entities.reduce((msg, entity) => msg.replace(entity.text, ""), message);

  // Loop through all links in message
  entities.forEach(async (entity) => {
    const url = entity.text;
    const matchingLink = LINK_REGEX.test(url);

    if (!matchingLink) return;

    const identifier = `${ctx.msg?.chat?.id}:${ctx.msg?.message_id}`;
    saveToCache(identifier, ctx);

    // TODO: figure out if we need to ask user to expand
    // or if we autoexpand everything at once right here
    await askToExpand(chatId, msgId, identifier, url);

    // ctx.reply(expandedMessageTemplate(username, userId, firstName, lastName, justTextMessage, url));
  });
});

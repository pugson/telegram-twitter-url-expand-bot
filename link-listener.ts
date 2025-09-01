import { Context } from "grammy";
import { bot } from ".";
import { askToExpand } from "./actions/ask-to-expand";
import { saveToCache } from "./helpers/cache";
import { LINK_REGEX } from "./helpers/link-regex";
import { createSettings, getSettings } from "./helpers/api";
import { expandLink } from "./actions/expand-link";
import { deleteMessage } from "./actions/delete-message";
import {
  isDribbble,
  isHackerNews,
  isInstagram,
  isInstagramShare,
  isPosts,
  isReddit,
  isSpotify,
  isTikTok,
  isThreads,
  isYouTubeShort,
} from "./helpers/platforms";
import { trackEvent } from "./helpers/analytics";
import { showBotActivity } from "./actions/show-bot-activity";
import { isBanned } from "./helpers/banned";

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

  if (isBanned(chatId)) return;

  const msgId = ctx.msg?.message_id;
  const isDeletable = !ctx.msg?.caption; // deletable if not a caption of media
  const entities = ctx.entities(); // all links in message
  const message = ctx.msg?.text ?? ctx.msg?.caption ?? ""; // text or caption

  // Get autoexpand settings for this chat
  const settings = await getSettings(chatId);
  const autoexpand = settings?.autoexpand;

  // Create default settings for this chat if they don’t exist
  if (!settings) {
    await createSettings(chatId, false, true, false);
  }

  // Loop through all links in message
  entities.forEach(async (entity, index) => {
    const url = entity.text;
    const matchingLink = LINK_REGEX.test(url);

    // Ignore if not a link from supported sites
    if (!matchingLink) return;

    const messageWithNoLinks = entities.reduce((msg, e) => {
      if (e.type === "url" && e.text === url) {
        return msg.replace(e.text, "");
      }
      return msg;
    }, message);

    showBotActivity(ctx, chatId);
    const identifier = `${ctx.msg?.chat?.id}:${ctx.msg?.message_id}:${index}`;

    if (autoexpand) {
      // Expand link automatically with provided context
      await expandLink(ctx, url, messageWithNoLinks, userInfo, "auto");
      // Delete message if it’s not a caption
      if (isDeletable) deleteMessage(chatId, msgId, ctx);

      // Track autoexpand event and platform
      const insta = isInstagram(url);
      const instaShare = isInstagramShare(url);
      const tiktok = isTikTok(url);
      const posts = isPosts(url);
      const hn = isHackerNews(url);
      const dribbble = isDribbble(url);
      const reddit = isReddit(url);
      const spotify = isSpotify(url);
      const threads = isThreads(url);
      const youtube = isYouTubeShort(url);
      const platform = insta
        ? "instagram"
        : instaShare
        ? "instagram-share"
        : tiktok
        ? "tiktok"
        : posts
        ? "posts"
        : hn
        ? "hackernews"
        : dribbble
        ? "dribbble"
        : reddit
        ? "reddit"
        : spotify
        ? "spotify"
        : threads
        ? "threads"
        : youtube
        ? "youtube"
        : "twitter";
      trackEvent(`expand.auto.${platform}`);
    } else {
      // Save message context to cache then ask to expand
      await saveToCache(identifier, ctx);
      await askToExpand(ctx, identifier, url, isDeletable);
    }
  });
});

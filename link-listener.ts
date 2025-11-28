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
  isFacebook,
} from "./helpers/platforms";
import { trackEvent } from "./helpers/analytics";
import { showBotActivity } from "./actions/show-bot-activity";
import { isBanned } from "./helpers/banned";

bot.on("message::url", async (ctx: Context) => {
  if (!ctx.msg) return;
  const userInfo = {
    username: ctx.from?.username,
    firstName: ctx.from?.first_name,
    lastName: ctx.from?.last_name,
    userId: ctx.from?.id,
  };

  const chatId = ctx.msg?.chat.id;

  if (isBanned(chatId)) return;

  const msgId = ctx.msg?.message_id;
  const isDeletable = !ctx.msg?.caption; 
  const entities = ctx.entities(); 
  const message = ctx.msg?.text ?? ctx.msg?.caption ?? ""; 

  let settings;
  let autoexpand: boolean;

  try {
    settings = await getSettings(chatId);
    autoexpand = settings?.autoexpand ?? false;

    if (!settings) {
      await createSettings(chatId, false, true, false);
    }
  } catch (error) {
    console.error("Error handling settings:", error);
    autoexpand = false;
  }

  entities.forEach(async (entity, index) => {
    const url = entity.text;
    const matchingLink = LINK_REGEX.test(url);

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
      await expandLink(ctx, url, messageWithNoLinks, userInfo, "auto");
      if (isDeletable) deleteMessage(chatId, msgId, ctx);

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
      const fb = isFacebook(url);
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
        : fb
        ? "facebook"
        : "twitter";
      trackEvent(`expand.auto.${platform}`);
    } else {
      await saveToCache(identifier, ctx);
      await askToExpand(ctx, identifier, url, isDeletable);
    }
  });
});

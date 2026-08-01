import { Context } from "grammy";
import { bot } from ".";
import { LINK_REGEX } from "./helpers/link-regex";
import { getPlatformKey, TogglePlatformKey } from "./helpers/platforms";
import { getSettings } from "./helpers/api";
import { trackEvent } from "./helpers/analytics";
import { isBanned } from "./helpers/banned";
import { logger } from "./helpers/logger";

// Domain replacements per platform, applied in order.
// The tiktok.com replacement must come after the vt./lite. subdomains.
const DOMAIN_REPLACEMENTS: { platform: TogglePlatformKey; from: string; to: string }[] = [
  { platform: "twitter", from: "twitter.com/", to: "fxtwitter.com/" },
  { platform: "twitter", from: "x.com/", to: "fxtwitter.com/" },
  // The www. entry must come first: a bare instagram.com/ swap would leave
  // www.adobe.lol, which is a separate host from the apex.
  { platform: "instagram", from: "www.instagram.com/", to: "adobe.lol/" },
  { platform: "instagram", from: "instagram.com/", to: "adobe.lol/" },
  { platform: "tiktok", from: "vt.tiktok.com/", to: "vm.tfxktok.com/" },
  { platform: "tiktok", from: "lite.tiktok.com/", to: "tiktokez.com/" },
  { platform: "tiktok", from: "tiktok.com/", to: "tfxktok.com/" },
  { platform: "dribbble", from: "dribbble.com/", to: "dribbbletv.com/" },
  { platform: "reddit", from: "reddit.com/", to: "rxddit.com/" },
  { platform: "threads", from: "threads.com/", to: "threadsez.com/" },
  { platform: "threads", from: "threads.net/", to: "threadsez.com/" },
  { platform: "youtube", from: "youtube.com/shorts/", to: "koutube.com/shorts/" },
  { platform: "facebook", from: "facebook.com/", to: "facebed.com/" },
];

bot.on("channel_post::url", async (ctx: Context) => {
  const post = ctx.update.channel_post;
  const caption = post?.caption;
  const message = post?.text ?? caption ?? "";
  const chatId = ctx.chat?.id;

  if (chatId && isBanned(chatId)) return;
  if (!LINK_REGEX.test(message)) return;

  // Skip platforms disabled with /platforms in this channel
  let disabledPlatforms: string[] = [];
  if (chatId) {
    try {
      const settings = await getSettings(chatId);
      disabledPlatforms = settings?.disabled_platforms ?? [];
    } catch (error) {
      logger.error("Error getting channel settings: {error}", { error });
      // Don't rewrite anything when we can't tell which platforms
      // are disabled for this channel.
      return;
    }
  }

  const platform = getPlatformKey(message);
  const expandedLinksMessage = DOMAIN_REPLACEMENTS.reduce((msg, replacement) => {
    if (disabledPlatforms.includes(replacement.platform)) return msg;
    return msg.replace(replacement.from, replacement.to);
  }, message);

  // Nothing was replaced (e.g. all matched platforms are disabled),
  // so don't edit the message.
  if (expandedLinksMessage === message) return;

  try {
    if (caption) {
      await ctx
        .editMessageCaption({
          caption: expandedLinksMessage,
        })
        .catch(() => {
          logger.error("Channel caption cannot be edited");
          return;
        });
      trackEvent(`edit.channel.caption`);
    } else {
      await ctx.editMessageText(expandedLinksMessage).catch(() => {
        logger.error("Channel message text cannot be edited");
        return;
      });
      trackEvent(`edit.channel.message`);
    }

    trackEvent(`expand.channel.${platform}`);
  } catch (error) {
    logger.error("Channel message cannot be edited: {error}", { error });
    return;
  }
});

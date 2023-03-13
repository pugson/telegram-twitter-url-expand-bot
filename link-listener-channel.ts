import { Context } from "grammy";
import { bot } from ".";
import { LINK_REGEX } from "./helpers/link-regex";
import { isInstagram, isTikTok } from "./helpers/platforms";
import { trackEvent } from "./helpers/analytics";

bot.on("channel_post::url", async (ctx: Context) => {
  const post = ctx.update.channel_post;
  const caption = post?.caption;
  const message = post?.text ?? caption ?? "";

  if (!LINK_REGEX.test(message)) return;

  const platform = isInstagram(message) ? "instagram" : isTikTok(message) ? "tiktok" : "twitter";
  const expandedLinksMessage = message
    .replace("twitter.com/", "vxtwitter.com/")
    .replace("instagram.com/", "ddinstagram.com/")
    .replace("tiktok.com/", "vxtiktok.com/");

  try {
    if (caption) {
      await ctx.editMessageCaption({
        caption: expandedLinksMessage,
      });
      trackEvent(`edit.channel.caption`);
    } else {
      await ctx.editMessageText(expandedLinksMessage);
      trackEvent(`edit.channel.message`);
    }

    trackEvent(`expand.channel.${platform}`);
  } catch (error) {
    console.log(error);
  }
});

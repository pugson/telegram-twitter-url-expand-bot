import { Context } from "grammy";
import { bot } from ".";
import { LINK_REGEX } from "./helpers/link-regex";
import { isInstagram, isPosts, isTikTok } from "./helpers/platforms";
import { trackEvent } from "./helpers/analytics";

bot.on("channel_post::url", async (ctx: Context) => {
  const post = ctx.update.channel_post;
  const caption = post?.caption;
  const message = post?.text ?? caption ?? "";

  if (!LINK_REGEX.test(message)) return;

  const platform = isInstagram(message)
    ? "instagram"
    : isTikTok(message)
    ? "tiktok"
    : isPosts(message)
    ? "posts"
    : "twitter";
  const expandedLinksMessage = message
    .replace("twitter.com/", "fxtwitter.com/")
    .replace("instagram.com/", "ddinstagram.com/")
    .replace("tiktok.com/", "vxtiktok.com/")
    .replace("posts.cv/", "postscv.com/");

  try {
    if (caption) {
      await ctx
        .editMessageCaption({
          caption: expandedLinksMessage,
        })
        .catch(() => {
          console.error("[Error1] Channel message cannot be edited.");
          return;
        });
      trackEvent(`edit.channel.caption`);
    } else {
      await ctx.editMessageText(expandedLinksMessage).catch(() => {
        console.error("[Error2] Channel message cannot be edited.");
        return;
      });
      trackEvent(`edit.channel.message`);
    }

    trackEvent(`expand.channel.${platform}`);
  } catch (error) {
    console.error("[Error] Channel message cannot be edited.");
    return;
  }
});

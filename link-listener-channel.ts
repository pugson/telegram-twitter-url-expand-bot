import { Context } from "grammy";
import { bot } from ".";
import { LINK_REGEX } from "./helpers/link-regex";
import { isDribbble, isInstagram, isPosts, isReddit, isTikTok } from "./helpers/platforms";
import { trackEvent } from "./helpers/analytics";
import { isBanned } from "./helpers/banned";

bot.on("channel_post::url", async (ctx: Context) => {
  const post = ctx.update.channel_post;
  const caption = post?.caption;
  const message = post?.text ?? caption ?? "";

  if (ctx && ctx.chat && isBanned(ctx.chat?.id)) return;
  if (!LINK_REGEX.test(message)) return;

  const platform = isInstagram(message)
    ? "instagram"
    : isTikTok(message)
    ? "tiktok"
    : isPosts(message)
    ? "posts"
    : isDribbble(message)
    ? "dribbble"
    : isReddit(message)
    ? "reddit"
    : "twitter";
  const expandedLinksMessage = message
    .replace("twitter.com/", "fxtwitter.com/")
    .replace("x.com/", "fxtwitter.com/")
    .replace("instagram.com/", "instagramez.com/")
    .replace("vt.tiktok.com/", "vm.tfxktok.com/")
    .replace("lite.tiktok.com/", "tfxktok.com/")
    .replace("tiktok.com/", "tfxktok.com/")
    .replace("posts.cv/", "postscv.com/")
    .replace("dribbble.com/", "dribbbletv.com/")
    .replace("reddit.com/", "rxddit.com/");

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

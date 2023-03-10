import { Context } from "grammy";
import { expandedMessageTemplate } from "../helpers/templates";
import { isInstagram, isTikTok, isTweet } from "../helpers/platforms";
import { fetchTweet } from "../helpers/tweet-parser";
import { trackEvent } from "../helpers/analytics";

type UserInfoType = {
  username: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  userId: number | undefined;
};

/**
 *
 * @param ctx Telegram Context
 * @param link Link to expand
 * @param messageText Text of the message without URLs
 * @param userInfo Object with user details for creating the message template
 */
export async function expandLink(ctx: Context, link: string, messageText: string, userInfo: UserInfoType) {
  if (!ctx) return;
  let expandedLink: string = "";

  if (isInstagram(link)) {
    expandedLink = link.replace("instagram.com", "ddinstagram.com");
  }

  if (isTikTok(link)) {
    expandedLink = link.replace("tiktok.com", "vxtiktok.com");
  }

  if (isTweet(link)) {
    const hasImages = await fetchTweet(link);

    if (hasImages) {
      expandedLink = link.replace("twitter.com", "c.vxtwitter.com");
      trackEvent("expand.platform.twitter.multipleImages");
    } else {
      expandedLink = link.replace("twitter.com", "vxtwitter.com");
    }
  }

  await ctx.reply(
    expandedMessageTemplate(
      userInfo.username,
      userInfo.userId,
      userInfo.firstName,
      userInfo.lastName,
      messageText,
      expandedLink
    ),
    {
      // Use HTML parse mode if the user does not have a username,
      // otherwise the bot will not be able to mention the user.
      parse_mode: userInfo.username ? undefined : "HTML",
    }
  );
}

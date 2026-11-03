import { Context } from "grammy";
import { expandedMessageTemplate } from "../helpers/templates";
import {
  isInstagram,
  isReddit,
  isTikTok,
  isTweet,
  isDribbble,
  isBluesky,
  isInstagramShare,
  isThreads,
  isYouTubeShort,
  isFacebook,
  FACEBOOK_DOMAINS,
  INSTAGRAM_DOMAINS,
  TIKTOK_DOMAINS,
  TWITTER_DOMAINS,
  rewriteInstagramDomain,
} from "../helpers/platforms";
import { trackEvent } from "../helpers/analytics";
import { isRecentlyExpanded, markExpanded } from "../helpers/cache";
import { getButtonState } from "../helpers/button-states";
import { resolveInstagramShare } from "../helpers/instagram-share";
import { logger } from "../helpers/logger";

type UserInfoType = {
  username: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  userId: number | undefined;
};

/**
 * Handle expanding the link based on the platform.
 * @param link URL to expand
 * @returns Expanded URL with the right domain
 */
function handleExpandedLinkDomain(link: string): string {
  // If multiple URLs are accidentally concatenated, take only the first one
  const match = link.match(/https?:\/\/.*?(?=https?:\/\/|\s|$)/);
  if (match) {
    link = match[0];
  }

  switch (true) {
    case isInstagram(link):
      if (INSTAGRAM_DOMAINS.some((domain) => link.includes(domain))) return link;
      return rewriteInstagramDomain(link);
    case isTikTok(link):
      const tiktokDomain = TIKTOK_DOMAINS[0];
      return link
        .replace("vt.tiktok.com", "vm." + tiktokDomain)
        .replace("lite.tiktok.com", tiktokDomain)
        .replace("tiktok.com", tiktokDomain);
    case isTweet(link):
      if (link.includes("fxtwitter.com") || TWITTER_DOMAINS.some((domain) => link.includes(domain))) return link;
      // Fix: Check specific domain presence to prevent double replacement (e.g. fixupfixupx.com)
      if (link.includes("x.com")) {
        return link.replace("x.com", TWITTER_DOMAINS[0]);
      }
      return link.replace("twitter.com", TWITTER_DOMAINS[0]);
    case isDribbble(link):
      return link.replace("dribbble.com", "dribbbletv.com");
    case isBluesky(link):
      return link.replace("bsky.app", "fxbsky.app");
    case isReddit(link):
      return link.replace("reddit.com", "rxddit.com");
    case isThreads(link):
      return link.replace("threads.com", "threadsez.com").replace("threads.net", "threadsez.com");
    case isYouTubeShort(link):
      return link.replace("youtube.com/shorts/", "koutube.com/shorts/");
    case isFacebook(link):
      if (FACEBOOK_DOMAINS.some((domain) => link.includes(domain))) return link;
      return link.replace("facebook.com", FACEBOOK_DOMAINS[0]);
    default:
      return link;
  }
}

/**
 * Reply with the expanded link.
 * @returns Whether the reply was sent. Callers only delete messages
 * after a successful reply, so nothing is lost when expanding fails.
 */
export async function expandLink(
  ctx: Context,
  link: string,
  messageText: string,
  userInfo: UserInfoType,
  expansionType: "auto" | "manual",
  replyId?: number
): Promise<boolean> {
  if (!ctx || !ctx.chat?.id) return false;
  // Return correct link based on platform
  const expandedLink = handleExpandedLinkDomain(link);
  let linkWithNoTrackers = expandedLink;

  if (isTweet(link) || isInstagram(link) || isTikTok(link) || isThreads(link) || isYouTubeShort(link)) {
    // Strip trackers from these platforms but not others.
    // For these platforms, we can safely strip everything after '?'
    linkWithNoTrackers = expandedLink.split("?")[0];
  } else if (isFacebook(link)) {
    // For Facebook, we must preserve specific parameters used for routing (v, fbid, etc.)
    // while stripping tracking parameters (fbclid, __cft__, etc.)
    try {
      const url = new URL(linkWithNoTrackers);
      const params = url.searchParams;
      const newParams = new URLSearchParams();
      const allowedParams = ["id", "story_fbid", "v", "fbid", "multi_permalinks"];

      allowedParams.forEach((key) => {
        const value = params.get(key);
        if (value) newParams.set(key, value);
      });

      // Update the URL with only the allowed parameters
      url.search = newParams.toString();
      linkWithNoTrackers = url.toString();
    } catch (e) {
      logger.error("Could not clean Facebook parameters: {error}", { error: e });
      // If parsing fails, we keep the original expanded link to avoid breaking it,
      // even if it has trackers.
    }
  }

  try {
    const chatId = ctx.chat?.id;
    const topicId = ctx.msg?.message_thread_id;
    const replyTo = replyId || ctx.update?.message?.reply_to_message?.message_id;
    // Very complicated bullshit to handle replying to a message inside a thread
    // and replying to a message outside a thread, because the way these topics are set up is annoying.
    const sameId = replyTo === topicId;
    const threadOptions = replyId ? { message_thread_id: topicId } : null;
    const threadId = sameId ? null : threadOptions;
    const replyOptions = {
      reply_to_message_id: replyTo,
      ...threadId,
    };

    // Handle Instagram share links
    if (link.includes("instagram.com/share/")) {
      try {
        const resolvedUrl = await resolveInstagramShare(link);
        if (resolvedUrl) {
          // Replace the share URL with the resolved URL and convert
          link = rewriteInstagramDomain(resolvedUrl);
          linkWithNoTrackers = link; // Update the link used in the template
        }
      } catch (error) {
        logger.error("Failed to resolve Instagram share link: {error}", { error });
      }
    } else if (isInstagram(link)) {
      // Handle regular Instagram links (replace domain)
      link = rewriteInstagramDomain(link);
    }

    let platform: any = null;
    let originalLink = link; // Keep track of original link for button
    if (isInstagram(link)) {
      platform = "instagram";
      // Keep original Instagram link for button, but modify for message
      originalLink = link;
      for (const domain of INSTAGRAM_DOMAINS) {
        originalLink = originalLink.replace(domain, "instagram.com");
      }
    } else if (isTikTok(link)) platform = "tiktok";
    else if (isTweet(link)) platform = "twitter";
    else if (isInstagramShare(link)) platform = "instagram-share";
    else if (isReddit(link)) platform = "reddit";
    else if (isYouTubeShort(link)) platform = "youtube";
    else if (isFacebook(link)) platform = "facebook";
    else if (isThreads(link)) {
      platform = "threads";
      // Keep original Threads link for button, but modify for message
      originalLink = link.replace(/threadsez\.com/g, "threads.com");
    }

    const authorId = userInfo.userId || ctx.from?.id || 0;
    const replyMarkup = platform
      ? { inline_keyboard: getButtonState(platform, 15, authorId, originalLink).buttons }
      : undefined;

    const botReply = await ctx.api.sendMessage(
      chatId,
      await expandedMessageTemplate(
        ctx,
        userInfo.username,
        userInfo.userId,
        userInfo.firstName,
        userInfo.lastName,
        messageText,
        linkWithNoTrackers
      ),
      {
        parse_mode: "HTML",
        ...replyOptions,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }
    );

    // For supported platforms, count down the Delete button, remove Undo
    // after 35 seconds and leave only the Open button after 60 seconds
    if (platform) {
      const replyKey = `${chatId}:${botReply.message_id}`;
      markExpanded(replyKey);
      const timeouts: NodeJS.Timeout[] = [];
      const showButtons = (timeRemaining: number | null, showUndo = true) => {
        // After Undo the countdown goes on without Undo and "Embed not working?"
        const active = isRecentlyExpanded(replyKey);
        const state = getButtonState(platform, timeRemaining, authorId, originalLink, showUndo && active, active);
        return ctx.api
          .editMessageReplyMarkup(chatId, botReply.message_id, { reply_markup: { inline_keyboard: state.buttons } })
          .then(() => state.nextTimeout);
      };

      const countDown = async (timeRemaining: number) => {
        try {
          const nextTimeout = await showButtons(timeRemaining);
          if (nextTimeout !== null) timeouts.push(setTimeout(() => countDown(nextTimeout), 5000));
        } catch (error) {
          if (error instanceof Error && error.message.includes("message to edit not found")) {
            logger.warn("Message has probably been already deleted");
            // Clear all timeouts since we can't update this message anymore
            timeouts.forEach((t) => clearTimeout(t));
          } else {
            logger.error("Failed to update buttons: {error}", { error });
          }
        }
      };

      timeouts.push(
        setTimeout(() => countDown(10), 5000),
        setTimeout(() => showButtons(0, false).catch(() => {}), 35000),
        setTimeout(() => showButtons(null).catch(() => {}), 60000)
      );
    }

    if (topicId) {
      trackEvent(`expand.${expansionType}.inside-topic`);
    }

    return true;
  } catch (error) {
    logger.error("Could not reply with an expanded link: {error}", { error });
    return false;
  }
}

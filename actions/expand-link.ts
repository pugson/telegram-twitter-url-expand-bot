import { Api, Context } from "grammy";
import { expandedMessageTemplate } from "../helpers/templates";
import { isInstagram, isTikTok, isTweet } from "../helpers/platforms";
import { trackEvent } from "../helpers/analytics";
import { Message } from "grammy/types";

type UserInfoType = {
  username?: string;
  firstName?: string;
  lastName?: string;
  userId?: number;
};

/**
 * Handle expanding the link based on the platform.
 * @param link URL to expand
 * @returns Expanded URL with the right domain
 */
function expandLinkPlatform(link: string): string {
  switch (true) {
    case isInstagram(link):
      return link.replace("instagram.com", "ddinstagram.com");
    case isTikTok(link):
      return link.replace("tiktok.com", "vxtiktok.com");
    case isTweet(link):
      return link.replace("twitter.com", "fxtwitter.com");
    default:
      return link;
  }
}

/**
 * Handles the thread for topics and replies in chat.
 * @param ctx Telegram Context
 * @param replyId
 * @returns Reply ID or Thread ID
 */
function getThreadId(ctx: Context, replyId?: number) {
  const topicId = ctx?.msg?.message_thread_id;
  const replyTo = replyId || ctx?.update?.message?.reply_to_message?.message_id;
  const sameId = replyTo === topicId;
  const threadOptions = replyId ? { message_thread_id: topicId } : null;
  return sameId ? null : threadOptions;
}

/**
 * Get the message template with the expanded link.
 * @param ctx Telegram Context
 * @param userInfo User that sent or forwarded the message
 * @param messageText Message text without links
 * @param expandedLink URL
 * @returns Message template with the expanded link
 */
function getExpandedMessageTemplate(ctx: Context, userInfo: UserInfoType, messageText: string, expandedLink: string) {
  const { username, userId, firstName, lastName } = userInfo;
  return expandedMessageTemplate(ctx, username, userId, firstName, lastName, messageText, expandedLink);
}

/**
 * Handles the countdown for the destruct button.
 * @param api Telegram Bot API
 * @param botReply Message Context that was sent by the bot with the expanded link
 * @param userInfo Object with user details of the person that sent or forwareded the message
 * @param expansionType Can be "auto" or "manual"
 */
function startDestructTimer(api: Api, botReply: Message, userInfo: UserInfoType, expansionType: "auto" | "manual") {
  // Template for editing the destruct button timer
  async function editDestructTimer(time: number) {
    try {
      await api.editMessageReplyMarkup(botReply.chat.id, botReply.message_id, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `❌ Delete — ${time}s`,
                callback_data: `destruct:${userInfo.userId}:${expansionType}`,
              },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("[Error] Could not edit destruct timer.", error);
    }
  }

  setTimeout(() => editDestructTimer(10), 5000); // change to 10s after 5s
  setTimeout(() => editDestructTimer(5), 10000); // change to 5s after 10s
  setTimeout(
    () => api.editMessageReplyMarkup(botReply.chat.id, botReply.message_id, { reply_markup: undefined }),
    15000
  ); // remove button after 15s
}

/**
 * Handle expanding the link and sending the message in the chat.
 * @param ctx Telegram Context
 * @param link URL to expand
 * @param messageText Message text without links
 * @param userInfo User that sent or forwarded the message
 * @param expansionType
 * @param replyId
 */
export async function expandLink(
  ctx: Context,
  link: string,
  messageText: string,
  userInfo: UserInfoType,
  expansionType: "auto" | "manual",
  replyId?: number
) {
  const chatId = ctx?.chat?.id;
  if (!chatId) return;

  // Return correct link based on platform
  let expandedLink = expandLinkPlatform(link);

  try {
    const replyTo = replyId || ctx?.update?.message?.reply_to_message?.message_id;
    const threadId = getThreadId(ctx, replyId);

    // Send the message with the expanded link
    const botReply = await ctx.api.sendMessage(
      chatId,
      getExpandedMessageTemplate(ctx, userInfo, messageText, expandedLink),
      {
        reply_to_message_id: replyTo,
        ...threadId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "❌ Delete — 15s",
                callback_data: `destruct:${userInfo.userId}:${expansionType}`,
              },
            ],
          ],
        },
      }
    );

    // Track if the message was sent inside a topic
    if (ctx?.msg?.message_thread_id) {
      trackEvent(`expand.${expansionType}.inside-topic`);
    }

    // Start the timer for allowing the author to delete the message with a button
    startDestructTimer(ctx.api, botReply, userInfo, expansionType);
  } catch (error) {
    console.error("[Error: expand-link.ts] Could not reply with an expanded link.", error);
  }
}

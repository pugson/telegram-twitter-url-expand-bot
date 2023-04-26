import { Context } from "grammy";
import { expandedMessageTemplate } from "../helpers/templates";
import { isInstagram, isTikTok, isTweet } from "../helpers/platforms";
import { trackEvent } from "../helpers/analytics";

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
 * Handles link expansion and sending the message with the correct template and destruct button.
 * @param ctx Telegram Context
 * @param link Link to expand
 * @param messageText Text of the message without URLs
 * @param userInfo Object with user details for creating the message template
 */
export async function expandLink(
  ctx: Context,
  link: string,
  messageText: string,
  userInfo: UserInfoType,
  expansionType: "auto" | "manual",
  replyId?: number
) {
  if (!ctx || !ctx.chat?.id) return;
  // Return correct link based on platform
  const expandedLink = handleExpandedLinkDomain(link);

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

    const botReply = await ctx.api.sendMessage(
      chatId,
      expandedMessageTemplate(
        ctx,
        userInfo.username,
        userInfo.userId,
        userInfo.firstName,
        userInfo.lastName,
        messageText,
        expandedLink
      ),
      {
        ...replyOptions,
        // Use HTML parse mode if the user does not have a username,
        // otherwise the bot will not be able to mention the user.
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

    if (topicId) {
      trackEvent(`expand.${expansionType}.inside-topic`);
    }

    // Countdown the destruct timer under message
    if (botReply) {
      async function editDestructTimer(time: number) {
        try {
          await ctx.api
            .editMessageReplyMarkup(botReply.chat.id, botReply.message_id, {
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
            })
            .catch(() => {
              console.error(
                "[Error] [expand-link.ts:113] Could not edit destruct timer. Message was probably deleted."
              );
              return;
            });
        } catch (error) {
          // console.error("[Error] Could not edit destruct timer. Message was probably deleted.");
          // @ts-ignore
          // console.error(error.message);
          return;
        }
      }

      // edit timer to 10s
      setTimeout(async () => {
        editDestructTimer(10);
      }, 5000);

      // edit timer to 5s
      setTimeout(async () => {
        editDestructTimer(5);
      }, 10000);

      // clear buttons after 15s
      setTimeout(async () => {
        try {
          await ctx.api
            .editMessageReplyMarkup(botReply.chat.id, botReply.message_id, {
              reply_markup: undefined,
            })
            .catch(() => {
              console.error(
                "[Error] [expand-link.ts:144] Could not clear destruct timer. Message was probably deleted."
              );
            });
        } catch (error) {
          // console.error("[Error] Could not clear destruct timer. Message was probably deleted.");
          return;
        }
      }, 15000);
    }
  } catch (error) {
    console.error("[Error: expand-link.ts] Could not reply with an expanded link.");
    // @ts-ignore
    // console.error(error);
    return;
  }
}

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
 *
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
  let expandedLink: string = "";

  if (isInstagram(link)) {
    expandedLink = link.replace("instagram.com", "ddinstagram.com");
  }

  if (isTikTok(link)) {
    expandedLink = link.replace("tiktok.com", "vxtiktok.com");
  }

  if (isTweet(link)) {
    expandedLink = link.replace("twitter.com", "fxtwitter.com");
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
          await ctx.api.editMessageReplyMarkup(botReply.chat.id, botReply.message_id, {
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
          console.error("[Error] Could not edit destruct timer. Message was probably deleted.");
          // @ts-ignore
          // console.error(error.message);
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
          await ctx.api.editMessageReplyMarkup(botReply.chat.id, botReply.message_id, {
            reply_markup: undefined,
          });
        } catch (error) {
          // do nothing
          console.error("[Error] Could not clear destruct timer. Message was probably deleted.");
        }
      }, 15000);
    }
  } catch (error) {
    // @ts-ignore
    console.error("[Error: expand-link.ts] Could not reply with an expanded link.");
    // @ts-ignore
    // console.error(error);
  }
}

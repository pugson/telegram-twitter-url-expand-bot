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
export async function expandLink(
  ctx: Context,
  link: string,
  messageText: string,
  userInfo: UserInfoType,
  expansionType: "auto" | "manual"
) {
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

      const isManuallyExpanded = expansionType === "manual";
      trackEvent(`expand.${isManuallyExpanded ? "yes" : "auto"}.twitter.multipleImages`);
    } else {
      expandedLink = link.replace("twitter.com", "vxtwitter.com");
    }
  }

  try {
    const topicId = ctx.msg?.message_thread_id;
    const botReply = await ctx.reply(
      expandedMessageTemplate(
        userInfo.username,
        userInfo.userId,
        userInfo.firstName,
        userInfo.lastName,
        messageText,
        expandedLink
      ),
      {
        message_thread_id: topicId ?? undefined,
        // Use HTML parse mode if the user does not have a username,
        // otherwise the bot will not be able to mention the user.
        parse_mode: userInfo.username ? undefined : "HTML",
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
          // console.error("[Error] Could not edit destruct timer.");
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
        }
      }, 15000);
    }
  } catch (error) {
    console.error("[Error] Could not reply with an expanded link.");
    // @ts-ignore
    console.error(error.message);
  }
}

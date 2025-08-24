import { Context, InputFile } from "grammy";
import { expandedMessageTemplate } from "../helpers/templates";
import {
  isInstagram,
  isPosts,
  isReddit,
  isTikTok,
  isTweet,
  isDribbble,
  isBluesky,
  isSpotify,
  isInstagramShare,
  isThreads,
} from "../helpers/platforms";
import { trackEvent } from "../helpers/analytics";
import { notifyAdmin } from "../helpers/notifier";
import { getOGMetadata } from "../helpers/og-metadata";
import { saveToCache, deleteFromCache } from "../helpers/cache";
import { getButtonState } from "../helpers/button-states";
import { resolveInstagramShare } from "../helpers/instagram-share";

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
  if (link.includes("http", 1)) {
    link = link.split("http")[0];
  }

  switch (true) {
    case isInstagram(link):
      if (link.includes("instagramez.com")) return link;
      return link.replace("instagram.com", "instagramez.com");
    case isTikTok(link):
      return link
        .replace("vt.tiktok.com", "vm.tiktokez.com")
        .replace("lite.tiktok.com", "tiktokez.com")
        .replace("tiktok.com", "tiktokez.com");
    case isPosts(link):
      return link.replace("posts.cv", "postscv.com");
    case isTweet(link):
      if (link.includes("fxtwitter.com")) return link;
      return link.replace("twitter.com", "fxtwitter.com").replace("x.com", "fxtwitter.com");
    case isDribbble(link):
      return link.replace("dribbble.com", "dribbbletv.com");
    case isBluesky(link):
      return link.replace("bsky.app", "fxbsky.app");
    case isReddit(link):
      return link.replace("reddit.com", "rxddit.com");
    case isThreads(link):
      return link.replace("threads.com", "threadsez.com").replace("threads.net", "threadsez.com");
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
  let linkWithNoTrackers = expandedLink;
  // Strip trackers from these platforms but not others.
  if (isTweet(link) || isInstagram(link) || isTikTok(link) || isSpotify(link) || isThreads(link)) {
    linkWithNoTrackers = expandedLink.split("?")[0];
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

    let botReply: any;

    if (isSpotify(link)) {
      try {
        const metadata = await getOGMetadata(link ?? "");
        const { title, description, image, audio } = metadata;

        // Limit description to 500 chars because Telegram rejects messages with more than 4096 characters.
        // 4096 seems a bit excessive to see in the chat so we'll just cut it off at 500.
        const maxCaptionLength = 500;

        // Calculate template length first
        const template = await expandedMessageTemplate(
          ctx,
          userInfo.username,
          userInfo.userId,
          userInfo.firstName,
          userInfo.lastName,
          messageText,
          linkWithNoTrackers
        );

        // Calculate remaining space for title and description (using 500 to be safe)
        const remainingSpace = Math.max(0, maxCaptionLength - template.length - 4); // 4 chars for "\n\n"
        const titleMaxLength = Math.min(50, Math.floor(remainingSpace * 0.3)); // Max 50 chars for title
        const descMaxLength = Math.floor(remainingSpace * 0.7); // Rest for description

        const truncatedTitle = title.length > titleMaxLength ? title.slice(0, titleMaxLength) + "..." : title;
        const truncatedDesc =
          description.length > descMaxLength ? description.slice(0, descMaxLength) + "..." : description;

        botReply = await ctx.api.sendPhoto(chatId, new InputFile(new URL(`https://wsrv.nl/?url=${image}&w=600`)), {
          ...replyOptions,
          caption: template + `\n\n<b>${truncatedTitle}</b>\n${truncatedDesc}`,
          parse_mode: "HTML",
        });

        if (audio) {
          // Also limit the audio caption
          const audioDesc = description.length > 250 ? description.slice(0, 250) + "..." : description;
          await ctx.api.sendAudio(chatId, new InputFile(new URL(audio)), {
            ...replyOptions,
            title: truncatedTitle,
            caption: audioDesc,
            thumbnail: new InputFile(new URL(`https://wsrv.nl/?url=${image}&w=200&h=200`)),
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "❌ Delete",
                    callback_data: `destruct:${userInfo.userId}:${expansionType}`,
                  },
                ],
              ],
            },
          });
        }
      } catch (error) {
        console.error(error);
        notifyAdmin(error);

        botReply = await ctx.api.sendMessage(
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
      }
    } else {
      // Handle Instagram share links
      if (link.includes("instagram.com/share/")) {
        try {
          const resolvedUrl = await resolveInstagramShare(link);
          if (resolvedUrl) {
            // Replace the share URL with the resolved URL and convert to instagramez.com
            const finalUrl = resolvedUrl.replace(/instagram\.com/g, "instagramez.com");
            linkWithNoTrackers = finalUrl; // Update the link used in the template
            link = finalUrl;
            let platform: "twitter" | "instagram" | "tiktok" | "instagram-share" | null = null;
            platform = "instagram-share"; // Track as Instagram share
          }
        } catch (error) {
          console.error("[Error] Failed to resolve Instagram share link:", error);
        }
      }
      // Handle regular Instagram links (replace domain with instagramez.com)
      else if (isInstagram(link)) {
        link = link.replace(/instagram\.com/g, "instagramez.com");
      }

      // Handle Spotify links
      if (link.includes("open.spotify.com")) {
        try {
          const metadata = await getOGMetadata(link ?? "");
          const { title, description, image, audio } = metadata;

          // Limit description to 500 chars because Telegram rejects messages with more than 4096 characters.
          // 4096 seems a bit excessive to see in the chat so we'll just cut it off at 500.
          const maxCaptionLength = 500;

          // Calculate template length first
          const template = await expandedMessageTemplate(
            ctx,
            userInfo.username,
            userInfo.userId,
            userInfo.firstName,
            userInfo.lastName,
            messageText,
            linkWithNoTrackers
          );

          // Calculate remaining space for title and description (using 500 to be safe)
          const remainingSpace = Math.max(0, maxCaptionLength - template.length - 4); // 4 chars for "\n\n"
          const titleMaxLength = Math.min(50, Math.floor(remainingSpace * 0.3)); // Max 50 chars for title
          const descMaxLength = Math.floor(remainingSpace * 0.7); // Rest for description

          const truncatedTitle = title.length > titleMaxLength ? title.slice(0, titleMaxLength) + "..." : title;
          const truncatedDesc =
            description.length > descMaxLength ? description.slice(0, descMaxLength) + "..." : description;

          botReply = await ctx.api.sendPhoto(chatId, new InputFile(new URL(`https://wsrv.nl/?url=${image}&w=600`)), {
            ...replyOptions,
            caption: template + `\n\n<b>${truncatedTitle}</b>\n${truncatedDesc}`,
            parse_mode: "HTML",
          });

          if (audio) {
            // Also limit the audio caption
            const audioDesc = description.length > 250 ? description.slice(0, 250) + "..." : description;
            await ctx.api.sendAudio(chatId, new InputFile(new URL(audio)), {
              ...replyOptions,
              title: truncatedTitle,
              caption: audioDesc,
              thumbnail: new InputFile(new URL(`https://wsrv.nl/?url=${image}&w=200&h=200`)),
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "❌ Delete",
                      callback_data: `destruct:${userInfo.userId}:${expansionType}`,
                    },
                  ],
                ],
              },
            });
          }
        } catch (error) {
          console.error(error);
          notifyAdmin(error);

          botReply = await ctx.api.sendMessage(
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
        }
      } else {
        // For all other platforms
        let platform: any = null;
        let originalLink = link; // Keep track of original link for button
        if (isInstagram(link)) {
          platform = "instagram";
          // Keep original Instagram link for button, but modify for message
          originalLink = link.replace(/instagramez\.com/g, "instagram.com");
        } else if (isTikTok(link)) platform = "tiktok";
        else if (isTweet(link)) platform = "twitter";
        else if (isInstagramShare(link)) platform = "instagram-share";
        else if (isReddit(link)) platform = "reddit";
        else if (isThreads(link)) {
          platform = "threads";
          // Keep original Threads link for button, but modify for message
          originalLink = link.replace(/threadsez\.com/g, "threads.com");
        }

        const replyMarkup = platform
          ? {
              inline_keyboard: getButtonState(platform, 15, userInfo.userId || ctx.from?.id || 0, originalLink).buttons,
            }
          : undefined;

        try {
          botReply = await ctx.api.sendMessage(
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

          // For supported platforms, start the button progression
          if (platform && botReply) {
            const identifier = `${chatId}:${botReply.message_id}`;
            await saveToCache(identifier, ctx);

            // Keep track of timeouts so we can clear them if needed
            const timeouts: NodeJS.Timeout[] = [];

            // Start the button progression
            const updateButtons = async (timeRemaining: number) => {
              try {
                const state = getButtonState(
                  platform!,
                  timeRemaining,
                  userInfo.userId || ctx.from?.id || 0,
                  originalLink
                );
                await ctx.api.editMessageReplyMarkup(chatId, botReply!.message_id, {
                  reply_markup: { inline_keyboard: state.buttons },
                });

                // Schedule next update if there is one
                if (state.nextTimeout !== null) {
                  const timeout = setTimeout(() => {
                    try {
                      updateButtons(state.nextTimeout!).catch(() => {
                        // Clear all timeouts if we can't update buttons
                        timeouts.forEach((t) => clearTimeout(t));
                      });
                    } catch (error) {
                      // Clear all timeouts if we can't update buttons
                      timeouts.forEach((t) => clearTimeout(t));
                    }
                  }, 5000);
                  timeouts.push(timeout);
                }
              } catch (error) {
                // Message not found errors are expected if message was deleted
                if (error instanceof Error && error.message.includes("message to edit not found")) {
                  console.warn("[Warning] Message has probably been already deleted.");
                  // Clear all timeouts since we can't update this message anymore
                  timeouts.forEach((t) => clearTimeout(t));
                } else {
                  console.error("[Error] Failed to update buttons:", error);
                }
              }
            };

            // Start the progression
            try {
              const initialTimeout = setTimeout(() => {
                updateButtons(10).catch(() => {
                  // Clear all timeouts if initial update fails
                  timeouts.forEach((t) => clearTimeout(t));
                });
              }, 5000);
              timeouts.push(initialTimeout);

              // Remove from cache and set final state after 35 seconds
              const finalTimeout = setTimeout(() => {
                try {
                  deleteFromCache(identifier);
                  // Set final state with just the open button
                  const finalState = getButtonState(
                    platform!,
                    null,
                    userInfo.userId || ctx.from?.id || 0,
                    originalLink
                  );
                  ctx.api
                    .editMessageReplyMarkup(chatId, botReply!.message_id, {
                      reply_markup: { inline_keyboard: finalState.buttons },
                    })
                    .catch((error) => {
                      if (error.message.includes("message to edit not found")) {
                        console.warn("[Warning] Message has probably been already deleted.");
                      } else {
                        console.error("[Error] Failed to set final button state:", error);
                      }
                    });
                } catch (error) {
                  // Message not found errors are expected if message was deleted
                  if (error instanceof Error && error.message.includes("message to edit not found")) {
                    console.warn("[Warning] Message has probably been already deleted.");
                  } else {
                    console.error("[Error] Failed to set final button state:", error);
                  }
                }
              }, 35000);
              timeouts.push(finalTimeout);
            } catch (error) {
              console.error("[Error] Failed to start button progression:", error);
              // Clear any timeouts that might have been set
              timeouts.forEach((t) => clearTimeout(t));
            }
          }
        } catch (error) {
          console.error("[Error] Could not reply with an expanded link.", error);
          throw error;
        }
      }
    }

    try {
      // Delete the original message only after we've successfully sent our reply
      if (ctx.msg?.message_id && botReply) {
        await ctx.api.deleteMessage(chatId, ctx.msg.message_id);
      }

      // Add message to cache for undo functionality
      if (botReply) {
        const identifier = `${chatId}:${botReply.message_id}`;
        await saveToCache(identifier, ctx);
      }
    } catch (error) {
      console.error("[Error] Could not delete original message or add to cache.", error);
    }

    if (topicId) {
      trackEvent(`expand.${expansionType}.inside-topic`);
    }
  } catch (error) {
    console.error("[Error: expand-link.ts] Could not reply with an expanded link.");
    // @ts-ignore
    // console.error(error);
    return;
  }
}

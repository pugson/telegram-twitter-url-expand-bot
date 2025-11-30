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
  isYouTubeShort,
  isFacebook,
} from "../helpers/platforms";
import { trackEvent } from "../helpers/analytics";
import { notifyAdmin } from "../helpers/notifier";
import { getOGMetadata } from "../helpers/og-metadata";
import { saveToCache, deleteFromCache } from "../helpers/cache";
import { getButtonState } from "../helpers/button-states";
import { resolveInstagramShare } from "../helpers/instagram-share";
import { INSTAGRAM_DOMAINS, TIKTOK_DOMAINS, TWITTER_DOMAINS, FACEBOOK_DOMAINS } from "../helpers/service-lists";

type UserInfoType = {
  username: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  userId: number | undefined;
};

function handleExpandedLinkDomain(link: string): string {
  if (link.includes("http", 1)) {
    link = link.split("http")[0];
  }

  switch (true) {
    case isInstagram(link):
      if (INSTAGRAM_DOMAINS.some(domain => link.includes(domain))) return link;
      return link.replace("instagram.com", INSTAGRAM_DOMAINS[0]);
    case isTikTok(link):
      const tiktokDomain = TIKTOK_DOMAINS[0];
      return link
        .replace("vt.tiktok.com", "vm." + tiktokDomain)
        .replace("lite.tiktok.com", tiktokDomain)
        .replace("tiktok.com", tiktokDomain);
    case isPosts(link):
      return link.replace("posts.cv", "postscv.com");
    case isTweet(link):
      if (link.includes("fxtwitter.com") || TWITTER_DOMAINS.some(domain => link.includes(domain))) return link;
      return link.replace("twitter.com", TWITTER_DOMAINS[0]).replace("x.com", TWITTER_DOMAINS[0]);
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
      if (FACEBOOK_DOMAINS.some(domain => link.includes(domain))) return link;
      return link.replace("facebook.com", FACEBOOK_DOMAINS[0]);
    default:
      return link;
  }
}

export async function expandLink(
  ctx: Context,
  link: string,
  messageText: string,
  userInfo: UserInfoType,
  expansionType: "auto" | "manual",
  replyId?: number
) {
  if (!ctx || !ctx.chat?.id) return;
  const expandedLink = handleExpandedLinkDomain(link);
  let linkWithNoTrackers = expandedLink;
  
  if (
    isTweet(link) ||
    isInstagram(link) ||
    isTikTok(link) ||
    isSpotify(link) ||
    isThreads(link) ||
    isYouTubeShort(link) ||
    isFacebook(link)
  ) {
    linkWithNoTrackers = expandedLink.split("?")[0];
  }

  try {
    const chatId = ctx.chat?.id;
    const topicId = ctx.msg?.message_thread_id;
    const replyTo = replyId || ctx.update?.message?.reply_to_message?.message_id;
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

        const maxCaptionLength = 500;

        const template = await expandedMessageTemplate(
          ctx,
          userInfo.username,
          userInfo.userId,
          userInfo.firstName,
          userInfo.lastName,
          messageText,
          linkWithNoTrackers
        );

        const remainingSpace = Math.max(0, maxCaptionLength - template.length - 4);
        const titleMaxLength = Math.min(50, Math.floor(remainingSpace * 0.3));
        const descMaxLength = Math.floor(remainingSpace * 0.7);

        const truncatedTitle = title.length > titleMaxLength ? title.slice(0, titleMaxLength) + "..." : title;
        const truncatedDesc =
          description.length > descMaxLength ? description.slice(0, descMaxLength) + "..." : description;

        botReply = await ctx.api.sendPhoto(chatId, new InputFile(new URL(`https://wsrv.nl/?url=${image}&w=600`)), {
          ...replyOptions,
          caption: template + `\n\n<b>${truncatedTitle}</b>\n${truncatedDesc}`,
          parse_mode: "HTML",
        });

        if (audio) {
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
      if (link.includes("instagram.com/share/")) {
        try {
          const resolvedUrl = await resolveInstagramShare(link);
          if (resolvedUrl) {
            const finalUrl = resolvedUrl.replace(/instagram\.com/g, INSTAGRAM_DOMAINS[0]);
            linkWithNoTrackers = finalUrl;
            link = finalUrl;
            let platform: "twitter" | "instagram" | "tiktok" | "instagram-share" | null = null;
            platform = "instagram-share";
          }
        } catch (error) {
          console.error("[Error] Failed to resolve Instagram share link:", error);
        }
      }
      else if (isInstagram(link)) {
        link = link.replace(/instagram\.com/g, INSTAGRAM_DOMAINS[0]);
      }

      if (link.includes("open.spotify.com")) {
         try {
          const metadata = await getOGMetadata(link ?? "");
          const { title, description, image, audio } = metadata;
          const maxCaptionLength = 500;
          const template = await expandedMessageTemplate(
            ctx,
            userInfo.username,
            userInfo.userId,
            userInfo.firstName,
            userInfo.lastName,
            messageText,
            linkWithNoTrackers
          );
          const remainingSpace = Math.max(0, maxCaptionLength - template.length - 4); 
          const titleMaxLength = Math.min(50, Math.floor(remainingSpace * 0.3)); 
          const descMaxLength = Math.floor(remainingSpace * 0.7); 

          const truncatedTitle = title.length > titleMaxLength ? title.slice(0, titleMaxLength) + "..." : title;
          const truncatedDesc =
            description.length > descMaxLength ? description.slice(0, descMaxLength) + "..." : description;

          botReply = await ctx.api.sendPhoto(chatId, new InputFile(new URL(`https://wsrv.nl/?url=${image}&w=600`)), {
            ...replyOptions,
            caption: template + `\n\n<b>${truncatedTitle}</b>\n${truncatedDesc}`,
            parse_mode: "HTML",
          });

          if (audio) {
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
        let platform: any = null;
        let originalLink = link; 
        if (isInstagram(link)) {
          platform = "instagram";
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

          if (platform && botReply) {
            const identifier = `${chatId}:${botReply.message_id}`;
            await saveToCache(identifier, ctx);

            const timeouts: NodeJS.Timeout[] = [];

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

                if (state.nextTimeout !== null) {
                  const timeout = setTimeout(() => {
                    try {
                      updateButtons(state.nextTimeout!).catch(() => {
                        timeouts.forEach((t) => clearTimeout(t));
                      });
                    } catch (error) {
                      timeouts.forEach((t) => clearTimeout(t));
                    }
                  }, 5000);
                  timeouts.push(timeout);
                } else {
                    // This handles the state when Delete button disappears (time=0)
                }
              } catch (error) {
                if (error instanceof Error && error.message.includes("message to edit not found")) {
                  console.warn("[Warning] Message has probably been already deleted.");
                  timeouts.forEach((t) => clearTimeout(t));
                } else {
                  console.error("[Error] Failed to update buttons:", error);
                }
              }
            };

            try {
              const initialTimeout = setTimeout(() => {
                updateButtons(10).catch(() => {
                  timeouts.forEach((t) => clearTimeout(t));
                });
              }, 5000);
              timeouts.push(initialTimeout);

              const undoTimeout = setTimeout(() => {
                try {
                  const intermediateState = getButtonState(
                    platform!,
                    0,
                    userInfo.userId || ctx.from?.id || 0,
                    originalLink,
                    false 
                  );
                  ctx.api
                    .editMessageReplyMarkup(chatId, botReply!.message_id, {
                      reply_markup: { inline_keyboard: intermediateState.buttons },
                    })
                    .catch(() => { /* ignore */ });
                } catch (error) { /* ignore */ }
              }, 35000);
              timeouts.push(undoTimeout);

              const finalTimeout = setTimeout(() => {
                try {
                  deleteFromCache(identifier);
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
                       // ignore
                    });
                } catch (error) {
                   // ignore
                }
              }, 60000);
              timeouts.push(finalTimeout);
            } catch (error) {
              console.error("[Error] Failed to start button progression:", error);
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
      if (ctx.msg?.message_id && botReply) {
        await ctx.api.deleteMessage(chatId, ctx.msg.message_id);
      }

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
    return;
  }
}

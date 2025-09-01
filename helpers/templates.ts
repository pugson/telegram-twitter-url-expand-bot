//! IMPORTANT !
//! Indentation and line breaks need to be preserved
//! to display properly in Telegram

import { Context } from "grammy";
import {
  isBluesky,
  isDribbble,
  isHackerNews,
  isInstagram,
  isPosts,
  isReddit,
  isSpotify,
  isSpotifyTrack,
  isSpotifyAlbum,
  isSpotifyPlaylist,
  isSpotifyArtist,
  isSpotifyEpisode,
  isSpotifyShow,
  isTikTok,
  isThreads,
  isYouTubeShort,
} from "./platforms";
import { getHackerNewsMetadata } from "./hacker-news-metadata";
import { notifyAdmin } from "./notifier";

export const hasPermissionToDeleteMessageTemplate = `✅ I have permissions to automatically delete original messages when expanding links.`;
export const missingPermissionToDeleteMessageTemplate = `🔐 An admin of this chat needs to give me permissions to automatically delete messages when expanding links.`;

/**
 * Message sent when a user sends the /autoexpand command.
 * @param enabled
 * @returns
 */
export const autoexpandSettingsTemplate = (enabled: boolean) => {
  return `Autoexpand is ${enabled ? "✅ *ON*" : "❌ *OFF*"} for this chat\\. 
  
I will ${
    enabled ? "expand" : "reply to"
  } Twitter, Instagram, Bluesky, TikTok, Reddit, Hacker News, Dribbble, and Posts․cv links\\.
      
${
  enabled
    ? "Original messages will be automatically deleted after expanding if you gave me admin permissions to delete messages\\. If you write any text in the original message it will be included in my reply\\."
    : "Someone will have to click a button to expand each link\\."
}`;
};

/**
 * Message sent when a user sends the /lock command.
 * @param enabled
 * @returns
 */
export const lockSettingsTemplate = (locked: boolean) => {
  return `Settings lock is ${locked ? "✅ *ON*" : "❌ *OFF*"} for this chat\\. 
  
As an admin you have the option to lock bot settings to prevent members from changing them\\.
`;
};

/**
 * Message sent when a user sends the /changelog command.
 * @param enabled
 */
export const changelogSettingsTemplate = (enabled: boolean) => {
  return `This chat is ${enabled ? "*subscribed* ✅ to" : "*unsubscribed* ❌ from"} changelog messages\\. 

${
  enabled
    ? "When a major update is released, I will post about it here\\."
    : "I will not post any release notes in here\\."
}
`;
};

/**
 * Message sent when a link is detected in chat but autoexpand is disabled.
 * @param link
 * @returns Expand this (platform)?
 */
export const askToExpandTemplate = (link: string) => {
  const insta = isInstagram(link);
  const tiktok = isTikTok(link);
  const posts = isPosts(link);
  const hn = isHackerNews(link);
  const dribbble = isDribbble(link);
  const bluesky = isBluesky(link);
  const reddit = isReddit(link);
  const spotify = isSpotify(link);
  const threads = isThreads(link);
  const ytShort = isYouTubeShort(link);

  if (insta) {
    return `Expand this Instagram post?`;
  }

  if (tiktok) {
    return `Expand this TikTok?`;
  }

  if (posts) {
    return `Expand this Post?`;
  }

  if (hn) {
    return `Expand this Hacker News post?`;
  }

  if (dribbble) {
    return `Expand this Dribbble shot?`;
  }

  if (bluesky) {
    return `Expand this Bluesky post?`;
  }

  if (reddit) {
    return `Expand this Reddit post?`;
  }

  if (spotify) {
    const track = isSpotifyTrack(link);
    const album = isSpotifyAlbum(link);
    const playlist = isSpotifyPlaylist(link);
    const artist = isSpotifyArtist(link);
    const episode = isSpotifyEpisode(link);
    const show = isSpotifyShow(link);

    if (track) {
      return `Expand this Spotify track?`;
    }

    if (album) {
      return `Expand this Spotify album?`;
    }

    if (playlist) {
      return `Expand this Spotify playlist?`;
    }

    if (artist) {
      return `Expand this Spotify artist?`;
    }

    if (episode) {
      return `Expand this Spotify episode?`;
    }

    if (show) {
      return `Expand this Spotify show?`;
    }
  }

  if (threads) {
    return `Expand this Threads post?`;
  }

  if (ytShort) {
    return `Expand this YouTube Short?`;
  }

  return `Expand this Tweet?`;
};

/**
 * This is what gets sent in a bot message when a user
 * clicks the expand button or the links are autoexpanded.
 */
export const expandedMessageTemplate = async (
  ctx: Context,
  username?: string,
  userId?: number,
  firstName?: string,
  lastName?: string,
  text?: string,
  link?: string
) => {
  // TODO: this function is a clusterfuck of ugly template literals. refactor in the future.
  const bothNames = firstName && lastName;
  const nameTemplate = bothNames ? `${firstName} ${lastName}` : firstName ?? lastName;
  const usernameOrFullNameTag = username ? `@${username}` : `<a href="tg://user?id=${userId}">${nameTemplate}</a>`;
  const isHackerNewsLink = link ? isHackerNews(link) : false;
  let includedLink = link;

  // Replace message template with HN metadata inline
  // This is ugly as hell but it works.
  if (isHackerNewsLink) {
    try {
      const hnPostId = link?.split("id=")[1];
      const metadata = await getHackerNewsMetadata(hnPostId);
      const { title, user, time_ago, comments_count, url } = metadata.post;

      includedLink = `<b>${title ? title : "Comment"}</b>
${comments_count} replies | ${time_ago} by ${user}
${link}

${url ? url : ""}`;
    } catch (error) {
      console.error(error);
      notifyAdmin(error);
    }
  }

  // Check if the original author of the message has a public profile.
  // @ts-expect-error forward_from is not defined for Message type
  if (ctx.msg?.forward_from) {
    // @ts-expect-error forward_from is not defined for Message type
    const forwardUserId = ctx.msg?.forward_from?.id;
    // @ts-expect-error forward_from is not defined for Message type
    const forwardUsername = ctx.msg?.forward_from?.username;
    // @ts-expect-error forward_from is not defined for Message type
    const forwardFirstName = ctx.msg?.forward_from?.first_name;
    // @ts-expect-error forward_from is not defined for Message type
    const forwardLastName = ctx.msg?.forward_from?.last_name;
    const bothNames = forwardFirstName && forwardLastName;
    const nameTemplate = bothNames ? `${forwardFirstName} ${forwardLastName}` : forwardFirstName ?? forwardLastName;

    // Link to the original author by username if they have one.
    if (forwardUsername) {
      return `<u>Forwarded from @${forwardUsername} by ${usernameOrFullNameTag}</u>
${text}

${includedLink}`;
    }

    // Link to the original author by ID if they don’t have a username.
    return `<u>Forwarded from <a href="tg://user?id=${forwardUserId}">${nameTemplate}</a> by ${usernameOrFullNameTag}</u> 
${text}

${includedLink}`;
  }

  // Check if the original author of the message has a private profile.
  // @ts-expect-error forward_sender_name is not defined for Message type
  if (ctx.msg?.forward_sender_name) {
    // @ts-expect-error forward_sender_name is not defined for Message type
    return `<u>Forwarded from <i>${ctx.msg?.forward_sender_name}</i> by ${usernameOrFullNameTag}</u>   
${text}

${includedLink}`;
  }

  // Check if the original author of the message is a channel.
  // @ts-expect-error forward_from_chat is not defined for Message type
  if (ctx.msg?.forward_from_chat) {
    // @ts-ignore
    const forwardName = ctx.msg?.forward_from_chat?.title;
    // @ts-ignore
    const forwardUsername = ctx.msg?.forward_from_chat?.username;

    // Link to the original channel by username if they have one.
    if (forwardUsername) {
      return `<u>Forwarded from @${forwardUsername} by ${usernameOrFullNameTag}</u>
${text}

${includedLink}`;
    }

    // Make the channel name italic if they don’t have a username.
    return `<u>Forwarded from <i>${forwardName}</i> by ${usernameOrFullNameTag}</u>
${text}

${includedLink}`;
  }

  // If the message was not forwarded, handle it normally.
  return `${usernameOrFullNameTag} 💬 ${text}

${includedLink}`;
};

/**
 * Safely send a reply message, handling the case where the message thread doesn't exist
 * by retrying without the thread ID
 */
export async function safeReply(
  ctx: any,
  message: string,
  options: { message_thread_id?: number; [key: string]: any } = {}
): Promise<void> {
  try {
    await ctx.reply(message, options);
  } catch (error: any) {
    // If thread doesn't exist, retry without thread ID
    if (error.description?.includes("message thread not found")) {
      const { message_thread_id, ...optionsWithoutThread } = options;
      await ctx.reply(message, optionsWithoutThread);
    } else {
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Safely send a message via bot.api.sendMessage, handling the case where the message thread doesn't exist
 * by retrying without the thread ID
 */
export async function safeSendMessage(
  api: any,
  chatId: number,
  message: string,
  options: { message_thread_id?: number; [key: string]: any } = {}
): Promise<any> {
  try {
    return await api.sendMessage(chatId, message, options);
  } catch (error: any) {
    // If thread doesn't exist, retry without thread ID
    if (error.description?.includes("message thread not found")) {
      const { message_thread_id, ...optionsWithoutThread } = options;
      return await api.sendMessage(chatId, message, optionsWithoutThread);
    } else {
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Safely call any API method that accepts message_thread_id, handling the case where the message thread doesn't exist
 * by retrying without the thread ID
 */
export async function safeApiCall<T>(
  apiMethod: (options: any) => Promise<T>,
  options: { message_thread_id?: number; [key: string]: any } = {}
): Promise<T> {
  try {
    return await apiMethod(options);
  } catch (error: any) {
    // If thread doesn't exist, retry without thread ID
    if (error.description?.includes("message thread not found")) {
      const { message_thread_id, ...optionsWithoutThread } = options;
      return await apiMethod(optionsWithoutThread);
    } else {
      throw error; // Re-throw other errors
    }
  }
}

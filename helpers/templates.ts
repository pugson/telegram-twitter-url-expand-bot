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
  isFacebook,
} from "./platforms";
import { getHackerNewsMetadata } from "./hacker-news-metadata";
import { notifyAdmin } from "./notifier";

export const hasPermissionToDeleteMessageTemplate = `✅ I have permissions to automatically delete original messages when expanding links.`;
export const missingPermissionToDeleteMessageTemplate = `🔐 An admin of this chat needs to give me permissions to automatically delete messages when expanding links.`;

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

export const lockSettingsTemplate = (locked: boolean) => {
  return `Settings lock is ${locked ? "✅ *ON*" : "❌ *OFF*"} for this chat\\. 
  
As an admin you have the option to lock bot settings to prevent members from changing them\\.
`;
};

export const changelogSettingsTemplate = (enabled: boolean) => {
  return `This chat is ${enabled ? "*subscribed* ✅ to" : "*unsubscribed* ❌ from"} changelog messages\\. 

${
  enabled
    ? "When a major update is released, I will post about it here\\."
    : "I will not post any release notes in here\\."
}
`;
};

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
  const fb = isFacebook(link);

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

  if (fb) {
    return `Expand this Facebook post?`;
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

export const expandedMessageTemplate = async (
  ctx: Context,
  username?: string,
  userId?: number,
  firstName?: string,
  lastName?: string,
  text?: string,
  link?: string
) => {
  const bothNames = firstName && lastName;
  const nameTemplate = bothNames ? `${firstName} ${lastName}` : firstName ?? lastName;
  const usernameOrFullNameTag = username ? `@${username}` : `<a href="tg://user?id=${userId}">${nameTemplate}</a>`;
  const isHackerNewsLink = link ? isHackerNews(link) : false;
  let includedLink = link;

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

  // Cast msg to any to avoid TypeScript errors with forward properties
  const msg = ctx.msg as any;

  if (msg?.forward_from) {
    const forwardUserId = msg.forward_from.id;
    const forwardUsername = msg.forward_from.username;
    const forwardFirstName = msg.forward_from.first_name;
    const forwardLastName = msg.forward_from.last_name;
    const bothNames = forwardFirstName && forwardLastName;
    const nameTemplate = bothNames ? `${forwardFirstName} ${forwardLastName}` : forwardFirstName ?? forwardLastName;

    if (forwardUsername) {
      return `<u>Forwarded from @${forwardUsername} by ${usernameOrFullNameTag}</u>
${text}

${includedLink}`;
    }

    return `<u>Forwarded from <a href="tg://user?id=${forwardUserId}">${nameTemplate}</a> by ${usernameOrFullNameTag}</u> 
${text}

${includedLink}`;
  }

  if (msg?.forward_sender_name) {
    return `<u>Forwarded from <i>${msg.forward_sender_name}</i> by ${usernameOrFullNameTag}</u>   
${text}

${includedLink}`;
  }

  if (msg?.forward_from_chat) {
    const forwardName = msg.forward_from_chat.title;
    const forwardUsername = msg.forward_from_chat.username;

    if (forwardUsername) {
      return `<u>Forwarded from @${forwardUsername} by ${usernameOrFullNameTag}</u>
${text}

${includedLink}`;
    }

    return `<u>Forwarded from <i>${forwardName}</i> by ${usernameOrFullNameTag}</u>
${text}

${includedLink}`;
  }

  return `${usernameOrFullNameTag} 💬 ${text}

${includedLink}`;
};

export async function safeReply(
  ctx: any,
  message: string,
  options: { message_thread_id?: number; [key: string]: any } = {}
): Promise<void> {
  try {
    await ctx.reply(message, options);
  } catch (error: any) {
    if (error.description?.includes("message thread not found")) {
      const { message_thread_id, ...optionsWithoutThread } = options;
      await ctx.reply(message, optionsWithoutThread);
    } else {
      throw error; 
    }
  }
}

export async function safeSendMessage(
  api: any,
  chatId: number,
  message: string,
  options: { message_thread_id?: number; [key: string]: any } = {}
): Promise<any> {
  try {
    return await api.sendMessage(chatId, message, options);
  } catch (error: any) {
    if (error.description?.includes("message thread not found")) {
      const { message_thread_id, ...optionsWithoutThread } = options;
      return await api.sendMessage(chatId, message, optionsWithoutThread);
    } else {
      throw error; 
    }
  }
}

export async function safeApiCall<T>(
  apiMethod: (options: any) => Promise<T>,
  options: { message_thread_id?: number; [key: string]: any } = {}
): Promise<T> {
  try {
    return await apiMethod(options);
  } catch (error: any) {
    if (error.description?.includes("message thread not found")) {
      const { message_thread_id, ...optionsWithoutThread } = options;
      return await apiMethod(optionsWithoutThread);
    } else {
      throw error;
    }
  }
}

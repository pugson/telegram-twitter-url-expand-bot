//! IMPORTANT !
//! Indentation and line breaks need to be preserved
//! to display properly in Telegram

import { Context } from "grammy";
import { isInstagram, isPosts, isTikTok } from "./platforms";

export const hasPermissionToDeleteMessageTemplate = `✅ I have permissions to automatically delete original messages when expanding links.`;
export const missingPermissionToDeleteMessageTemplate = `🔐 An admin of this chat needs to give me permissions to automatically delete messages when expanding links.`;

/**
 * Message sent when a user sends the /autoexpand command.
 * @param enabled
 * @returns
 */
export const autoexpandSettingsTemplate = (enabled: boolean) => {
  return `Autoexpand is ${enabled ? "✅ *ON*" : "❌ *OFF*"} for this chat\\. 
  
I will ${enabled ? "expand" : "reply to"} Twitter, Instagram, TikTok, and Posts.cv links\\.
      
${
  enabled
    ? "Original messages will be automatically deleted after expanding if you gave me admin permissions to delete messages\\. If you write any text in the original message it will be included in my reply\\."
    : "Someone will have to click a button to expand each link\\."
}`;
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

  if (insta) {
    return `Expand this Instagram post?`;
  }

  if (tiktok) {
    return `Expand this TikTok?`;
  }

  if (posts) {
    return `Expand this Post?`;
  }

  return `Expand this Tweet?`;
};

/**
 * This is what gets sent in a bot message when a user
 * clicks the expand button or the links are autoexpanded.
 */
export const expandedMessageTemplate = (
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

  // Check if the original author of the message has a public profile.
  if (ctx.msg?.forward_from) {
    const forwardUserId = ctx.msg?.forward_from?.id;
    const forwardUsername = ctx.msg?.forward_from?.username;
    const forwardFirstName = ctx.msg?.forward_from?.first_name;
    const forwardLastName = ctx.msg?.forward_from?.last_name;
    const bothNames = forwardFirstName && forwardLastName;
    const nameTemplate = bothNames ? `${forwardFirstName} ${forwardLastName}` : forwardFirstName ?? forwardLastName;

    // Link to the original author by username if they have one.
    if (forwardUsername) {
      return `<u>Forwarded from @${forwardUsername} by ${usernameOrFullNameTag}</u>
${text}

${link}`;
    }

    // Link to the original author by ID if they don’t have a username.
    return `<u>Forwarded from <a href="tg://user?id=${forwardUserId}">${nameTemplate}</a> by ${usernameOrFullNameTag}</u> 
${text}

${link}`;
  }

  // Check if the original author of the message has a private profile.
  if (ctx.msg?.forward_sender_name) {
    return `<u>Forwarded from <i>${ctx.msg?.forward_sender_name}</i> by ${usernameOrFullNameTag}</u>   
${text}

${link}`;
  }

  // Check if the original author of the message is a channel.
  if (ctx.msg?.forward_from_chat) {
    // @ts-ignore
    const forwardName = ctx.msg?.forward_from_chat?.title;
    // @ts-ignore
    const forwardUsername = ctx.msg?.forward_from_chat?.username;

    // Link to the original channel by username if they have one.
    if (forwardUsername) {
      return `<u>Forwarded from @${forwardUsername} by ${usernameOrFullNameTag}</u>
${text}

${link}`;
    }

    // Make the channel name italic if they don’t have a username.
    return `<u>Forwarded from <i>${forwardName}</i> by ${usernameOrFullNameTag}</u>
${text}

${link}`;
  }

  // If the message was not forwarded, handle it normally.
  return `${usernameOrFullNameTag} 💬 ${text}

${link}`;
};

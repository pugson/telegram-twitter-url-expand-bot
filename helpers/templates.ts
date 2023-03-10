//! IMPORTANT !
//! Indentation and line breaks need to be preserved
//! to display properly in Telegram

import { isInstagram, isTikTok } from "./platforms";

export const autoexpandSettingsTemplate = (enabled: boolean) => {
  return `Autoexpand is ${enabled ? "✅ *ON*" : "❌ *OFF*"} for this chat\\. 
  
I will ${enabled ? "expand" : "reply to"} Twitter, Instagram, and TikTok links\\.
      
${
  enabled
    ? "Original messages will be automatically deleted after expanding\\. If you write any text in the original message it will be included in my reply\\."
    : "Someone will have to click a button to expand each link\\."
}`;
};

export const hasPermissionToDeleteMessageTemplate = `✅ I have permissions to automatically delete original messages when expanding links.`;
export const missingPermissionToDeleteMessageTemplate = `🔐 An admin of this chat needs to give me permissions to automatically delete messages when expanding links.`;

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

  if (insta) {
    return `Expand this Instagram post?`;
  }

  if (tiktok) {
    return `Expand this TikTok?`;
  }

  return `Expand this Tweet?`;
};

/**
 * This is what gets sent in a bot message when a user
 * clicks the expand button or the links are autoexpanded.
 */
export const expandedMessageTemplate = (
  username?: string,
  userId?: number,
  firstName?: string,
  lastName?: string,
  text?: string,
  link?: string
) => {
  if (username) {
    // [@username]: message text
    //
    // https://twitter.com/username/status/1234567890
    return `@${username}: ${text}

${link}`;
  } else {
    const bothNames = firstName && lastName;
    const nameTemplate = bothNames ? `${firstName} ${lastName}` : firstName ?? lastName;

    // [firstName? lastName?]: message text
    //
    // https://twitter.com/username/status/1234567890
    return `<a href="tg://user?id=${userId}">${nameTemplate}</a>: ${text}

${link}`;
  }
};

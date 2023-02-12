// Indentation and line breaks need to be preserved
// to display properly in Telegram

import { isInstagram, isTikTok, isTweet } from "./platforms";

export const autoexpandMessageTemplate = (enabled: boolean) => {
  return `Autoexpand is ${enabled ? "✅ *ON*" : "❌ *OFF*"} for this chat\\. 
  
I will ${enabled ? "expand" : "reply to"} Twitter, Instagram, and TikTok links\\.
      
${
  enabled
    ? "Original messages will be automatically deleted after expanding\\. If you write any text in the original message it will be included in my reply\\."
    : "Someone will have to click a button to expand each link\\."
}`;
};

export const manuallyExpandMessageTemplate = (link: string) => {
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

export const hasPermissionToDeleteMessageTemplate = `✅ I have permissions to automatically delete messages when expanding links.`;
export const missingPermissionToDeleteMessageTemplate = `🔐 An admin of this chat needs to give me permissions to automatically delete messages when expanding links.`;

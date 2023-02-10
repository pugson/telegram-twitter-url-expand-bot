// Indentation and line breaks need to be preserved
// to display properly in Telegram

export const autoexpandMessageTemplate = (enabled: boolean) => {
  return `Autoexpand is ${enabled ? "✅ *ON*" : "❌ *OFF*"} for this chat for Twitter, Instagram, and TikTok links\\.
      
${
  enabled
    ? "Messages will be automatically deleted after expanding links\\. If you write any text with the link, it will be included in my reply\\."
    : "Someone will have to click a button to expand each link\\."
}`;
};

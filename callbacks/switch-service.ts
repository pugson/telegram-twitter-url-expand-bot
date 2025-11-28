import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { peekFromCache } from "../helpers/cache";
import { getButtonState } from "../helpers/button-states";
import { INSTAGRAM_DOMAINS, TIKTOK_DOMAINS, TWITTER_DOMAINS } from "../helpers/service-lists";

export async function handleSwitchService(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  if (!answer || !chatId || !messageId || !data) return;

  if (data.includes("switch:")) {
    const parts = data.split(":");
    const originalUserId = Number(parts[1]);
    const platform = parts[2];
    const clickerId = ctx.from?.id;

    // Optional: Restrict to original user similar to destruct
    // if (clickerId !== originalUserId) ...

    try {
      const identifier = `${chatId}:${messageId}`;
      const cached = await peekFromCache(identifier);
      
      if (cached) {
        const messageText = answer.message?.text || answer.message?.caption;
        if (!messageText) return;

        let domainList: string[] = [];
        if (platform === "twitter") domainList = TWITTER_DOMAINS;
        if (platform === "tiktok") domainList = TIKTOK_DOMAINS;
        if (platform === "instagram" || platform === "instagram-share") domainList = INSTAGRAM_DOMAINS;

        if (domainList.length === 0) return;

        // Find current domain used
        const currentDomain = domainList.find(d => messageText.includes(d));
        let nextDomain = domainList[0];

        if (currentDomain) {
          const currentIndex = domainList.indexOf(currentDomain);
          const nextIndex = (currentIndex + 1) % domainList.length;
          nextDomain = domainList[nextIndex];
        } else {
           // Fallback if current domain not found in list (e.g. fxtwitter)
           // If twitter and fxtwitter, switch to first in list
           if (platform === "twitter" && messageText.includes("fxtwitter.com")) {
              nextDomain = domainList[0];
           }
        }

        let newText = messageText;
        if (currentDomain) {
            newText = messageText.replace(new RegExp(currentDomain, "g"), nextDomain);
        } else if (platform === "twitter" && messageText.includes("fxtwitter.com")) {
            newText = messageText.replace(/fxtwitter\.com/g, nextDomain);
        }

        // Original URL for the open button
        let originalLink = "";
        const urlMatch = newText.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            originalLink = urlMatch[1];
             if (platform === "twitter") originalLink = originalLink.replace(nextDomain, "twitter.com");
             if (platform === "tiktok") originalLink = originalLink.replace(nextDomain, "tiktok.com").replace("vm.", "").replace("vt.", "");
             if (platform.includes("instagram")) originalLink = originalLink.replace(nextDomain, "instagram.com");
        }

        if (answer.message?.caption) {
             await ctx.api.editMessageCaption(chatId, messageId, {
                caption: newText,
                parse_mode: "HTML",
                // AÑADIDO ?. AQUÍ
                reply_markup: answer.message?.reply_markup
            });
        } else {
            await ctx.api.editMessageText(chatId, messageId, newText, {
                parse_mode: "HTML",
                // AÑADIDO ?. AQUÍ
                reply_markup: answer.message?.reply_markup
            });
        }
        
        trackEvent(`switch.${platform}.${nextDomain}`);
        await ctx.answerCallbackQuery({ text: `Switched to ${nextDomain}` });

      } else {
        await ctx.answerCallbackQuery({
            text: "Action expired.",
            show_alert: true
        });
      }
    } catch (error) {
        console.error(error);
        await ctx.answerCallbackQuery({ text: "Error switching service." });
    }
  }
}

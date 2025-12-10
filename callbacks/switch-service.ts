import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { peekFromCache } from "../helpers/cache";
import { INSTAGRAM_DOMAINS, TIKTOK_DOMAINS, TWITTER_DOMAINS, FACEBOOK_DOMAINS } from "../helpers/platforms";

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
        if (platform === "facebook") domainList = FACEBOOK_DOMAINS;

        if (domainList.length === 0) return;

        const escapeDomain = (domain: string) => domain.replace(/\./g, "\\.");
        const currentDomain = domainList.find((d) => messageText.includes(d));
        const baseDomainMatch =
          platform === "twitter"
            ? ["twitter.com", "x.com", "fxtwitter.com", "vxtwitter.com"].find((d) => messageText.includes(d))
            : platform === "tiktok"
            ? ["tiktok.com", "vt.tiktok.com", "lite.tiktok.com", "vm.tiktok.com"].find((d) => messageText.includes(d))
            : platform === "instagram" || platform === "instagram-share"
            ? ["instagram.com"].find((d) => messageText.includes(d))
            : platform === "facebook"
            ? ["facebook.com"].find((d) => messageText.includes(d))
            : null;

        let nextDomain = domainList[0];

        if (currentDomain) {
          const currentIndex = domainList.indexOf(currentDomain);
          const nextIndex = (currentIndex + 1) % domainList.length;
          nextDomain = domainList[nextIndex];
        } else if (baseDomainMatch) {
          nextDomain = domainList[0];
        }

        let newText = messageText;
        if (currentDomain) {
          newText = messageText.replace(new RegExp(escapeDomain(currentDomain), "g"), nextDomain);
        } else if (platform === "twitter" && baseDomainMatch) {
          newText = messageText
            .replace(/fxtwitter\.com/g, nextDomain)
            .replace(/vxtwitter\.com/g, nextDomain)
            .replace(/x\.com/g, nextDomain)
            .replace(/twitter\.com/g, nextDomain);
        } else if (platform === "tiktok" && baseDomainMatch) {
          newText = messageText
            .replace(/vt\.tiktok\.com/g, `vm.${nextDomain}`)
            .replace(/vm\.tiktok\.com/g, `vm.${nextDomain}`)
            .replace(/lite\.tiktok\.com/g, nextDomain)
            .replace(/tiktok\.com/g, nextDomain);
        } else if ((platform === "instagram" || platform === "instagram-share") && baseDomainMatch) {
          newText = messageText.replace(/instagram\.com/g, nextDomain);
        } else if (platform === "facebook" && baseDomainMatch) {
          newText = messageText.replace(/facebook\.com/g, nextDomain);
        }

        let originalLink = "";
        const urlMatch = newText.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          originalLink = urlMatch[1];
          if (platform === "twitter") originalLink = originalLink.replace(nextDomain, "twitter.com");
          if (platform === "tiktok")
            originalLink = originalLink.replace(nextDomain, "tiktok.com").replace("vm.", "").replace("vt.", "");
          if (platform.includes("instagram")) originalLink = originalLink.replace(nextDomain, "instagram.com");
          if (platform === "facebook") originalLink = originalLink.replace(nextDomain, "facebook.com");
        }

        if (answer.message?.caption) {
          await ctx.api.editMessageCaption(chatId, messageId, {
            caption: newText,
            parse_mode: "HTML",
            reply_markup: answer.message?.reply_markup,
          });
        } else {
          await ctx.api.editMessageText(chatId, messageId, newText, {
            parse_mode: "HTML",
            reply_markup: answer.message?.reply_markup,
          });
        }

        trackEvent(`switch.${platform}.${nextDomain}`);
        await ctx.answerCallbackQuery({ text: `Switched to ${nextDomain}` });
      } else {
        await ctx.answerCallbackQuery({
          text: "Action expired.",
          show_alert: true,
        });
      }
    } catch (error) {
      console.error(error);
      await ctx.answerCallbackQuery({ text: "Error switching service." });
    }
  }
}

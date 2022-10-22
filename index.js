import * as dotenv from "dotenv";
import Tgfancy from "tgfancy";
import { fetchTweet } from "./tweet-parser.js";
import { trackEvent } from "./analytics.js";

dotenv.config();

const TWITTER_INSTAGRAM_URL =
  /https?:\/\/(?:www\.)?(?:twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)|instagram\.com\/(?:p|reel)\/([A-Za-z0-9-_]+))/gim;
const bot = new Tgfancy(process.env.BOT_TOKEN, { polling: true });

// Match Twitter or Instagram links
bot.onText(TWITTER_INSTAGRAM_URL, (msg) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  // Get message text to parse links from
  const msgText = msg.text;
  // Iterate through all matched links in the message
  msgText.match(TWITTER_INSTAGRAM_URL).forEach((link) => {
    const isInstagram = link.includes("instagram.com");
    const platform = isInstagram ? "Instagram post" : "Tweet";

    bot.sendMessage(chatId, `Expand this ${platform}?`, {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Yes",
              callback_data: link,
              // callback_data has a 64 byte limit!!!
            },
            {
              text: "❌ No",
              callback_data: isInstagram ? "no.instagram" : "no.twitter",
            },
          ],
        ],
      },
    });
  });
});

// React to inline keyboard reply
bot.on("callback_query", async (answer) => {
  const chatId = answer.message.chat.id;
  const msgId = answer.message.message_id;
  const link = answer.data;
  const isInstagram = link.includes("instagram");

  if (link.startsWith("no.")) {
    // Delete the bot reply so it doesn’t spam the chat
    bot.deleteMessage(chatId, msgId);
    trackEvent(isInstagram ? "instagram.link.cancel" : "twitter.link.cancel");
    return;
  }

  if (link.startsWith("undo.")) {
    // Undo the link expansion and delete the bot reply
    bot.deleteMessage(chatId, msgId);
    trackEvent(isInstagram ? "instagram.link.undo" : "twitter.link.undo");
    return;
  }

  const expandLink = (url) => {
    bot.editMessageText(url, {
      chat_id: chatId,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "↩️ Undo",
              callback_data: isInstagram ? "undo.instagram" : "undo.twitter",
              // callback_data has a 64 byte limit!!!
            },
          ],
        ],
      },
    });

    trackEvent(isInstagram ? "instagram.link.expand" : "twitter.link.expand");
  };

  if (isInstagram) {
    // Replace Instagram link
    const newLink = link.replace("instagram.com", "ddinstagram.com");
    expandLink(newLink);
  } else {
    // Check if tweet has multiple images
    fetchTweet(link)
      .then((hasImages) => {
        const replacement = hasImages ? "c.vxtwitter.com" : "vxtwitter.com";
        const newLink = link.replace("twitter.com", replacement);
        // Replace the reply with an expanded Tweet link
        expandLink(newLink);
        if (hasImages) trackEvent("twitter.link.multipleImages");
      })
      .catch((error) => {
        console.error(error);
        // Fallback to vxtwitter.com if the API call fails
        const newLink = link.replace("twitter.com", "vxtwitter.com");
        expandLink(newLink);
      });
  }
});

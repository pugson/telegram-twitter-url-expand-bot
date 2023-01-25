import * as dotenv from "dotenv";
import Tgfancy from "tgfancy";
import { fetchTweet } from "./tweet-parser.js";

dotenv.config();

const TWITTER_INSTAGRAM_TIKTOK_URL =
  /https?:\/\/(?:www\.)?(?:mobile\.)?(?:twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)|instagram\.com\/(?:p|reel)\/([A-Za-z0-9-_]+)|tiktok\.com\/@(\w+)\/video\/(\d+))/gim;

const bot = new Tgfancy(process.env.BOT_TOKEN, { polling: true });

// Match Twitter or Instagram links
bot.onText(TWITTER_INSTAGRAM_TIKTOK_URL, (msg) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  // Get message text to parse links from
  const msgText = msg.text;
  // Iterate through all matched links in the message
  msgText.match(TWITTER_INSTAGRAM_TIKTOK_URL).forEach((link) => {
    const isInstagram = link.includes("instagram.com");
    const isTikTok = link.includes("tiktok.com");
    let platform = "Tweet";

    if (isInstagram) {
      platform = "Instagram post";
    }

    if (isTikTok) {
      platform = "TikTok";
    }

    bot.sendMessage(chatId, `Expand this ${platform}?`, {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Yes",
              callback_data: link.replace("mobile.", ""),
              // callback_data has a 64 byte limit!!!
            },
            {
              text: "❌ No",
              callback_data: "no.",
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
  const isTikTok = link.includes("tiktok.com");

  if (link.startsWith("no.")) {
    // Delete the bot reply so it doesn’t spam the chat
    bot.deleteMessage(chatId, msgId);
    return;
  }

  if (link.startsWith("undo.")) {
    // Undo the link expansion and delete the bot reply
    bot.deleteMessage(chatId, msgId);
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
              callback_data: "undo.",
              // callback_data has a 64 byte limit!!!
            },
          ],
        ],
      },
    });
  };

  if (isInstagram) {
    // Replace Instagram link
    const newLink = link.replace("instagram.com", "ddinstagram.com");
    expandLink(newLink);
  } else if (isTikTok) {
    // Replace TikTok link
    const newLink = link.replace("tiktok.com", "vxtiktok.com");
    expandLink(newLink);
  } else {
    // Check if tweet has multiple images
    fetchTweet(link)
      .then((hasImages) => {
        const replacement = hasImages ? "c.vxtwitter.com" : "vxtwitter.com";
        const newLink = link.replace("twitter.com", replacement);
        // Replace the reply with an expanded Tweet link
        expandLink(newLink);
      })
      .catch((error) => {
        console.error(error);
        // Fallback to vxtwitter.com if the API call fails
        const newLink = link.replace("twitter.com", "vxtwitter.com");
        expandLink(newLink);
      });
  }
});

import * as dotenv from "dotenv";
import Tgfancy from "tgfancy";
import fetch from "node-fetch";
import { fetchTweet } from "./tweet-parser.js";

dotenv.config();

const TWITTER_URL = /https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/gim;
const bot = new Tgfancy(process.env.BOT_TOKEN, { polling: true });

// 1. Match Twitter links
bot.onText(TWITTER_URL, (msg, match, error) => {
  // 2. Get the current Chat ID
  const chatId = msg.chat.id;

  // 3. Get message text to parse links from
  const msgText = msg.text;

  // 4. Iterate through all links in the message
  msgText.match(TWITTER_URL).forEach((link) => {
    bot.sendMessage(chatId, "Expand this Tweet?", {
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
              callback_data: `no`,
            },
          ],
        ],
      },
    });
  });
});

// 5. React to inline keyboard reply
bot.on("callback_query", async (answer) => {
  const chatId = answer.message.chat.id;
  const msgId = answer.message.message_id;
  const link = answer.data;

  if (link === "no") {
    // 6a. Delete the bot reply so it doesn’t spam the chat
    bot.deleteMessage(chatId, msgId);
    fetch(`https://qckm.io?m=twitter.link.cancel&v=1&k=${process.env.QUICKMETRICS_TOKEN}`);
    return;
  }

  if (link === "undo") {
    // 6b. Undo the link expansion and delete the bot reply
    bot.deleteMessage(chatId, msgId);
    fetch(`https://qckm.io?m=twitter.link.undo&v=1&k=${process.env.QUICKMETRICS_TOKEN}`);
    return;
  }

  const expandTweet = (url) => {
    bot.editMessageText(url, {
      chat_id: chatId,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "↩️ Undo",
              callback_data: "undo",
              // callback_data has a 64 byte limit!!!
            },
          ],
        ],
      },
    });

    fetch(`https://qckm.io?m=twitter.link.expand&v=1&k=${process.env.QUICKMETRICS_TOKEN}`);
  };

  // 7. Check if tweet has multiple images
  fetchTweet(link)
    .then((hasImages) => {
      const replacement = hasImages ? "c.vxtwitter.com" : "vxtwitter.com";
      const expandedLink = link.replace("twitter.com", replacement);
      // 8a. Replace the reply with an expanded Tweet link
      expandTweet(expandedLink);
    })
    .catch((error) => {
      console.error(error);

      // 8b. Fallback to vxtwitter.com if the API call fails
      const expandedLink = link.replace("twitter.com", "vxtwitter.com");
      expandTweet(expandedLink);
    });
});

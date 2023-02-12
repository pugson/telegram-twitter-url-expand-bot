import { bot } from "..";
import { trackEvent } from "../helpers/analytics";
import { fetchTweet } from "../helpers/tweet-parser";
import { expandLink } from "./reply-with-expanded-link";

// React to inline keyboard reply
bot.on("callback_query", async (answer: any) => {
  const chatId = answer.message.chat.id;
  const msgId = answer.message.message_id;

  // const link = answer.data;
  // const isInstagram = link.includes("instagram");

  // if (link.startsWith("no.")) {
  //   // Delete the bot reply so it doesn’t spam the chat
  //   bot.deleteMessage(chatId, msgId);
  //   trackEvent(isInstagram ? "instagram.link.cancel" : "twitter.link.cancel");
  //   return;
  // }

  // if (link.startsWith("undo.")) {
  //   // Undo the link expansion and delete the bot reply
  //   bot.deleteMessage(chatId, msgId);
  //   trackEvent(isInstagram ? "instagram.link.undo" : "twitter.link.undo");
  //   return;
  // }

  // if (isInstagram) {
  //   // Replace Instagram link
  //   const newLink = link.replace("instagram.com", "ddinstagram.com");
  //   expandLink(newLink, chatId, msgId);
  // } else {
  //   // Check if tweet has multiple images
  //   fetchTweet(link)
  //     .then((hasImages) => {
  //       const replacement = hasImages ? "c.vxtwitter.com" : "vxtwitter.com";
  //       const newLink = link.replace("twitter.com", replacement);
  //       // Replace the reply with an expanded Tweet link
  //       expandLink(newLink, chatId, msgId);
  //       if (hasImages) trackEvent("twitter.link.multipleImages");
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       // Fallback to vxtwitter.com if the API call fails
  //       const newLink = link.replace("twitter.com", "vxtwitter.com");
  //       expandLink(newLink, chatId, msgId);
  //     });
  // }
});

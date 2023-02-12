import { bot } from "..";
import { trackEvent } from "../helpers/analytics";
import { getSettings, createSettings } from "../helpers/api";
import { LINK_REGEX } from "../helpers/link-regex";
import { askToExpand } from "./ask-to-expand";
import { showBotActivity } from "./show-bot-activity";

// Match Twitter or Instagram links
bot.onText(LINK_REGEX, async (msg: any) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  // Get message text to parse links from
  const msgText = msg.text;
  // Get settings for this chat
  // const settings = await getSettings(chatId).then((data) => data);

  showBotActivity(chatId);

  const askToExpandAllLinksInMessage = async () => {
    msgText.match(LINK_REGEX).forEach((link: string) => {
      const isInstagram = link.includes("instagram.com");
      askToExpand(msg, chatId, link, isInstagram);
    });
  };

  // if (!!settings) {
  //   // If settings exist, check if this chat has autoexpand enabled
  //   if (settings.autoexpand) {
  //     // Iterate through all matched links in the message
  //     msgText.match(LINK_REGEX).forEach((link) => {
  //       const isInstagram = link.includes("instagram.com");
  //       console.log("link should autoexpand in this chat right here");
  //       console.log(msg.from);
  //       // @msg.from.username || msg.from.first_name (and msg.from.last_name if it exists)
  //       trackEvent(isInstagram ? "instagram.link.autoexpand" : "twitter.link.autoexpand");
  //     });
  //   } else {
  //     // Iterate through all matched links in the message
  //     askToExpandAllLinksInMessage();
  //   }
  // } else {
  //   // If settings don’t exist, create default settings for this chat
  //   createSettings(chatId, false);
  //   // Iterate through all matched links in the message
  //   askToExpandAllLinksInMessage();
  // }
});

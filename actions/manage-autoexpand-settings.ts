import { bot } from "..";
import { trackEvent } from "../helpers/analytics";
import { createSettings, getSettings, updateSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { deleteMessage } from "./delete-message";

// Handle settings
bot.onText(/^\/autoexpand/, async (msg: any) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  // const settings = await getSettings(chatId).then((data) => data);

  try {
    const settings = await getSettings(chatId);
    console.log(settings);

    // deleteMessage(msg, chatId);
    bot.sendMessage(chatId, `✅ expand me daddy`);
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }

  // if (settings) {
  //   if (!settings.autoexpand) {
  //     updateSettings(settings.id, true);
  //   }
  // } else {
  //   createSettings(chatId, true);
  // }
});

bot.onText(/^\/autoexpandon/, async (msg: any) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  // const settings = await getSettings(chatId).then((data) => data);

  // if (settings) {
  //   if (!settings.autoexpand) {
  //     updateSettings(settings.id, true);
  //   }
  // } else {
  //   createSettings(chatId, true);
  // }

  bot.sendMessage(chatId, `✅ I will auto-expand Twitter & Instagram links in this chat.`, {
    reply_to_message_id: msg.message_id,
  });

  trackEvent("command.autoexpand.on");
});

bot.onText(/^\/autoexpandoff/, async (msg: any) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  // const settings = await getSettings(chatId).then((data) => data);

  // if (settings) {
  //   if (settings.autoexpand) {
  //     updateSettings(settings.id, false);
  //   }
  // } else {
  //   createSettings(chatId, false);
  // }

  bot.sendMessage(chatId, `❌ I will no longer auto-expand Twitter & Instagram links in this chat.`, {
    reply_to_message_id: msg.message_id,
  });

  trackEvent("command.autoexpand.off");
});

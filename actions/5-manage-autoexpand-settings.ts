import { trackEvent } from "../helpers/analytics";
import { createSettings, getSettings, updateSettings } from "../helpers/api";
import { bot } from "../helpers/bot";

// Handle settings
bot.onText(/^\/autoexpandon/, async (msg) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  const settings = await getSettings(chatId).then((data) => data);

  if (settings) {
    if (!settings.autoexpand) {
      updateSettings(settings.id, true);
    }
  } else {
    createSettings(chatId, true);
  }

  bot.sendMessage(chatId, `✅ I will auto-expand Twitter & Instagram links in this chat.`, {
    reply_to_message_id: msg.message_id,
  });

  trackEvent("command.autoexpand.on");
});

bot.onText(/^\/autoexpandoff/, async (msg) => {
  // Get the current Chat ID
  const chatId = msg.chat.id;
  const settings = await getSettings(chatId).then((data) => data);

  if (settings) {
    if (settings.autoexpand) {
      updateSettings(settings.id, false);
    }
  } else {
    createSettings(chatId, false);
  }

  bot.sendMessage(chatId, `❌ I will no longer auto-expand Twitter & Instagram links in this chat.`, {
    reply_to_message_id: msg.message_id,
  });

  trackEvent("command.autoexpand.off");
});

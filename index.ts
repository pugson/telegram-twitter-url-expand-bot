import { Bot as TelegramBot } from "grammy";
import { notifyAdmin } from "./helpers/notifier";
import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN env variable is not defined");
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

try {
  bot.api.setMyCommands([
    {
      command: "autoexpand",
      description: "Manage link autoexpand settings for this chat.",
    },
    {
      command: "changelog",
      description: "Manage changelog settings for this chat.",
    },
    {
      command: "permissions",
      description: "Check if the bot has needed permissions.",
    },
    {
      command: "source",
      description: "Check the source code of this bot on GitHub.",
    },
  ]);
} catch (error) {
  console.error("[Error] Could not set bot commands.", error);
  notifyAdmin(error);
}

// Import all listeners from their index files
import "./link-listener";
import "./link-listener-channel";
import "./commands";
import "./callbacks";

bot.start().catch((error) => {
  console.error("[Error] Could not start bot.", error);
  notifyAdmin(error);
});

console.info("[ Bot started... ]");
notifyAdmin(`[ Bot started... ]`);

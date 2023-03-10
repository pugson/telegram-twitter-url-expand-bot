import { Bot as TelegramBot } from "grammy";
import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN env variable is not defined");
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

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

// Import all listeners from their index files
import "./link-listener";
import "./commands";
import "./callbacks";

bot.start();
console.info("[ Bot started... ]");

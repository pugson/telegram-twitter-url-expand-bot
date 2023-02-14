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
    command: "permissions",
    description: "Check if the bot has required permissions.",
  },
  {
    command: "changelog",
    description: "Manage changelog settings for this chat.",
  },
  {
    command: "source",
    description: "Check the source code of this bot on GitHub.",
  },
]);

import "./handlers/commands";
import "./handlers/callbacks";

bot.start();
console.info("[ Bot started... ]");
import TelegramBot from "node-telegram-bot-api";
import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN env variable is not defined");
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log("Bot started...");

import "./actions/react-to-button";
import "./actions/manage-autoexpand-settings";

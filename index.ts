import { Bot as TelegramBot } from "grammy";
import { notifyAdmin } from "./helpers/notifier";
import { setupLogger, logger } from "./helpers/logger";
import * as dotenv from "dotenv";
import { errorHandler } from "./middleware/error-handler";
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN env variable is not defined");
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Catch all errors with middleware
bot.catch(errorHandler);

async function main() {
  await setupLogger();

  try {
    bot.api.setMyCommands([
      {
        command: "autoexpand",
        description: "Manage link autoexpand settings for this chat.",
      },
      {
        command: "lock",
        description: "[Admin] Lock / unlock bot settings for this chat.",
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
    logger.error("Could not set bot commands: {error}", { error });
    notifyAdmin(error);
  }

  // Import all listeners from their index files
  await import("./link-listener");
  await import("./link-listener-channel");
  await import("./commands");
  await import("./callbacks");

  bot.start().catch((error) => {
    logger.error("Could not start bot: {error}", { error });
    notifyAdmin(error);
  });

  logger.info("Bot started...");
  notifyAdmin(`[ Bot started... ]`);
}

main();

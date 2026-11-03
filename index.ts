import { Bot as TelegramBot } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
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

// Updates are processed concurrently (see run() below), so a slow update in one
// chat doesn't hold up every other chat. Updates within the same chat still run
// in order, so settings toggles and expand/undo clicks can't race each other.
bot.use(sequentialize((ctx) => ctx.chat?.id.toString()));

async function main() {
  await setupLogger();

  // Not awaited: Telegram can take minutes to answer, and polling shouldn't wait for it
  bot.api
    .setMyCommands([
      {
        command: "autoexpand",
        description: "Manage link autoexpand settings for this chat.",
      },
      {
        command: "platforms",
        description: "Choose which platforms get expanded in this chat.",
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
    ])
    .catch((error) => {
      logger.error("Could not set bot commands: {error}", { error });
      notifyAdmin(error);
    });

  // Import all listeners from their index files
  await import("./link-listener");
  await import("./link-listener-channel");
  await import("./commands");
  await import("./callbacks");

  // silent: the runner would print fetch errors to the console, and those
  // include the request URL with the bot token. bot.start() was quiet too.
  const runner = run(bot, { runner: { silent: true } });

  // Updates fetched from Telegram are already confirmed and won't be sent
  // again, so finish the ones in progress before exiting.
  const stop = async (exitCode: number) => {
    await runner.stop();
    while (runner.size() > 0) await new Promise((resolve) => setTimeout(resolve, 100));
    process.exit(exitCode);
  };

  // Railway sends SIGTERM to the old instance when a new deploy goes live
  process.once("SIGTERM", () => stop(0));
  process.once("SIGINT", () => stop(0));

  // The runner only gives up on errors it can't retry, like 409 Conflict when
  // another instance starts polling. Exit so Railway restarts the bot instead
  // of leaving a process that no longer receives messages.
  runner.task()?.catch(async (error) => {
    logger.error("Bot stopped polling: {error}", { error });
    await notifyAdmin(error);
    await stop(1);
  });

  // Log memory every hour so a leak shows up as a trend in the Railway logs
  setInterval(() => {
    const { rss, heapUsed } = process.memoryUsage();
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
    logger.info("Memory: {rss} MB RSS, {heap} MB heap", { rss: mb(rss), heap: mb(heapUsed) });
  }, 60 * 60 * 1000);

  logger.info("Bot started...");
  notifyAdmin(`[ Bot started... ]`);
}

main();

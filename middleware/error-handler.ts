import { ErrorHandler } from "grammy";
import { notifyAdmin } from "../helpers/notifier";
import { logger } from "../helpers/logger";

/**
 * Error handler middleware for the bot
 * Catches all errors and prevents them from crashing the bot
 */
export const errorHandler: ErrorHandler = (err) => {
  const message = err.message || "";

  // Known errors that we can safely ignore
  if (message.includes("message to edit not found") || message.includes("message is not modified")) {
    logger.warn("Expected error: {message}", { message });
    return;
  }

  // Log unexpected errors and notify admin
  logger.error("Unexpected error in bot: {error}", { error: err });
  notifyAdmin(`Unexpected error in bot: ${err.message}`).catch((e) => logger.error("Failed to notify admin: {error}", { error: e }));
};

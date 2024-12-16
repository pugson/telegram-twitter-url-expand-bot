import { ErrorHandler } from "grammy";
import { notifyAdmin } from "../helpers/notifier";

/**
 * Error handler middleware for the bot
 * Catches all errors and prevents them from crashing the bot
 */
export const errorHandler: ErrorHandler = (err) => {
  const message = err.message || "";

  // Known errors that we can safely ignore
  if (message.includes("message to edit not found") || message.includes("message is not modified")) {
    console.warn("[Warning] Expected error:", message);
    return;
  }

  // Log unexpected errors and notify admin
  console.error("[Error] Unexpected error in bot:", err);
  notifyAdmin(`Unexpected error in bot: ${err.message}`).catch(console.error);
};

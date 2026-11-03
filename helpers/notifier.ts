import axios from "axios";
import { formatError, logger, redactToken } from "./logger";

/**
 * Notify the admin on Telegram when an error occurs.
 * @param message Message to send in chat.
 *  */
export const notifyAdmin = async (message: any): Promise<void> => {
  // Errors turn into "{}" with JSON.stringify, so send their stack trace instead
  const text =
    message instanceof Error ? formatError(message) : typeof message === "string" ? message : JSON.stringify(message);

  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.ADMIN_TELEGRAM_ID,
        text: redactToken(text).slice(0, 4000), // Telegram's limit is 4096 characters
      },
      { timeout: 10_000 }
    );
  } catch (error) {
    logger.error("Could not send admin Telegram notification: {error}", { error });
  }
};

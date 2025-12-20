import axios from "axios";
import { logger } from "./logger";

/**
 * Notify the admin on Telegram when an error occurs.
 * @param message Message to send in chat.
 *  */
export const notifyAdmin = async (message: any): Promise<void> => {
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.ADMIN_TELEGRAM_ID,
      text: JSON.stringify(message),
    });
  } catch (error) {
    logger.error("Could not send admin Telegram notification: {error}", { error });
  }
};

import axios from "axios";

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
    console.error(error);
  }
};

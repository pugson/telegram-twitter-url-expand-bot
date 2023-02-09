import axios from "axios";

// Notify the admin on Telegram when an error occurs
export const notifyAdmin = async (message: string): Promise<void> => {
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.ADMIN_TELEGRAM_ID,
      text: message,
    });
  } catch (error) {
    console.error(error);
  }
};

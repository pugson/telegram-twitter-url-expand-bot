import { bot } from "..";
import { updateSettings } from "../helpers/api";
import { logger } from "../helpers/logger";

// Chat size only feeds anonymous analytics, so refresh it at most once a day per chat
// instead of on every button click.
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_CHATS = 10_000;
const lastRefreshedAt = new Map<number, number>();

/**
 * Save group chat size to database for anonymous analytics.
 * @param chatId Telegram Chat ID
 */
export const getMemberCount = async (chatId: number) => {
  const now = Date.now();
  if (now - (lastRefreshedAt.get(chatId) ?? 0) < REFRESH_INTERVAL_MS) return;
  if (lastRefreshedAt.size >= MAX_TRACKED_CHATS) lastRefreshedAt.clear();
  lastRefreshedAt.set(chatId, now);

  try {
    const count = await bot.api.getChatMemberCount(chatId);
    // Set count as 0 if there are 2 or less members in the chat
    // because this would mean it's a private chat with the bot.
    // Otherwise subtract 1 from the count to account for the bot itself.
    const memberCount = count <= 2 ? 0 : count - 1;

    try {
      await updateSettings(chatId, "chat_size", memberCount);
    } catch (error) {
      logger.error("Error updating chat size: {error}", { error });
    }
  } catch (error) {
    logger.error("Could not get member count: {error}", { error });
    // Allow another try on the next click instead of waiting a day
    lastRefreshedAt.delete(chatId);
  }
};

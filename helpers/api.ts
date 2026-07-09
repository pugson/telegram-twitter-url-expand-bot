import fetch from "isomorphic-unfetch";
import { getRedisClient } from "./redis";
import { logger } from "./logger";

// @ts-ignore
globalThis.fetch = fetch;

const redis = getRedisClient();
const ONE_YEAR_IN_SECONDS = 31536000; // 1 year TTL

export interface ChatSettings {
  autoexpand: boolean;
  changelog: boolean;
  chat_size: number;
  ignore_permissions_warning: boolean;
  settings_lock: boolean;
  // Platform keys disabled with /platforms, stored as a CSV string in Redis.
  // Missing field means all platforms are enabled, so new platforms
  // added in the future are enabled by default in every chat.
  disabled_platforms: string[];
}

/**
 * Convert Redis hash string values to proper types
 */
const parseRedisHash = (hash: Record<string, string>): ChatSettings | null => {
  if (!hash || Object.keys(hash).length === 0) {
    return null;
  }

  return {
    autoexpand: hash.autoexpand === "true",
    changelog: hash.changelog === "true",
    chat_size: parseInt(hash.chat_size || "0"),
    ignore_permissions_warning: hash.ignore_permissions_warning === "true",
    settings_lock: hash.settings_lock === "true",
    disabled_platforms: hash.disabled_platforms ? hash.disabled_platforms.split(",").filter(Boolean) : [],
  };
};

/**
 * Get chat settings from Redis.
 * Throws on Redis errors so callers can tell a failed read apart from
 * a chat that has no settings record — treating an error as "no record"
 * would bypass or overwrite saved settings.
 * @param chatId Telegram Chat ID
 * @returns Chat settings record, or null when the chat has none
 */
export const getSettings = async (chatId: number): Promise<ChatSettings | null> => {
  logger.debug("Getting settings for chat ID: {chatId}", { chatId });
  const key = `chat:${chatId}`;
  const hash = await redis.hgetall(key);

  // Refresh TTL to 1 year on read
  if (hash && Object.keys(hash).length > 0) {
    await redis.expire(key, ONE_YEAR_IN_SECONDS);
  }

  return parseRedisHash(hash);
};

/**
 * Create a new chat settings record in Redis.
 * @param chatId Telegram Chat ID
 * @param autoexpandValue Autoexpand value boolean
 * @param changelogValue Changelog value boolean
 * @param settingsLockValue Settings lock value boolean
 * @returns Chat settings record
 */
export const createSettings = async (
  chatId: number,
  autoexpandValue: boolean,
  changelogValue: boolean,
  settingsLockValue: boolean
): Promise<ChatSettings | null> => {
  try {
    logger.debug("Creating settings for chat ID: {chatId}", { chatId });
    const key = `chat:${chatId}`;

    // Never overwrite an existing record — concurrent handlers can race
    // to create settings for the same chat, and writing defaults over an
    // existing hash would reset autoexpand, /platforms disables, and the
    // settings lock.
    const exists = await redis.exists(key);
    if (exists) {
      const hash = await redis.hgetall(key);
      await redis.expire(key, ONE_YEAR_IN_SECONDS);
      return parseRedisHash(hash);
    }

    const settings = {
      autoexpand: autoexpandValue.toString(),
      changelog: changelogValue.toString(),
      chat_size: "0",
      ignore_permissions_warning: "false",
      settings_lock: settingsLockValue.toString(),
      disabled_platforms: "",
    };

    await redis.hset(key, settings);

    // Set initial TTL to 1 year
    await redis.expire(key, ONE_YEAR_IN_SECONDS);

    return {
      autoexpand: autoexpandValue,
      changelog: changelogValue,
      chat_size: 0,
      ignore_permissions_warning: false,
      settings_lock: settingsLockValue,
      disabled_platforms: [],
    };
  } catch (error) {
    logger.error("Error creating settings: {error}", { error });
    return null;
  }
};

/**
 * Update settings for this chat in Redis.
 * @param id Telegram Chat ID
 * @param property Column name
 * @param value New value
 * @returns Updated settings
 */
export const updateSettings = async (
  id: number,
  property: keyof ChatSettings,
  value: ChatSettings[keyof ChatSettings]
): Promise<ChatSettings | null> => {
  try {
    logger.debug("Updating settings for chat ID: {id}", { id });
    const key = `chat:${id}`;
    
    // Check if chat exists
    const exists = await redis.exists(key);
    
    if (!exists) {
      logger.warn("No settings found for chat ID: {id}", { id });
      return null;
    }

    // Update the field (arrays are stored as CSV strings)
    const serialized = Array.isArray(value) ? value.join(",") : value.toString();
    await redis.hset(key, property, serialized);
    
    // Refresh TTL to 1 year
    await redis.expire(key, ONE_YEAR_IN_SECONDS);

    // Get and return updated settings
    const hash = await redis.hgetall(key);
    return parseRedisHash(hash);
  } catch (error) {
    logger.error("Error updating settings: {error}", { error });
    return null;
  }
};

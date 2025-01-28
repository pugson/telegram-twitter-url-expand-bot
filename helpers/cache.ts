import { Context } from "grammy";
import NodeCache from "node-cache";

const memoryCache = new NodeCache({
  // Store message Context in memory for a longer duration
  // if necessary, otherwise the button to expand links
  // will not work if the message has expired from cache.
  stdTTL: 60 * 60 * 8, // 8 hours
  // Most of the time, the message will be cached only
  // for a few seconds while the bot is processing it,
  // or when the user is in the process of clicking
  // the button that expands links in the message.
  checkperiod: 300, // Check for expired keys every 5 minutes
  maxKeys: 1000, // Max 1000 items in cache
  deleteOnExpire: true,
});

// Add cache stats logging every hour
setInterval(() => {
  const stats = memoryCache.getStats();
  console.log("[Cache Stats]", {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize,
  });
}, 60 * 60 * 1000);

/**
 * Cache messages in memory to be able to process them later.
 * This is required to make manual link expanding work, because
 * Telegram does not allow bots to look up messages by Chat ID
 * and Message ID. Only way to do that is to save the message
 * Context to in-memory cache, look it up later when responding
 * to a callback event and immediately delete it from cache
 * when the operation is complete.
 *
 * - Only messages with matching links that can be expanded are cached.
 * - Messages are not logged anywhere.
 * - Messages are not stored in a database.
 * - Messages are not sent to any external servers.
 * - No one has access to the cache other than the bot when it’s running.
 * - Cache is cleared when the bot is stopped or restarted.
 * - Cache is not persisted to disk.
 * - Your data is private and secure.
 *
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 * @param value Telegram Context
 */
export async function saveToCache(key: string, value: Context) {
  return memoryCache.set(key, value);
}

/**
 * Read message from in-memory cache for processing.
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 * @returns Telegram Context
 */
export async function getFromCache(key: string) {
  return memoryCache.take(key);
}

/**
 * Read message from in-memory cache without removing it.
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 * @returns Telegram Context
 */
export async function peekFromCache(key: string) {
  return memoryCache.get(key);
}

/**
 * Delete message from in-memory cache immediately.
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 */
export async function deleteFromCache(key: string) {
  return memoryCache.del(key);
}

/**
 * Check if message exists inside in-memory cache.
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 * @returns boolean
 */
export async function checkIfCached(key: string) {
  return memoryCache.has(key);
}

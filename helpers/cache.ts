import { Context } from "grammy";

// Store message Context in memory for a longer duration
// if necessary, otherwise the button to expand links
// will not work if the message has expired from cache.
const TTL_MS = 60 * 60 * 8 * 1000; // 8 hours
// When full, the oldest entry is evicted so new messages can always be cached.
const MAX_ENTRIES = 1000;

const memoryCache = new Map<string, { value: Context; expiresAt: number }>();

function read(key: string) {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return undefined;
  }
  return entry.value;
}

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
  memoryCache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  if (memoryCache.size > MAX_ENTRIES) {
    memoryCache.delete(memoryCache.keys().next().value!);
  }
}

/**
 * Read message from in-memory cache for processing.
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 * @returns Telegram Context
 */
export async function getFromCache(key: string) {
  const value = read(key);
  memoryCache.delete(key);
  return value;
}

/**
 * Delete message from in-memory cache immediately.
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 */
export async function deleteFromCache(key: string) {
  memoryCache.delete(key);
}

/**
 * Check if message exists inside in-memory cache.
 * @param key Unique identifier for the message (chatId:messageId:linkIndex)
 * @returns boolean
 */
export async function checkIfCached(key: string) {
  return read(key) !== undefined;
}

// Bot replies with expanded links keep their Undo and "Embed not working?"
// buttons for 60 seconds. Only the message key is kept, separate from the
// cache above, so a burst of expansions can't push out unanswered prompts.
const EXPANDED_TTL_MS = 60 * 1000;
const expandedUntil = new Map<string, number>();

/**
 * Start the 60 second window for the buttons on an expanded link reply.
 * @param key Bot reply identifier (chatId:messageId)
 */
export function markExpanded(key: string) {
  const now = Date.now();
  // Every entry gets the same TTL, so expired entries are always at the front
  for (const [oldKey, expiresAt] of expandedUntil) {
    if (expiresAt > now) break;
    expandedUntil.delete(oldKey);
  }
  expandedUntil.set(key, now + EXPANDED_TTL_MS);
}

/**
 * Check if the buttons on an expanded link reply still work.
 * @param key Bot reply identifier (chatId:messageId)
 */
export function isRecentlyExpanded(key: string) {
  return (expandedUntil.get(key) ?? 0) > Date.now();
}

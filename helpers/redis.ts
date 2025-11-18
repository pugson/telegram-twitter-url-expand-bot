import Redis from "ioredis";

let instance: Redis | undefined = undefined;

/**
 * Get Redis client instance (singleton pattern)
 * @returns Redis client
 */
export const getRedisClient = () => {
  if (instance) return instance;

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not set");
  }

  instance = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 5,
    connectTimeout: 10_000,
  });

  instance.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  instance.on("connect", () => {
    console.log("Redis connected successfully");
  });

  return instance;
};

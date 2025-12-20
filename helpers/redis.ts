import Redis from "ioredis";
import { logger } from "./logger";

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
    logger.error("Redis connection error: {error}", { error: err });
  });

  instance.on("connect", () => {
    logger.info("Redis connected successfully");
  });

  return instance;
};

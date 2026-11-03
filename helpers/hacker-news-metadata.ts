import axios from "axios";
import { logger } from "./logger";

export const getHackerNewsMetadata = async (postId: string | undefined) => {
  if (!postId) return;

  try {
    const response = await axios.get(`https://hn-metadata-api.vercel.app/${postId}`, { timeout: 10_000 });
    return response.data;
  } catch (error) {
    logger.error("Error fetching Hacker News metadata: {error}", { error });
  }
};

import axios from "axios";
import { logger } from "./logger";

export const getOGMetadata = async (link: string) => {
  if (!link) return;

  try {
    const response = await axios.get(`https://og.metadata.vision/${link}`, {
      timeout: 60_000,
    });
    return response.data.data;
  } catch (error) {
    logger.error("Error fetching OG metadata: {error}", { error });
  }
};

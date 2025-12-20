import axios from "axios";
import { logger } from "./logger";

async function createEvent(event: string, timestamp: string, note?: string) {
  await axios.post(
    process.env.ANALYTICS_ENDPOINT!,
    {
      event,
      timestamp,
      note,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.ANALYTICS_KEY}`,
      },
    }
  );
}

/**
 * Sends an anonymous event to the server.
 * @param event Name to identify the event
 * @param note Optional note to add to the event
 */
export const trackEvent = async (event: string, note?: string) => {
  const isDev = process.env.DEV;
  const extraNote = isDev ? "DEV" : note;

  try {
    const timestamp = new Date().toISOString();
    await createEvent(event, timestamp, extraNote);
  } catch (error) {
    logger.error("Error tracking event: {error}", { error });
    return;
  }
};

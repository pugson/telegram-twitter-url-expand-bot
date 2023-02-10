import { createEvent } from "./api";

/**
 * Sends an anonymous event to the server.
 * @param event String to identify the event
 * @param note Optional note to add to the event
 */
export const trackEvent = async (event: string, note?: string) => {
  try {
    const timestamp = new Date().toISOString();
    await createEvent(event, timestamp, note);
  } catch (error) {
    console.error(error);
  }
};

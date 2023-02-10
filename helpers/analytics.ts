import { createEvent } from "./api";

export const trackEvent = async (event: string, note?: string) => {
  try {
    const timestamp = new Date().toISOString();
    const record = await createEvent(event, timestamp, note);

    return record;
  } catch (error) {
    console.error(error);
  }
};

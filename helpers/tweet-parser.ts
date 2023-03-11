import axios from "axios";
import { notifyAdmin } from "./notifier";

export const fetchTweet = async (url: string): Promise<boolean> => {
  let hasImages = false;

  try {
    // @ts-expect-error Object is possibly 'undefined'.ts(2532)
    const tweetId = url.split("/").pop().split("?")[0];
    const response = await axios.get(`https://tweet-api-cache.vercel.app/${tweetId}?passkey=${process.env.PASSKEY}`);
    hasImages = response.data.extended_entities && response.data.extended_entities.media.length > 1;
  } catch (error) {
    // @ts-ignore
    console.error(url, error.message);
    // @ts-ignore
    notifyAdmin(`url: ${url}, message: ${error.message}`);
  }

  return hasImages;
};

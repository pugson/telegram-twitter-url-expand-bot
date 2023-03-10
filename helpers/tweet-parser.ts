import axios from "axios";

export const fetchTweet = async (url: string): Promise<boolean> => {
  try {
    // @ts-expect-error Object is possibly 'undefined'.ts(2532)
    const tweetId = url.split("/").pop().split("?")[0];
    const response = await axios.get(`https://tweet-api-cache.vercel.app/${tweetId}?passkey=${process.env.PASSKEY}`);
    const hasImages = response.data.extended_entities && response.data.extended_entities.media.length > 1;
    return hasImages;
  } catch (error) {
    console.error(url, error);
    return false;
  }
};

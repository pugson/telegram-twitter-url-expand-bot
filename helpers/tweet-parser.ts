import axios from "axios";

// TODO: Add an edge cache to avoid hitting the API too much and improve performance.
// Deploy an endpoint that will fetch the tweet and cache the result for 7 days.
export const fetchTweet = async (url: string): Promise<boolean> => {
  try {
    const tweetId = url.split("/").pop().split("?")[0];
    const response = await axios.get(
      `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&tweet_mode=extended`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
        },
      }
    );
    const hasImages = response.data.extended_entities && response.data.extended_entities.media.length > 0;
    return hasImages;
  } catch (error) {
    console.error(url, error);
    return false;
  }
};

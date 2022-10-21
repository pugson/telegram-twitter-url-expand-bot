import fetch from "node-fetch";

export const fetchTweet = async (url) => {
  const tweetId = url.split("/").pop().split("?")[0];

  try {
    const response = await fetch(`https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&tweet_mode=extended`, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
      },
    });
    const data = await response.json();
    const hasImages = data.extended_entities && data.extended_entities.media.length > 1;

    if (hasImages) {
      fetch(`https://qckm.io?m=twitter.link.multipleImages&v=1&k=${process.env.QUICKMETRICS_TOKEN}`);
    }

    return hasImages;
  } catch (error) {
    console.error(url, error);
  }
};

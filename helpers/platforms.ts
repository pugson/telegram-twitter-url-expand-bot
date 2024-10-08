const checkLink = (link: string, platform: string) => {
  const isMatch = link.includes(platform);
  return isMatch;
};

export const isTweet = (link: string) => checkLink(link, "twitter.com") || checkLink(link, "x.com");
export const isInstagram = (link: string) => checkLink(link, "instagram.com");
export const isTikTok = (link: string) => checkLink(link, "tiktok.com");
export const isPosts = (link: string) => checkLink(link, "posts.cv");
export const isHackerNews = (link: string) => checkLink(link, "news.ycombinator.com");
export const isDribbble = (link: string) => checkLink(link, "dribbble.com");

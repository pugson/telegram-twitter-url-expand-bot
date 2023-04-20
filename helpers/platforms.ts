const checkLink = (link: string, platform: string) => {
  const isMatch = link.includes(platform);
  return isMatch;
};

export const isTweet = (link: string) => checkLink(link, "twitter.com");
export const isInstagram = (link: string) => checkLink(link, "instagram.com");
export const isTikTok = (link: string) => checkLink(link, "tiktok.com");

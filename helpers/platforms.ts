export const isTweet = (link: string, returnPlatform?: boolean) => {
  const isMatch = link.includes("twitter.com");

  return returnPlatform ? { isMatch, platform: "twitter" } : isMatch;
};

export const isInstagram = (link: string, returnPlatform?: boolean) => {
  const isMatch = link.includes("instagram.com");

  return returnPlatform ? { isMatch, platform: "instagram" } : isMatch;
};

export const isTikTok = (link: string, returnPlatform?: boolean) => {
  const isMatch = link.includes("tiktok.com");

  return returnPlatform ? { isMatch, platform: "tiktok" } : isMatch;
};

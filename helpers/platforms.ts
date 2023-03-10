export const isTweet = (link: string) => {
  const isMatch = link.includes("twitter.com");
  return isMatch;
};

export const isInstagram = (link: string) => {
  const isMatch = link.includes("instagram.com");
  return isMatch;
};

export const isTikTok = (link: string) => {
  const isMatch = link.includes("tiktok.com");
  return isMatch;
};

const checkLink = (link: string, platform: string) => {
  const isMatch = link.includes(platform);
  return isMatch;
};

export const isTweet = (link: string) =>
  checkLink(link, "twitter.com") || checkLink(link, "x.com") || checkLink(link, "fxtwitter.com");
export const isInstagram = (link: string) =>
  (checkLink(link, "instagram.com") || checkLink(link, "eeinstagram.com")) && !link.includes("/share/");
export const isInstagramShare = (link: string) => link.includes("instagram.com/share/");
export const isTikTok = (link: string) => checkLink(link, "tiktok.com") || checkLink(link, "tiktokez.com");
export const isPosts = (link: string) => checkLink(link, "posts.cv") || checkLink(link, "postscv.com");
export const isHackerNews = (link: string) => checkLink(link, "news.ycombinator.com");
export const isDribbble = (link: string) => checkLink(link, "dribbble.com") || checkLink(link, "dribbbletv.com");
export const isBluesky = (link: string) => checkLink(link, "bsky.app") || checkLink(link, "fxbsky.app");
export const isReddit = (link: string) => checkLink(link, "reddit.com") || checkLink(link, "rxddit.com");
export const isSpotify = (link: string) => checkLink(link, "open.spotify.com");
export const isThreads = (link: string) =>
  checkLink(link, "threads.com") || checkLink(link, "threads.net") || checkLink(link, "threadsez.com");
export const isYouTubeShort = (link: string) =>
  checkLink(link, "youtube.com/shorts/") || checkLink(link, "koutube.com/shorts/");

// Spotify helpers
export const isSpotifyTrack = (link: string) => checkLink(link, "open.spotify.com/track");
export const isSpotifyAlbum = (link: string) => checkLink(link, "open.spotify.com/album");
export const isSpotifyPlaylist = (link: string) => checkLink(link, "open.spotify.com/playlist");
export const isSpotifyArtist = (link: string) => checkLink(link, "open.spotify.com/artist");
export const isSpotifyEpisode = (link: string) => checkLink(link, "open.spotify.com/episode");
export const isSpotifyShow = (link: string) => checkLink(link, "open.spotify.com/show");

const ALL_PLATFORMS = [
  "Twitter",
  "Instagram",
  "TikTok",
  "Reddit",
  "Spotify",
  "Hacker News",
  "Dribbble",
  "Bluesky",
  "Threads",
  "YouTube Shorts",
];

export const listOfAllPlatforms = ALL_PLATFORMS.join(", ");

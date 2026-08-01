export const INSTAGRAM_DOMAINS = [
  "adobe.lol",
  "zzinstagram.com",
  "vxinstagram.com",
  "eeinstagram.com",
  "kkclip.com",
  "xnstagram.com",
];
export const TIKTOK_DOMAINS = ["tnktok.com", "tfxktok.com", "kktiktok.com", "tiktxk.com", "tiktokez.com"];
export const TWITTER_DOMAINS = ["fxtwitter.com", "vxtwitter.com", "fixupx.com", "fixvx.com", "twitterez.com"];
export const FACEBOOK_DOMAINS = ["facebed.com"];

/**
 * Rewrites instagram.com links to an embed service domain.
 *
 * Host prefixes are dropped deliberately. A plain string swap would turn
 * www.instagram.com into www.adobe.lol and mobile.instagram.com into
 * mobile.adobe.lol; adobe.lol is apex-only, so both are dead hosts. Instagram's
 * share sheet hands out www URLs and LINK_REGEX accepts mobile ones, so these
 * are the common case rather than an edge case. Dropping the prefix is harmless
 * for the other embed hosts and yields one canonical hostname.
 */
export const INSTAGRAM_HOST_PATTERN = /(?:www\.)?(?:mobile\.|m\.)?instagram\.com/;

export const rewriteInstagramDomain = (link: string, domain: string = INSTAGRAM_DOMAINS[0]) =>
  link.replace(new RegExp(INSTAGRAM_HOST_PATTERN.source, "g"), domain);

const checkLink = (link: string, platform: string) => {
  const isMatch = link.includes(platform);
  return isMatch;
};

const checkDomains = (link: string, domains: string[]) => {
  return domains.some((domain) => link.includes(domain));
};

export const isTweet = (link: string) =>
  checkLink(link, "twitter.com") ||
  checkLink(link, "x.com") ||
  checkLink(link, "fxtwitter.com") ||
  checkDomains(link, TWITTER_DOMAINS);
export const isInstagram = (link: string) =>
  (checkLink(link, "instagram.com") || checkLink(link, "eeinstagram.com") || checkDomains(link, INSTAGRAM_DOMAINS)) &&
  !link.includes("/share/");
export const isInstagramShare = (link: string) => link.includes("instagram.com/share/");
export const isTikTok = (link: string) =>
  checkLink(link, "tiktok.com") || checkLink(link, "tiktokez.com") || checkDomains(link, TIKTOK_DOMAINS);
export const isHackerNews = (link: string) => checkLink(link, "news.ycombinator.com");
export const isDribbble = (link: string) => checkLink(link, "dribbble.com") || checkLink(link, "dribbbletv.com");
export const isBluesky = (link: string) => checkLink(link, "bsky.app") || checkLink(link, "fxbsky.app");
export const isReddit = (link: string) => checkLink(link, "reddit.com") || checkLink(link, "rxddit.com");
export const isSpotify = (link: string) => checkLink(link, "open.spotify.com");
export const isThreads = (link: string) =>
  checkLink(link, "threads.com") || checkLink(link, "threads.net") || checkLink(link, "threadsez.com");
export const isYouTubeShort = (link: string) =>
  checkLink(link, "youtube.com/shorts/") || checkLink(link, "koutube.com/shorts/");

// Facebook Regex strictly matching the allowed patterns (synced with link-regex.ts)
const FACEBOOK_REGEX =
  /facebook\.com\/(?:[^\/]+\/(?:posts|videos)\/|groups\/[^\/]+\/(?:posts\/|permalink\/|\?.*multi_permalinks)|share\/(?:r|p|v)\/|reel\/|photo\/?\?|watch|story\.php|permalink\.php)/im;

export const isFacebook = (link: string) => FACEBOOK_REGEX.test(link) || checkDomains(link, FACEBOOK_DOMAINS);

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
  "Facebook",
];

export const listOfAllPlatforms = ALL_PLATFORMS.join(", ");

export type PlatformKey =
  | "twitter"
  | "instagram"
  | "instagram-share"
  | "tiktok"
  | "hackernews"
  | "dribbble"
  | "bluesky"
  | "reddit"
  | "spotify"
  | "threads"
  | "youtube"
  | "facebook";

// Platforms that admins can enable/disable per chat with /platforms.
// instagram-share is folded into instagram, and spotify is excluded
// because Spotify links are not matched by LINK_REGEX in chats.
export type TogglePlatformKey = Exclude<PlatformKey, "instagram-share" | "spotify">;

export const TOGGLEABLE_PLATFORMS: { key: TogglePlatformKey; label: string }[] = [
  { key: "twitter", label: "Twitter / X" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "reddit", label: "Reddit" },
  { key: "threads", label: "Threads" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube Shorts" },
  { key: "bluesky", label: "Bluesky" },
  { key: "hackernews", label: "Hacker News" },
  { key: "dribbble", label: "Dribbble" },
];

/**
 * Detect which platform a link belongs to.
 * Single source of truth replacing the ternary chains that were
 * duplicated across listeners and actions.
 */
export const getPlatformKey = (link: string): PlatformKey => {
  if (isInstagramShare(link)) return "instagram-share";
  if (isInstagram(link)) return "instagram";
  if (isTikTok(link)) return "tiktok";
  if (isHackerNews(link)) return "hackernews";
  if (isDribbble(link)) return "dribbble";
  if (isBluesky(link)) return "bluesky";
  if (isReddit(link)) return "reddit";
  if (isSpotify(link)) return "spotify";
  if (isThreads(link)) return "threads";
  if (isYouTubeShort(link)) return "youtube";
  if (isFacebook(link)) return "facebook";
  return "twitter";
};

/**
 * Map a link to the platform key used by the /platforms toggles.
 * Returns null for platforms that cannot be disabled.
 */
export const getTogglePlatformKey = (link: string): TogglePlatformKey | null => {
  const key = getPlatformKey(link);
  if (key === "instagram-share") return "instagram";
  if (key === "spotify") return null;
  return key;
};

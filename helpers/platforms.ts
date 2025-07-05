const checkLink = (link: string, platform: string) => {
  const isMatch = link.includes(platform);
  return isMatch;
};

export const isTweet = (link: string) => checkLink(link, "twitter.com") || checkLink(link, "x.com");
export const isInstagram = (link: string) => checkLink(link, "instagram.com") && !link.includes("/share/");
export const isInstagramShare = (link: string) => link.includes("instagram.com/share/");
export const isTikTok = (link: string) => checkLink(link, "tiktok.com");
export const isPosts = (link: string) => checkLink(link, "posts.cv");
export const isHackerNews = (link: string) => checkLink(link, "news.ycombinator.com");
export const isDribbble = (link: string) => checkLink(link, "dribbble.com");
export const isBluesky = (link: string) => checkLink(link, "bsky.app");
export const isReddit = (link: string) => checkLink(link, "reddit.com");
export const isSpotify = (link: string) => checkLink(link, "open.spotify.com");
export const isFarcaster = (link: string) => checkLink(link, "farcaster.xyz");

// Spotify helpers
export const isSpotifyTrack = (link: string) => checkLink(link, "open.spotify.com/track");
export const isSpotifyAlbum = (link: string) => checkLink(link, "open.spotify.com/album");
export const isSpotifyPlaylist = (link: string) => checkLink(link, "open.spotify.com/playlist");
export const isSpotifyArtist = (link: string) => checkLink(link, "open.spotify.com/artist");
export const isSpotifyEpisode = (link: string) => checkLink(link, "open.spotify.com/episode");
export const isSpotifyShow = (link: string) => checkLink(link, "open.spotify.com/show");

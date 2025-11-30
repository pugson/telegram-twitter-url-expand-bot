/** This regex will match the following URL structures:
 * 
 * Twitter (and x.com) status URLs, in the format:
    - https://www.twitter.com/username/status/status_id
    - https://twitter.com/username/status/status_id
    - https://mobile.twitter.com/username/status/status_id
    - https://mobile.twitter.com/username/statuses/status_id
    - https://www.twitter.com/username/statuses/status_id
    
 * Instagram post URLs, in the format:
    - https://mobile.instagram.com/p/post_id
    - https://www.instagram.com/stories/username/post_id
    - https://www.instagram.com/p/post_id
    - https://www.instagram.com/reel/post_id
    - https://instagram.com/p/post_id
    - https://instagram.com/reel/post_id
    - https://mobile.instagram.com/reel/post_id

 * TikTok video URLs, in the format:
    - https://www.tiktok.com/@username/video/video_id
    - https://tiktok.com/@username/video/video_id
    - https://www.tiktok.com/t/video_id
    - https://vm.tiktok.com/video_id
    - https://vt.tiktok.com/video_id
    - https://id.tiktok.com/video_id
    - https://en.tiktok.com/video_id
    - https://mobile.tiktok.com/@username/video/video_id
    - https://lite.tiktok.com/@username/video/video_id
    - Any subdomain.tiktok.com URLs

   * Posts.cv URLs, in the format:
    - https://posts.cv/username/post_id

   * Hacker News URLs, in the format:
    - https://news.ycombinator.com/item?id=post_id

   * Dribbble URLs, in the format:
    - https://dribbble.com/shots/shot_id

   * Bluesky URLs, in the format:
    - https://bsky.app/username/post_id
    - https://bsky.app/profile/username/post/post_id

   * Reddit URLs, in the format:
    - https://www.reddit.com/r/:subreddit/comments/:id/:slug/:comment
    - https://reddit.com/r/:subreddit/comments/:id/:slug
    - https://reddit.com/r/:subreddit/comments/:id
    - https://reddit.com/r/:subreddit/s/:id
    - https://reddit.com/:id

    * Threads URLs, in the format:
    - https://threads.com/@username/post/post_id
    - https://www.threads.com/@username/post/post_id
    - https://threads.net/@username/post/post_id
    - https://www.threads.net/@username/post/post_id

 */
export const LINK_REGEX: RegExp =
  /https?:\/\/(?:www\.)?(?:mobile\.)?(?:(?:twitter|x)\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)(?:\?.*)?|instagram\.com\/(?:p|reel|reels|share|stories\/[^\/]+)\/([A-Za-z0-9-_]+)(?:\?.*)?|(?:[a-z0-9-]+\.)?tiktok\.com\/(?:@[\w.-]+\/video\/\d+|v\/\d+|t\/\w+|[A-Za-z0-9-_]+)(?:\?.*)?|posts\.cv\/([A-Za-z0-9_]+)\/([A-Za-z0-9]+)(?:\?.*)?|news\.ycombinator\.com\/item\?id=\d+(?:\?.*)?|dribbble\.com\/shots\/([A-Za-z0-9-_]+)(?:\?.*)?|bsky\.app\/([A-Za-z0-9_]+)\/([A-Za-z0-9]+)(?:\?.*)?|bsky\.app\/profile\/([A-Za-z0-9_]+)\/post\/([A-Za-z0-9]+)(?:\?.*)?|reddit\.com\/(?:r\/[^\/]+\/(?:comments|s)\/[A-Za-z0-9]+(?:\/[^\/]*)?(?:\/[^\/]*)?|[A-Za-z0-9]+)(?:\?.*)?|threads\.(?:com|net)\/@[A-Za-z0-9_.]+\/post\/[A-Za-z0-9]+(?:\?.*)?|youtube\.com\/shorts\/([A-Za-z0-9_-]+)(?:\?.*)?|facebook\.com\/[^\s]+)/im;

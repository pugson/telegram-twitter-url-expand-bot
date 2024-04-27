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
    - https://id.tiktok.com/video_id
    - https://en.tiktok.com/video_id
    - https://mobile.tiktok.com/@username/video/video_id
    - https://lite.tiktok.com/@username/video/video_id

   * Posts.cv URLs, in the format:
    - https://posts.cv/username/post_id

   * Hacker News URLs, in the format:
    - https://news.ycombinator.com/item?id=post_id
 */
export const LINK_REGEX: RegExp =
  /https?:\/\/(?:www\.)?(?:mobile\.)?(?:(?:twitter|x)\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)(?:\?.*)?|instagram\.com\/(?:p|reel|stories\/[^\/]+)\/([A-Za-z0-9-_]+)(?:\?.*)?|(?:lite\.|www\.|)?tiktok\.com\/(?:@|v\/)?(\w+)\/(video\/)?(\d+)(?:\?.*)?|(?:vm\.|id\.|en\.|lite\.)tiktok\.com\/([A-Za-z0-9-_]+)(?:\?.*)?|www\.tiktok\.com\/(@[\w.-]+\/video\/\d+|v\/\d+|t\/\w+)(?:\?.*)?|posts\.cv\/([A-Za-z0-9_]+)\/([A-Za-z0-9]+)(?:\?.*)?|news\.ycombinator\.com\/item\?id=\d+(?:\?.*)?)/im;

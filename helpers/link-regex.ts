/** This regex will match the following URL structures:
 * 
 * Twitter status URLs, in the format:
    - https://www.twitter.com/username/status/status_id
    - https://twitter.com/username/status/status_id
    - https://mobile.twitter.com/username/status/status_id
    - https://mobile.twitter.com/username/statuses/status_id
    - https://www.twitter.com/username/statuses/status_id
    
 * Instagram post URLs, in the format:
    - https://twitter.com/username/statuses/status_id
    - https://mobile.instagram.com/p/post_id
    - https://www.instagram.com/p/post_id
    - https://www.instagram.com/reel/post_id
    - https://instagram.com/p/post_id
    - https://instagram.com/reel/post_id
    - https://mobile.instagram.com/reel/post_id

 * TikTok video URLs, in the format:
    - https://www.tiktok.com/@username/video/video_id
    - https://tiktok.com/@username/video/video_id
    - https://vm.tiktok.com/video_id
    - https://id.tiktok.com/video_id
    - https://en.tiktok.com/video_id
    - https://mobile.tiktok.com/@username/video/video_id
 */
export const LINK_REGEX: RegExp =
  /https?:\/\/(?:www\.)?(?:mobile\.)?(?:twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)|instagram\.com\/(?:p|reel)\/([A-Za-z0-9-_]+)|tiktok\.com\/@(\w+)\/video\/(\d+)|(?:vm\.|id\.|en\.)tiktok\.com\/([A-Za-z0-9-_]+))/gim;

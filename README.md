# Link Expander — Telegram Bot for expanding Twitter, Instagram, TikTok, Spotify, Reddit, Bluesky, Hacker News, and Dribbble links.

![banner-4 1@1x](https://user-images.githubusercontent.com/6843656/214646426-db3bf292-afc4-4729-8e16-64ed687127aa.png)

Some Twitter links stopped expanding inside Telegram which made it extremely annoying when you wanted to send a banger tweet to your homies in the group chat. This bot replies with an alternative [fxtwitter.com](https://fxtwitter.com) URL which has a working embed for multiple photos and even includes inline video.

## Supported platforms

- _Twitter / X_ using [fxtwitter.com](https://fxtwitter.com)
- _Instagram_ using [ddinstagram.com](https://ddinstagram.com) (doesn’t work with Stories or Highlights yet.)
- _TikTok_ using [tfxktok.com](https://tfxktok.com)
- _Bluesky_ using [fxbsky.app](https://fxbsky.app)
- _Reddit_ using [rxddit.com](https://rxddit.com)
- _Hacker News_ using a custom API
- _Dribbble_ using [dribbbletv.com](https://dribbbletv.com)
- _Posts.cv_ using [postscv.com](https://postscv.com)
- _Spotify_ using a custom API

## ✨🆕✨ Support for Spotify links!

When you send a Spotify link, the bot will reply with a photo of the artwork and info about the track / album / playlist / artist / podcast / show.
It will also send a sample audio clip in another message.

## Hacker News links! (not in channels yet)

You can now expand Hacker News links. It will reply with the original YCombinator URL, the link shared in a HN post, and the title of the submission.

<img width="500" alt="CleanShot 2024-01-09 at 09 15 18 PM@2x" src="https://github.com/pugson/telegram-twitter-url-expand-bot/assets/6843656/83122b1e-3739-4bdb-8ba8-f144d5b118ff">

## ✨🆕✨ Bot now works in Telegram Channels!

When you add this bot to your channel it will automatically edit any message that includes a supported platform and replace the link in that message with one of the working embeds for each platform. Your channel subscribers will finally be able to watch inline videos and photos without leaving Telegram.

> [!NOTE]
>
> There is no message logging or personal tracking — your chats stay private.
>
> The exact source code that’s published on GitHub is automatically [deployed to Railway](https://railway.app?referralCode=dev) and logs will never include any user/chat/personal info or content. You can audit the code to see for yourself.

## Demo

https://user-images.githubusercontent.com/6843656/182036672-5b566200-cba4-462d-ba5c-4c043e032b06.mp4

## How to use this bot?

### Channels

1. Find it on Telegram as `@TwitterLinkExpanderBot` or click here: https://t.me/twitterlinkexpanderbot?start=start
2. Add it to your channel as admin with the `Edit messages of others` permission.
3. Send a message that includes a tweet, TikTok, or Instagram URL.

### Groups or DMs

1. Find it on Telegram as `@TwitterLinkExpanderBot` or click here: https://t.me/twitterlinkexpanderbot?start=start
2. Add it to your group chat.
3. Send a message that includes a tweet, TikTok, or Instagram URL.
4. Click "Yes" or "No" when the bot replies to your message.
5. Configure automatically expanding links in your group chat by sending `/autoexpand` and changing your settings.

<img width="253" alt="image" src="https://user-images.githubusercontent.com/6843656/181651653-a6421462-2321-4344-8605-f5f32edc5047.png">

## Do you read all messages inside the chat?

🙅‍♂️ **No, I will never do that.** 🙅‍♂️

While it is technically possible through the Bot API, I simply do not have the time or desire to snoop on your shit. The only thing I will keep track of is counting anonymous events when buttons are clicked, bot commands are used, a tweet has multiple images (etc.) to monitor stats to see if people are finding this bot useful.

<img width="593" alt="image" src="https://user-images.githubusercontent.com/6843656/197364188-850c89fa-1186-4f44-a6b1-be6798c88f6e.png">

# Thanks

This bot wouldn't be possible without the following people and projects. Huge thanks to:

- [@dylanpdx](https://github.com/dylanpdx) for creating [BetterTwitFix](https://github.com/dylanpdx/BetterTwitFix) / [vxtwitter.com](https://vxtwitter.com)
- [@Wikidepia](https://github.com/Wikidepia) for creating [InstaFix](https://github.com/Wikidepia/InstaFix) / [ddinstagram.com](https://ddinstagram.com)
- [fxtwitter.com](https://fxtwitter.com) / [FixTweet](https://github.com/FixTweet/FixTweet)
- [@allanf181](https://github.com/allanf181) for creating [tfxktok.com](https://tfxktok.com)
- [@fxbsky.app](https://bsky.app/profile/fxbsky.app) for creating [fxbsky.app](https://fxbsky.app)
- [@MinnDevelopment](https://github.com/MinnDevelopment/fxreddit) for creating [rxddit.com](https://rxddit.com)

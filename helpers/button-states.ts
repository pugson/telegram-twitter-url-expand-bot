import { InlineKeyboardButton } from "grammy/types";

type Platform = "twitter" | "instagram" | "tiktok" | "reddit" | "instagram-share" | "threads" | "youtube" | "facebook";

type ButtonState = {
  buttons: InlineKeyboardButton[][];
  nextTimeout: number | null;
};

/**
 * Get button state for a platform based on time remaining
 * @param platform Platform (twitter, instagram, tiktok, reddit, threads)
 * @param timeRemaining Time remaining in seconds, or null for final state
 * @param userId User ID for analytics
 * @param url URL to open
 * @param showUndo Whether to show the Undo button
 * @param showSwitch Whether to show the "Embed not working?" button
 * @returns Button state with buttons and next timeout
 */
export function getButtonState(
  platform: Platform,
  timeRemaining: number | null,
  userId: number,
  url: string,
  showUndo: boolean = true,
  showSwitch: boolean = true
): ButtonState {
  const platformName =
    platform === "twitter"
      ? "Twitter"
      : platform.includes("instagram")
      ? "Instagram"
      : platform === "tiktok"
      ? "TikTok"
      : platform === "reddit"
      ? "Reddit"
      : platform === "threads"
      ? "Threads"
      : platform === "youtube"
      ? "YouTube"
      : platform === "facebook"
      ? "Facebook"
      : "...";
  const baseButtons: InlineKeyboardButton[] = [
    {
      text: `🔗 Open on ${platformName}`,
      url,
    },
  ];

  // Final state - just show open button
  if (timeRemaining === null) {
    return {
      buttons: [baseButtons],
      nextTimeout: null,
    };
  }

  // Add undo button if not in final state
  const buttonsWithUndo = [
    ...(showUndo
      ? [
          {
            text: "↩️ Undo",
            callback_data: `undo:${userId}`,
          },
        ]
      : []),
    ...baseButtons,
  ];

  const fixButton: InlineKeyboardButton = {
    text: "🖼 Embed not working?",
    callback_data: `switch:${userId}:${platform}`,
  };

  const isSupportedPlatform = ["twitter", "instagram", "tiktok", "instagram-share", "facebook"].includes(platform);
  const rows: InlineKeyboardButton[][] = [];

  // If we have time remaining, add countdown
  if (timeRemaining > 0) {
    rows.push([
      {
        text: `❌ Delete ${timeRemaining}s`,
        callback_data: `destruct:${userId}:${timeRemaining}`,
      },
      ...buttonsWithUndo,
    ]);
  } else {
    // No time remaining but not final state
    rows.push(buttonsWithUndo);
  }

  if (isSupportedPlatform && showSwitch) {
    rows.push([fixButton]);
  }

  return {
    buttons: rows,
    // Countdown 15 → 10 → 5 → 0, then stop. Re-sending the 0 state would
    // be an identical edit that Telegram rejects as "message is not modified".
    nextTimeout: timeRemaining === 15 ? 10 : timeRemaining === 10 ? 5 : timeRemaining === 5 ? 0 : null,
  };
}

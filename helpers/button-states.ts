import { InlineKeyboardButton } from "@grammyjs/types";

type Platform = "twitter" | "instagram" | "tiktok" | "reddit" | "instagram-share" | "threads" | "youtube";

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
 * @returns Button state with buttons and next timeout
 */
export function getButtonState(
  platform: Platform,
  timeRemaining: number | null,
  userId: number,
  url: string
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
    {
      text: "↩️ Undo",
      callback_data: "undo",
    },
    ...baseButtons,
  ];

  // If we have time remaining, add countdown
  if (timeRemaining > 0) {
    return {
      buttons: [
        [
          {
            text: `❌ Delete ${timeRemaining}s`,
            callback_data: `destruct:${userId}:${timeRemaining}`,
          },
          ...buttonsWithUndo,
        ],
      ],
      nextTimeout: timeRemaining === 15 ? 10 : timeRemaining === 10 ? 5 : 0,
    };
  }

  // No time remaining but not final state
  return {
    buttons: [buttonsWithUndo],
    nextTimeout: null,
  };
}

import { InlineKeyboardButton } from "@grammyjs/types";

type Platform = "twitter" | "instagram" | "tiktok" | "reddit" | "instagram-share" | "threads" | "youtube";

type ButtonState = {
  buttons: InlineKeyboardButton[][];
  nextTimeout: number | null;
};

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

  if (timeRemaining === null) {
    return {
      buttons: [baseButtons],
      nextTimeout: null,
    };
  }

  const buttonsWithUndo = [
    {
      text: "↩️ Undo",
      callback_data: "undo",
    },
    ...baseButtons,
  ];

  const fixButton: InlineKeyboardButton = {
      text: "🖼 Embed not working?",
      callback_data: `switch:${userId}:${platform}`
  };

  const isSupportedPlatform = ["twitter", "instagram", "tiktok", "instagram-share"].includes(platform);
  const rows: InlineKeyboardButton[][] = [];

  if (timeRemaining > 0) {
    rows.push([
      {
        text: `❌ Delete ${timeRemaining}s`,
        callback_data: `destruct:${userId}:${timeRemaining}`,
      },
      ...buttonsWithUndo,
    ]);
  } else {
    rows.push(buttonsWithUndo);
  }

  if (isSupportedPlatform) {
    rows.push([fixButton]);
  }

  return {
    buttons: rows,
    nextTimeout: timeRemaining === 15 ? 10 : timeRemaining === 10 ? 5 : 0,
  };
}

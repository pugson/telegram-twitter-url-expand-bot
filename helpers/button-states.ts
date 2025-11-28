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

  const fixButton = {
      text: "Embed not working?",
      callback_data: `switch:${userId}:${platform}`
  };

  if (timeRemaining > 0) {
    const isSupportedPlatform = ["twitter", "instagram", "tiktok", "instagram-share"].includes(platform);
    
    return {
      buttons: [
        [
          {
            text: `❌ Delete ${timeRemaining}s`,
            callback_data: `destruct:${userId}:${timeRemaining}`,
          },
          ...buttonsWithUndo,
        ],
        isSupportedPlatform ? [fixButton] : []
      ],
      nextTimeout: timeRemaining === 30 ? 15 : timeRemaining === 15 ? 0 : 0,
    };
  }

  return {
    buttons: [buttonsWithUndo],
    nextTimeout: null,
  };
}

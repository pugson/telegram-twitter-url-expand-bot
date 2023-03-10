import { Context } from "grammy";
import { bot } from "..";
import { handleMissingPermissions } from "./missing-permissions";

/**
 * Delete a Telegram message in chat.
 * @param chatId Telegram Chat ID
 * @param msgId Telegram Message ID
 * @param ctx Telegram Context
 */
export const deleteMessage = async (chatId: string | number, msgId: number, ctx?: Context) => {
  // Gotta await try/catch this because the original message might have been deleted already, or the bot might not have permission to delete it.
  // Bot will crash if it tries to delete a message that it cannot delete.
  try {
    await bot.api.deleteMessage(chatId, msgId);
  } catch (error) {
    if (ctx) await handleMissingPermissions(ctx);
  }
};

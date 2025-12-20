// Thanks to @borodutch for this snippet.
// https://github.com/backmeupplz/grammy-middlewares/blob/main/src/middlewares/onlyAdmin.ts
import { Context } from "grammy";
import { logger } from "./logger";

export async function checkAdminStatus(ctx: Context) {
  try {
    // No chat = no service
    if (!ctx.chat) {
      return false;
    }
    // Channels and private chats are only postable by admins
    if (["channel", "private"].includes(ctx.chat.type)) {
      return true;
    }
    // Anonymous users are always admins
    if (ctx.from && ctx.from.username === "GroupAnonymousBot") {
      return true;
    }
    // Surely not an admin
    if (!ctx.from || !ctx.from.id) {
      return false;
    }
    // Check the member status
    const chatMember = await ctx.getChatMember(ctx.from.id);
    if (["creator", "administrator"].includes(chatMember.status)) {
      return true;
    }
    // Not an admin by default
    return false;
  } catch (e) {
    logger.error("Unable to check admin status: {error}", { error: e });
    return false;
  }
}

import { Context } from "grammy";
import { notifyAdmin } from "../helpers/notifier";
import { hasPermissionToDeleteMessageTemplate, missingPermissionToDeleteMessageTemplate } from "../helpers/templates";

/**
 * Check if bot has permission to delete messages and send a message if it doesn’t.
 * @param ctx
 * @param fromCommand
 */
export const handleMissingPermissions = async (ctx: Context, fromCommand?: boolean) => {
  try {
    const adminRights = await ctx.api.getMyDefaultAdministratorRights();

    const replyWithMessageAboutPermissions = async (
      template: typeof hasPermissionToDeleteMessageTemplate | typeof missingPermissionToDeleteMessageTemplate
    ) => {
      await ctx.reply(template, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🙅‍♀️ Disable future warnings",
                callback_data: "permissions:disable-warning",
              },
            ],
            [
              {
                text: "✨ Done",
                callback_data: "autoexpand:done",
              },
            ],
          ],
        },
      });
    };

    if (fromCommand) {
      if (adminRights.can_delete_messages) {
        await replyWithMessageAboutPermissions(hasPermissionToDeleteMessageTemplate);
      } else {
        await replyWithMessageAboutPermissions(missingPermissionToDeleteMessageTemplate);
      }

      return;
    }

    if (!adminRights.can_delete_messages) {
      await replyWithMessageAboutPermissions(missingPermissionToDeleteMessageTemplate);
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }
};

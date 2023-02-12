import { Context } from "grammy";
import { notifyAdmin } from "../../helpers/notifier";
import {
  hasPermissionToDeleteMessageTemplate,
  missingPermissionToDeleteMessageTemplate,
} from "../../helpers/templates";

/**
 * Check if bot has permission to delete messages and send a message if it doesn’t.
 * @param ctx
 * @param fromCommand
 */
export const handleMissingPermissions = async (ctx: Context, fromCommand?: boolean) => {
  try {
    const adminRights = await ctx.api.getMyDefaultAdministratorRights();

    if (fromCommand) {
      if (adminRights.can_delete_messages) {
        await ctx.reply(hasPermissionToDeleteMessageTemplate, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✨ Done",
                  callback_data: "autoexpand:done",
                },
              ],
            ],
          },
        });
      } else {
        await ctx.reply(missingPermissionToDeleteMessageTemplate, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✨ Done",
                  callback_data: "autoexpand:done",
                },
              ],
            ],
          },
        });
      }

      return;
    }

    if (!adminRights.can_delete_messages) {
      await ctx.reply(missingPermissionToDeleteMessageTemplate, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✨ Done",
                callback_data: "autoexpand:done",
              },
            ],
          ],
        },
      });
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }
};

import { Context } from "grammy";
import { notifyAdmin } from "../helpers/notifier";
import { hasPermissionToDeleteMessageTemplate, missingPermissionToDeleteMessageTemplate } from "../helpers/templates";
import { getSettings } from "../helpers/api";

/**
 * Check if bot has permission to delete messages and send a message if it doesn’t.
 * @param ctx Telegram Context
 * @param fromCommand Whether the function was called from a command or from a callback.
 */
export const handleMissingPermissions = async (ctx: Context, fromCommand?: boolean) => {
  if (!ctx.chat) return;

  try {
    const adminRights: any = await ctx.getChatMember(ctx.me.id);

    const replyWithMessageAboutPermissions = async (
      template: typeof hasPermissionToDeleteMessageTemplate | typeof missingPermissionToDeleteMessageTemplate
    ) => {
      await ctx.reply(template, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                // TODO: implement this setting in the database
                text: "🙅‍♀️ Disable future warnings",
                callback_data: "permissions:disable-warning",
              },
            ],
            [
              {
                text: "👮 Admin Only: Grant permissions",
                url: "tg://resolve?domain=BotAPITesterBot&startgroup&admin=delete_messages",
              },
            ],
            [
              {
                text: "✨ Done",
                callback_data: "permissions:done",
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
      try {
        const settings = await getSettings(ctx.chat.id);
        if (settings?.ignore_permissions_warning) return;

        await replyWithMessageAboutPermissions(missingPermissionToDeleteMessageTemplate);
      } catch (error) {
        console.error(error);
        notifyAdmin(error);
      }
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }
};

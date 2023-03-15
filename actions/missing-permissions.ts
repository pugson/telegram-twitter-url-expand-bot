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
    const privateChat = ctx?.msg?.chat.type === "private";

    const replyWithMessageAboutPermissions = async (
      template: typeof hasPermissionToDeleteMessageTemplate | typeof missingPermissionToDeleteMessageTemplate
    ) => {
      const topicId = ctx.msg?.message_thread_id;
      await ctx.reply(template, {
        message_thread_id: topicId ?? undefined,
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
                text: "👮 Admin Only: Grant permissions",
                url: "tg://resolve?domain=TwitterLinkExpanderBot&startgroup&admin=delete_messages",
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
        if (settings?.ignore_permissions_warning || privateChat) return;

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

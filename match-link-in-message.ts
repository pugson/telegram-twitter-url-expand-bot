import { Context } from "grammy";
import { bot } from ".";

// TODO:
// delete message only if it’s a text message
// do not delete photos, videos, etc.
bot.on("message::url", async (ctx: Context) => {
  if (!ctx.msg) return;

  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  const lastName = ctx.from?.last_name;
  const userId = ctx.from?.id;

  const message = ctx.msg.text ?? ctx.msg.caption ?? "";
  const entities = ctx.entities();
  const justTextMessage = entities.reduce((msg, entity) => msg.replace(entity.text, ""), message);

  entities.forEach((entity) => {
    const url = entity.text;

    if (username) {
      ctx.reply(`@${username}: ${justTextMessage}
${url}`);
    } else if (firstName || lastName) {
      const bothNames = firstName && lastName;
      const nameTemplate = bothNames ? `${firstName} ${lastName}` : firstName ?? lastName;

      ctx.reply(
        `<a href="tg://user?id=${userId}">${nameTemplate}</a>: ${justTextMessage}
${url}`,
        {
          parse_mode: "HTML",
        }
      );
    }
  });
});

import { bot } from "../..";

bot.command("start", async (ctx) => {
  ctx.reply("welcome");
});

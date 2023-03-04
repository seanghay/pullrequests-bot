import { Telegraf } from "telegraf";
import { marked } from 'marked';
import { createHmac } from 'node:crypto'

export function createSignedURL(key, chatId) {
  chatId = chatId.toString()
  const hash = createHmac('sha1', key).update(chatId).digest('hex');
  return `${process.env.BASE_API_URL}api/webhook/${chatId}/${hash}`;
}

export function markdown(value) {
  return marked.parseInline(value)
}

export default async function (req, res) {
  const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
  
  // create a signed webhook url that can be used in GitHub webhook
  bot.start(async ctx => {
    await ctx.replyWithHTML(markdown([
      `**Welcome to Pull Requests Bot**`,
      `Here is your private webhook URL liked to your chatroom ID that you can use for your GitHub repo.`,
      `\`${createSignedURL(process.env.TELEGRAM_TOKEN, ctx.message.chat.id)}\``
    ].join('\n')));
  });

  await bot.handleUpdate(req.body);
  res.status(200).send("OK");
}
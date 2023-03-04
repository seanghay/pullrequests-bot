import { Telegraf } from 'telegraf';
import { createHmac, timingSafeEqual } from 'node:crypto'
import { marked } from 'marked';

export function verifySignedURL(key, chatId, hash) {
  try {
    const chatIdInteger = parseInt(chatId);
    if (Number.isNaN(chatIdInteger)) return;
    if (typeof hash !== 'string' || hash.length !== 40) return;

    const expect = createHmac('sha1', key)
      .update(chatId)
      .digest('hex');

    if (timingSafeEqual(Buffer.from(expect), Buffer.from(hash))) {
      return chatIdInteger;
    }

  } catch (e) {
    return;
  }
}

export default async function (req, res) {

  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { chatId, hash } = req.query;
  const id = verifySignedURL(process.env.TELEGRAM_TOKEN, chatId, hash);

  if (id) {
    const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

    if (req.body.hook) {
      const { repository } = req.body;
      await bot.telegram.sendMessage(
        id,
        marked.parseInline(
          `✅ Webhook has been added to [${repository.full_name}](${repository.html_url})`
        ),
        { parse_mode: 'HTML' }
      )
      res.status(200).json({ msg: 'ok' });
      return;
    }

    const { repository, pull_request, action } = req.body;

    if (!['opened', 'closed'].includes(action)) {
      res.status(200).json({ msg: 'ignored' });
      return;
    }

    const icon = action === 'opened' ? '🟠' : '✅'
    const md = `${icon} ${pull_request.user.login} ${action} a pull request [${pull_request.title}](${pull_request.html_url})` +
      ` in [${repository.name}](${repository.html_url}) into \`${pull_request.base.ref}\` from \`${pull_request.head.ref}\`.\n`;
    const html = marked.parseInline(md);
    await bot.telegram.sendMessage(id, html, {
      parse_mode: "HTML"
    });

    // respond
    res.status(200).json({ msg: 'ok' });
    return;
  }

  res.status(400).end();
}
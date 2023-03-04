export default async function(req, res) {
  res.json({
    time: Date.now(),
    token: process.env.TELEGRAM_TOKEN.slice(-6)
   })
}
import config from '../config.js'
import { getTime, getDate, formatUptime } from '../lib/utils.js'

let _startTime = null

const getUptime = async () => {
  if (!_startTime) {
    try {
      const mod = await import('../index.js')
      _startTime = mod?.startTime || Date.now()
    } catch {
      _startTime = Date.now()
    }
  }
  return formatUptime(Math.floor((Date.now() - _startTime) / 1000))
}

export const commands = {
  menu: async (ctx) => {
    const { reply, pushName, react } = ctx
    const p = config.prefix
    const uptime = await getUptime()

    const menu = `╔══════════════════════════════╗
║  ✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞  ║
╚══════════════════════════════╝
┌──────────────────────────────┐
│  👤 User: ${pushName}
│  🕐 Time: ${getTime()}
│  📅 Date: ${getDate()}
│  ⚡ Prefix: [ ${p} ]
│  ⏱️  Uptime: ${uptime}
└──────────────────────────────┘

╭─── 📥 DOWNLOADER ───╮
│  ${p}ytmp3  — YouTube Audio
│  ${p}ytmp4  — YouTube Video
│  ${p}tiktok — TikTok Video
│  ${p}ig     — Instagram Reel
╰─────────────────────╯

╭─── 🤖 AI CHAT ───╮
│  ${p}ai  <prompt>
│  ${p}gpt <prompt>
╰───────────────────╯

╭─── 👥 GROUP ───╮
│  ${p}kick      @user
│  ${p}add       <number>
│  ${p}promote   @user
│  ${p}demote    @user
│  ${p}mute    / ${p}unmute
│  ${p}tagall
│  ${p}groupinfo
╰────────────────╯

╭─── 🛡️ OWNER ONLY ───╮
│  ${p}restart
│  ${p}broadcast <text>
│  ${p}setprefix <char>
│  ${p}block     <number>
│  ${p}unblock   <number>
╰─────────────────────╯

━━━━━━━━━━━━━━━━━━━━━━━━
👑 Owner: ${config.ownerNumber || 'Not set'}
🌐 ALMEER MD v5.0 · by SIDER44
━━━━━━━━━━━━━━━━━━━━━━━━`

    await react('👑')
    await reply(menu)
  },
}

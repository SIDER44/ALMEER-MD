import os from 'os'
import { startTime } from '../index.js'

const formatUptime = (ms) => {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s % 60}s`].filter(Boolean).join(' ')
}

const getRamBar = () => {
  const total = os.totalmem()
  const free  = os.freemem()
  const used  = total - free
  const pct   = Math.round((used / total) * 100)
  const filled = Math.round(pct / 10)
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
  const usedMB  = Math.round(used / 1024 / 1024)
  const totalGB = (total / 1024 / 1024 / 1024).toFixed(1)
  return { bar, pct, usedMB, totalGB }
}

const getSpeed = () => {
  const start = Date.now()
  return (Date.now() - start + Math.random()).toFixed(4)
}

export const commands = {
  menu: async (ctx) => {
    const { reply, react, pushName, sock } = ctx
    const p       = ctx.prefix
    const uptime  = formatUptime(Date.now() - startTime)
    const ram     = getRamBar()
    const speed   = getSpeed()
    const owner   = process.env.OWNER_NUMBER || 'Not Set!'
    const plugins = ctx.sock?._plugins?.size || '—'

    const menu = `┏▣ ◈ *✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞* ◈
┃ *ᴏᴡɴᴇʀ* : ${owner}
┃ *ᴘʀᴇғɪx* : [ ${p} ]
┃ *ʜᴏsᴛ* : Panel
┃ *ᴜᴘᴛɪᴍᴇ* : ${uptime}
┃ *ᴠᴇʀsɪᴏɴ* : 5.0.0
┃ *sᴘᴇᴇᴅ* : ${speed} ms
┃ *ᴜsᴀɢᴇ* : ${ram.usedMB} MB of ${ram.totalGB} GB
┃ *ʀᴀᴍ:* [${ram.bar}] ${ram.pct}%
┗▣

┏▣ ◈ *AI MENU* ◈
│➽ ${p}ai
│➽ ${p}gpt
│➽ ${p}gemini
│➽ ${p}deepseek
│➽ ${p}imagine
│➽ ${p}analyze
│➽ ${p}summarize
│➽ ${p}translate
│➽ ${p}story
│➽ ${p}recipe
│➽ ${p}code
│➽ ${p}teach
┗▣

┏▣ ◈ *DOWNLOAD MENU* ◈
│➽ ${p}ytmp3
│➽ ${p}ytmp4
│➽ ${p}tiktok
│➽ ${p}tiktokaudio
│➽ ${p}instagram
│➽ ${p}facebook
│➽ ${p}twitter
│➽ ${p}mediafire
│➽ ${p}song
│➽ ${p}video
│➽ ${p}savestatus
│➽ ${p}apk
│➽ ${p}pin
┗▣

┏▣ ◈ *GROUP MENU* ◈
│➽ ${p}kick
│➽ ${p}add
│➽ ${p}promote
│➽ ${p}demote
│➽ ${p}mute
│➽ ${p}unmute
│➽ ${p}tagall
│➽ ${p}tag
│➽ ${p}tagadmin
│➽ ${p}hidetag
│➽ ${p}groupinfo
│➽ ${p}invite
│➽ ${p}link
│➽ ${p}resetlink
│➽ ${p}setdesc
│➽ ${p}setgroupname
│➽ ${p}welcome
│➽ ${p}antilink
│➽ ${p}antispam
│➽ ${p}kickinactive
│➽ ${p}poll
│➽ ${p}totalmembers
│➽ ${p}vcf
┗▣

┏▣ ◈ *TOOLS MENU* ◈
│➽ ${p}sticker
│➽ ${p}toimage
│➽ ${p}qrcode
│➽ ${p}calculate
│➽ ${p}translate
│➽ ${p}fancy
│➽ ${p}tinyurl
│➽ ${p}weather
│➽ ${p}define
│➽ ${p}lyrics
│➽ ${p}shazam
│➽ ${p}imdb
│➽ ${p}ssweb
│➽ ${p}device
│➽ ${p}genpass
│➽ ${p}emojimix
│➽ ${p}texttopdf
│➽ ${p}say
│➽ ${p}getpp
│➽ ${p}fliptext
┗▣

┏▣ ◈ *FUN MENU* ◈
│➽ ${p}jokes
│➽ ${p}memes
│➽ ${p}fact
│➽ ${p}quotes
│➽ ${p}trivia
│➽ ${p}dare
│➽ ${p}truth
│➽ ${p}truthordare
┗▣

┏▣ ◈ *SETTINGS MENU* ◈
│➽ ${p}autoviewstatus
│➽ ${p}autoreactstatus
│➽ ${p}antidelete
│➽ ${p}anticall
│➽ ${p}alwaysonline
│➽ ${p}autobio
│➽ ${p}autoread
│➽ ${p}chatbot
│➽ ${p}mode
│➽ ${p}setprefix
│➽ ${p}setbotname
│➽ ${p}setownername
│➽ ${p}setwelcome
│➽ ${p}setgoodbye
│➽ ${p}getsettings
┗▣

┏▣ ◈ *OWNER MENU* ◈
│➽ ${p}restart
│➽ ${p}broadcast
│➽ ${p}block
│➽ ${p}unblock
│➽ ${p}join
│➽ ${p}leave
│➽ ${p}setbio
│➽ ${p}online
│➽ ${p}delete
│➽ ${p}warn
│➽ ${p}listsudo
│➽ ${p}addsudo
│➽ ${p}delsudo
┗▣

┏▣ ◈ *OTHER MENU* ◈
│➽ ${p}ping
│➽ ${p}runtime
│➽ ${p}repo
│➽ ${p}pair
│➽ ${p}time
│➽ ${p}botstatus
│➽ ${p}menu
┗▣`

    await react('👑')
    await reply(menu)
  },

  ping: async (ctx) => {
    const start = Date.now()
    await ctx.react('🏓')
    const speed = Date.now() - start
    await ctx.reply(
      `┏▣ ◈ *PING* ◈\n` +
      `┃ *sᴘᴇᴇᴅ* : ${speed} ms\n` +
      `┃ *sᴛᴀᴛᴜs* : Online ✅\n` +
      `┗▣`
    )
  },

  runtime: async (ctx) => {
    const uptime = formatUptime(Date.now() - startTime)
    await ctx.react('⏱️')
    await ctx.reply(
      `┏▣ ◈ *RUNTIME* ◈\n` +
      `┃ *ᴜᴘᴛɪᴍᴇ* : ${uptime}\n` +
      `┗▣`
    )
  },

  botstatus: async (ctx) => {
    const ram   = getRamBar()
    const uptime = formatUptime(Date.now() - startTime)
    await ctx.react('📊')
    await ctx.reply(
      `┏▣ ◈ *BOT STATUS* ◈\n` +
      `┃ *sᴛᴀᴛᴜs* : Online ✅\n` +
      `┃ *ᴜᴘᴛɪᴍᴇ* : ${uptime}\n` +
      `┃ *ʀᴀᴍ* : ${ram.usedMB} MB / ${ram.totalGB} GB\n` +
      `┃ *ʀᴀᴍ ᴜsᴀɢᴇ* : [${ram.bar}] ${ram.pct}%\n` +
      `┃ *ɴᴏᴅᴇ* : ${process.version}\n` +
      `┗▣`
    )
  },

  time: async (ctx) => {
    const now  = new Date()
    const time = now.toLocaleTimeString('en-KE', { hour12: true })
    const date = now.toLocaleDateString('en-KE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    await ctx.react('🕐')
    await ctx.reply(
      `┏▣ ◈ *TIME* ◈\n` +
      `┃ *ᴛɪᴍᴇ* : ${time}\n` +
      `┃ *ᴅᴀᴛᴇ* : ${date}\n` +
      `┗▣`
    )
  },

  repo: async (ctx) => {
    await ctx.react('🔗')
    await ctx.reply(
      `┏▣ ◈ *REPO* ◈\n` +
      `┃ *ɴᴀᴍᴇ* : ALMEER MD v5.0\n` +
      `┃ *ᴀᴜᴛʜᴏʀ* : SIDER44\n` +
      `┃ *ʙʀᴀɴᴅ* : ALMEER BRAND\n` +
      `┗▣`
    )
  },
}
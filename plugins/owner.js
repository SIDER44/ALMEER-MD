import config, { setPrefix } from '../config.js'
import logger from '../lib/logger.js'

const requireOwner = async (ctx) => {
  if (!ctx.isOwner) {
    await ctx.react('🚫')
    await ctx.reply('🚫 This command is for the *owner only*.')
    return false
  }
  return true
}

const restart = async (ctx) => {
  if (!await requireOwner(ctx)) return
  await ctx.react('🔄')
  await ctx.reply('🔄 Restarting ALMEER MD...')
  setTimeout(() => process.exit(0), 1500)
}

const broadcast = async (ctx) => {
  if (!await requireOwner(ctx)) return
  const { sock, args, reply, react } = ctx

  const text = args.join(' ')
  if (!text) return reply(`❌ Usage: ${ctx.prefix}broadcast <message>`)

  await react('📢')

  try {
    const contacts = await sock.onWhatsApp(...[])
    // Fetch all chats from store (best-effort)
    const chats = Object.keys(sock.chats || {})

    if (!chats.length) {
      return reply('⚠️ No contacts found in store. Broadcast works best after the bot has been active for a while.')
    }

    let sent = 0
    for (const jid of chats) {
      if (!jid.endsWith('@s.whatsapp.net')) continue
      try {
        await sock.sendMessage(jid, { text: `📢 *ALMEER MD BROADCAST*\n\n${text}` })
        sent++
        await new Promise((r) => setTimeout(r, 500)) // rate limit
      } catch {}
    }

    await react('✅')
    await reply(`✅ Broadcast sent to ${sent} contact(s).`)
  } catch (e) {
    logger.error('Broadcast error', e)
    await react('❌')
    await reply(`❌ Broadcast failed: ${e.message}`)
  }
}

const setprefix = async (ctx) => {
  if (!await requireOwner(ctx)) return
  const { args, reply, react } = ctx

  const newPrefix = args[0]
  if (!newPrefix || newPrefix.length > 3) return reply(`❌ Usage: ${ctx.prefix}setprefix <character>\nExample: ${ctx.prefix}setprefix !`)

  setPrefix(newPrefix)
  await react('✅')
  await reply(`✅ Prefix changed to: *${newPrefix}*\nUse ${newPrefix}menu to verify.`)
}

const block = async (ctx) => {
  if (!await requireOwner(ctx)) return
  const { sock, args, reply, react } = ctx

  const number = args[0]?.replace(/[^0-9]/g, '')
  if (!number) return reply(`❌ Usage: ${ctx.prefix}block <number>`)

  await react('⏳')
  try {
    await sock.updateBlockStatus(`${number}@s.whatsapp.net`, 'block')
    await react('✅')
    await reply(`✅ Blocked: +${number}`)
  } catch (e) {
    await react('❌')
    await reply(`❌ Failed to block: ${e.message}`)
  }
}

const unblock = async (ctx) => {
  if (!await requireOwner(ctx)) return
  const { sock, args, reply, react } = ctx

  const number = args[0]?.replace(/[^0-9]/g, '')
  if (!number) return reply(`❌ Usage: ${ctx.prefix}unblock <number>`)

  await react('⏳')
  try {
    await sock.updateBlockStatus(`${number}@s.whatsapp.net`, 'unblock')
    await react('✅')
    await reply(`✅ Unblocked: +${number}`)
  } catch (e) {
    await react('❌')
    await reply(`❌ Failed to unblock: ${e.message}`)
  }
}

export const commands = {
  restart,
  broadcast,
  setprefix,
  block,
  unblock,
}

import { jidNormalizedUser } from '@whiskeysockets/baileys'
import logger from '../lib/logger.js'

// ── Guard helpers ─────────────────────────────────────────────────────────────

const requireGroup = async (ctx) => {
  if (!ctx.isGroup) {
    await ctx.reply('❌ This command only works in groups.')
    return false
  }
  return true
}

const requireAdmin = async (ctx) => {
  const { sock, from, sender } = ctx
  try {
    const meta = await sock.groupMetadata(from)
    const isAdmin = meta.participants.some(
      (p) => jidNormalizedUser(p.id) === jidNormalizedUser(sender) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    const isBotAdmin = meta.participants.some(
      (p) => p.id === sock.user.id && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    return { isAdmin, isBotAdmin, meta }
  } catch {
    return { isAdmin: false, isBotAdmin: false, meta: null }
  }
}

const getMentioned = (msg) => {
  return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
}

// ── Commands ──────────────────────────────────────────────────────────────────

const kick = async (ctx) => {
  const { sock, from, msg, reply, react } = ctx
  if (!await requireGroup(ctx)) return
  const { isAdmin, isBotAdmin } = await requireAdmin(ctx)
  if (!isAdmin && !ctx.isOwner) return reply('❌ You must be a group admin to use this command.')
  if (!isBotAdmin) return reply('❌ I need to be an admin to kick members.')

  const targets = getMentioned(msg)
  if (!targets.length) return reply(`❌ Usage: ${ctx.prefix}kick @user`)

  await react('⏳')
  for (const jid of targets) {
    try {
      await sock.groupParticipantsUpdate(from, [jid], 'remove')
    } catch (e) {
      logger.error(`Failed to kick ${jid}`, e)
    }
  }
  await react('✅')
  await reply(`✅ Kicked ${targets.length} member(s).`)
}

const add = async (ctx) => {
  const { sock, from, args, reply, react } = ctx
  if (!await requireGroup(ctx)) return
  const { isAdmin, isBotAdmin } = await requireAdmin(ctx)
  if (!isAdmin && !ctx.isOwner) return reply('❌ You must be a group admin.')
  if (!isBotAdmin) return reply('❌ I need to be an admin to add members.')

  const number = args[0]?.replace(/[^0-9]/g, '')
  if (!number) return reply(`❌ Usage: ${ctx.prefix}add <number>`)

  await react('⏳')
  try {
    await sock.groupParticipantsUpdate(from, [`${number}@s.whatsapp.net`], 'add')
    await react('✅')
    await reply(`✅ Added @${number} to the group.`, { mentions: [`${number}@s.whatsapp.net`] })
  } catch (e) {
    await react('❌')
    await reply(`❌ Failed to add: ${e.message}`)
  }
}

const promote = async (ctx) => {
  const { sock, from, msg, reply, react } = ctx
  if (!await requireGroup(ctx)) return
  const { isAdmin, isBotAdmin } = await requireAdmin(ctx)
  if (!isAdmin && !ctx.isOwner) return reply('❌ You must be a group admin.')
  if (!isBotAdmin) return reply('❌ I need admin rights to promote members.')

  const targets = getMentioned(msg)
  if (!targets.length) return reply(`❌ Usage: ${ctx.prefix}promote @user`)

  await react('⏳')
  await sock.groupParticipantsUpdate(from, targets, 'promote')
  await react('✅')
  await reply(`✅ Promoted ${targets.length} member(s) to admin.`)
}

const demote = async (ctx) => {
  const { sock, from, msg, reply, react } = ctx
  if (!await requireGroup(ctx)) return
  const { isAdmin, isBotAdmin } = await requireAdmin(ctx)
  if (!isAdmin && !ctx.isOwner) return reply('❌ You must be a group admin.')
  if (!isBotAdmin) return reply('❌ I need admin rights to demote members.')

  const targets = getMentioned(msg)
  if (!targets.length) return reply(`❌ Usage: ${ctx.prefix}demote @user`)

  await react('⏳')
  await sock.groupParticipantsUpdate(from, targets, 'demote')
  await react('✅')
  await reply(`✅ Demoted ${targets.length} member(s).`)
}

const mute = async (ctx) => {
  const { sock, from, reply, react } = ctx
  if (!await requireGroup(ctx)) return
  const { isAdmin, isBotAdmin } = await requireAdmin(ctx)
  if (!isAdmin && !ctx.isOwner) return reply('❌ You must be a group admin.')
  if (!isBotAdmin) return reply('❌ I need admin rights.')

  await react('🔇')
  await sock.groupSettingUpdate(from, 'announcement')
  await reply('🔇 Group muted — only admins can send messages.')
}

const unmute = async (ctx) => {
  const { sock, from, reply, react } = ctx
  if (!await requireGroup(ctx)) return
  const { isAdmin, isBotAdmin } = await requireAdmin(ctx)
  if (!isAdmin && !ctx.isOwner) return reply('❌ You must be a group admin.')
  if (!isBotAdmin) return reply('❌ I need admin rights.')

  await react('🔊')
  await sock.groupSettingUpdate(from, 'not_announcement')
  await reply('🔊 Group unmuted — everyone can send messages.')
}

const groupinfo = async (ctx) => {
  const { sock, from, reply, react } = ctx
  if (!await requireGroup(ctx)) return

  await react('⏳')
  try {
    const meta = await sock.groupMetadata(from)
    const admins = meta.participants.filter((p) => p.admin).length
    const members = meta.participants.length

    const info = `👥 *GROUP INFO*

📌 Name: ${meta.subject}
🆔 ID: ${from}
👤 Members: ${members}
👑 Admins: ${admins}
📅 Created: ${new Date(meta.creation * 1000).toLocaleDateString()}
📝 Description: ${meta.desc || 'No description'}`

    await react('✅')
    await reply(info)
  } catch (e) {
    await react('❌')
    await reply(`❌ Failed to fetch group info: ${e.message}`)
  }
}

const tagall = async (ctx) => {
  const { sock, from, reply, react } = ctx
  if (!await requireGroup(ctx)) return
  const { isAdmin } = await requireAdmin(ctx)
  if (!isAdmin && !ctx.isOwner) return reply('❌ Only admins can tag all.')

  await react('📢')
  try {
    const meta = await sock.groupMetadata(from)
    const members = meta.participants.map((p) => p.id)
    const mentions = members.map((m) => `@${m.split('@')[0]}`).join(' ')

    await sock.sendMessage(from, {
      text: `📢 *TAG ALL*\n\n${mentions}`,
      mentions: members,
    })
    await react('✅')
  } catch (e) {
    await react('❌')
    await reply(`❌ Failed to tag all: ${e.message}`)
  }
}

export const commands = {
  kick,
  add,
  promote,
  demote,
  mute,
  unmute,
  groupinfo,
  tagall,
}

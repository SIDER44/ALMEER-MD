import config from '../config.js'
import { getContentText } from '../lib/utils.js'
import logger from '../lib/logger.js'

// Message cache for path 3 detection
const msgCache = new Map()
const CACHE_LIMIT = 500

export const cacheMessage = (msg) => {
  try {
    if (!msg.message || !msg.key?.id) return
    if (msgCache.size >= CACHE_LIMIT) {
      const firstKey = msgCache.keys().next().value
      msgCache.delete(firstKey)
    }
    msgCache.set(msg.key.id, {
      from: msg.key.remoteJid,
      sender: msg.key.participant || msg.key.remoteJid,
      content: getContentText(msg),
      timestamp: msg.messageTimestamp,
    })
  } catch {}
}

const alertOwner = async (sock, { from, sender, content }) => {
  if (!config.ownerNumber) return
  const ownerJid = `${config.ownerNumber}@s.whatsapp.net`
  try {
    const chatType = from.endsWith('@g.us') ? `Group: ${from}` : 'Private DM'
    await sock.sendMessage(ownerJid, {
      text: `🗑️ *ANTI-DELETE ALERT*\n\n👤 From: @${sender.split('@')[0]}\n📍 In: ${chatType}\n\n📝 *Content:*\n${content}`,
      mentions: [sender],
    })
  } catch (e) {
    logger.error('Anti-delete alert failed', e)
  }
}

export const registerAntiDelete = (sock) => {
  // PATH 1: messages.update with messageStubType === 1 (REVOKE)
  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      try {
        if (update.update?.messageStubType !== 1) continue
        const msgId = update.key?.id
        const cached = msgCache.get(msgId)
        const from = update.key.remoteJid
        const sender = update.key.participant || from
        const content = cached?.content || '[Message not in cache]'
        await alertOwner(sock, { from, sender, content })
        if (msgId) msgCache.delete(msgId)
      } catch (e) {
        logger.error('Anti-delete path 1 error', e)
      }
    }
  })

  // PATH 2: message_delete event (fixed — no TypeScript cast)
  sock.ev.on('message_delete', async (item) => {
    try {
      const key = item?.key || item
      const msgId = key?.id
      const cached = msgCache.get(msgId)
      const from = key?.remoteJid
      const sender = key?.participant || from
      const content = cached?.content || '[Message not in cache]'
      if (from) await alertOwner(sock, { from, sender, content })
      if (msgId) msgCache.delete(msgId)
    } catch (e) {
      logger.error('Anti-delete path 2 error', e)
    }
  })

  // PATH 3: Cache all incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return
    for (const msg of messages) {
      if (msg.message) cacheMessage(msg)
    }
  })

  logger.success('Anti-delete registered (3 detection paths)')
}

// No commands — passive plugin
export const commands = {}

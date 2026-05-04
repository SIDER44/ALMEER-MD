import { jidNormalizedUser } from '@whiskeysockets/baileys'
import config from '../config.js'

/**
 * Check if a sender JID is the owner
 */
export const isOwner = (sender) => {
  if (!config.ownerNumber) return false
  const ownerJid = jidNormalizedUser(`${config.ownerNumber}@s.whatsapp.net`)
  const senderJid = jidNormalizedUser(sender)
  return ownerJid === senderJid
}

/**
 * Extract plain text body from a Baileys message
 */
export const getBody = (msg) => {
  const m = msg.message
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ''
  )
}

/**
 * Get message content as a string for anti-delete logging
 */
export const getContentText = (msg) => {
  const m = msg.message
  if (!m) return '[unknown message]'
  if (m.conversation) return m.conversation
  if (m.extendedTextMessage) return m.extendedTextMessage.text
  if (m.imageMessage) return `[Image] ${m.imageMessage.caption || ''}`
  if (m.videoMessage) return `[Video] ${m.videoMessage.caption || ''}`
  if (m.audioMessage) return '[Voice Note/Audio]'
  if (m.stickerMessage) return '[Sticker]'
  if (m.documentMessage) return `[Document] ${m.documentMessage.fileName || ''}`
  if (m.contactMessage) return `[Contact] ${m.contactMessage.displayName}`
  if (m.locationMessage) return '[Location]'
  return '[Unsupported message type]'
}

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format uptime in human-readable string
 */
export const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [
    d && `${d}d`,
    h && `${h}h`,
    m && `${m}m`,
    `${s}s`
  ].filter(Boolean).join(' ')
}

/**
 * Sleep for n milliseconds
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Get current time string
 */
export const getTime = () =>
  new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })

/**
 * Get current date string
 */
export const getDate = () =>
  new Date().toLocaleDateString('en-KE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

export { jidNormalizedUser }

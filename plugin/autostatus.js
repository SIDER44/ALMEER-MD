import config from '../config.js'
import logger from '../lib/logger.js'

const STATUS_JID = 'status@broadcast'
const REACT_EMOJIS = ['❤️', '🔥', '😍', '💯', '👑', '🤩', '✨', '🫡']

/**
 * Register auto-status listener on socket.
 * Called from index.js after socket creation.
 */
export const registerAutoStatus = (sock) => {
  if (!config.autoStatus) {
    logger.info('Auto-status is disabled (AUTOSTATUS=false)')
    return
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Status updates arrive as type 'append'
    if (type !== 'append') return

    for (const msg of messages) {
      try {
        if (msg.key.remoteJid !== STATUS_JID) continue
        if (!msg.message) continue

        // Auto-view the status
        await sock.readMessages([msg.key])

        // Auto-react — MUST use msg.key.participant (not remoteJid)
        const reactorJid = msg.key.participant
        if (!reactorJid) continue

        const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)]

        await sock.sendMessage(STATUS_JID, {
          react: {
            text: emoji,
            key: msg.key,
          },
        })

        logger.info(`Auto-reacted ${emoji} to status from ${reactorJid.split('@')[0]}`)
      } catch (e) {
        logger.error('Auto-status error', e)
      }
    }
  })

  logger.success('Auto-status viewer + reactor registered')
}

// No commands — passive plugin
export const commands = {}

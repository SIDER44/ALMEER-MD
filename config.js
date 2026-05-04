// ═══════════════════════════════════════════════════
//  ALMEER MD · config.js
//  Aligned with RIOT2 config structure
// ═══════════════════════════════════════════════════

import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const config = {
  // ── Bot Identity ──────────────────────────────────
  botName:    process.env.BOT_NAME    || '✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞',
  botVersion: process.env.BOT_VERSION || 'v5.0.0',
  developer:  process.env.DEVELOPER   || 'SIDER44',
  prefix:     process.env.PREFIX      || '.',
  mode:       process.env.MODE        || 'public',   // public | private

  // ── Owner ─────────────────────────────────────────
  ownerNumber: (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, ''),
  ownerName:   process.env.OWNER_NAME   || 'Owner',

  // ── Server ────────────────────────────────────────
  port:          parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10),
  apiSecret:     process.env.API_SECRET     || 'almeer-md-secret-change-this',
  dashboardPass: process.env.DASHBOARD_PASS || 'almeermd2024',

  // ── Session & Database ────────────────────────────
  sessionId:  process.env.SESSION_ID || '',
  sessionDir: process.env.SESSION_DIR || './session',
  dbPath:     process.env.DB_PATH    || './database/db.json',

  // ── External APIs ─────────────────────────────────
  groqApiKey: process.env.GROQ_API_KEY || '',

  // ── Features ──────────────────────────────────────
  autoStatus:  process.env.AUTOSTATUS  !== 'false',
  antiCall:    process.env.ANTI_CALL   === 'true',
  autoRead:    process.env.AUTO_READ   !== 'false',
  autoTyping:  process.env.AUTO_TYPING !== 'false',
  logLevel:    process.env.LOG_LEVEL   || 'info',

  // ── Cooldowns (ms) ────────────────────────────────
  cmdCooldown:    parseInt(process.env.CMD_COOLDOWN    || '3000', 10),
  pairCodeExpiry: parseInt(process.env.PAIR_CODE_EXPIRY || '120000', 10),
}

// Allow runtime prefix changes (e.g. via .setprefix command)
export const setPrefix = (newPrefix) => {
  config.prefix = newPrefix
}

export default config

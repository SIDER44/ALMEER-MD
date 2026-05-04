// ═══════════════════════════════════════════════════
//  ALMEER MD · lib/database.js
//  JSON flat-file store — ported from RIOT2
// ═══════════════════════════════════════════════════

import fs   from 'fs-extra'
import path from 'path'
import config from '../config.js'

// ── JSON flat-file store ──────────────────────────
class JSONStore {
  constructor(filePath) {
    this.file  = filePath
    this._data = null
  }

  async _load() {
    if (this._data) return
    await fs.ensureFile(this.file)
    const raw = await fs.readFile(this.file, 'utf-8').catch(() => '{}')
    try   { this._data = JSON.parse(raw) }
    catch { this._data = {}              }
  }

  async _save() {
    await fs.outputFile(this.file, JSON.stringify(this._data, null, 2))
  }

  async get(key) {
    await this._load()
    return this._data[key] ?? null
  }

  async set(key, value) {
    await this._load()
    this._data[key] = value
    await this._save()
    return value
  }

  async del(key) {
    await this._load()
    delete this._data[key]
    await this._save()
  }

  async all() {
    await this._load()
    return { ...this._data }
  }
}

const store = new JSONStore(config.dbPath)

// ── Public API ────────────────────────────────────
export const dbGet = (key)         => store.get(key)
export const dbSet = (key, value)  => store.set(key, value)
export const dbDel = (key)         => store.del(key)
export const dbAll = ()            => store.all()

// ── User helpers ──────────────────────────────────
export async function getUser(number) {
  return (await dbGet(`user:${number}`)) || {
    number,
    premium:      false,
    banned:       false,
    warns:        0,
    commandsUsed: 0,
    joinedAt:     Date.now(),
  }
}

export async function saveUser(number, data) {
  return dbSet(`user:${number}`, data)
}

// ── Group helpers ─────────────────────────────────
export async function getGroup(jid) {
  return (await dbGet(`group:${jid}`)) || {
    jid,
    antilink:    false,
    antibadword: false,
    welcome:     false,
    welcomeMsg:  'Welcome, @user! 🎉',
    goodbye:     false,
    goodbyeMsg:  'Goodbye, @user! 👋',
  }
}

export async function saveGroup(jid, data) {
  return dbSet(`group:${jid}`, data)
}

// ── Settings helpers ──────────────────────────────
export async function getSettings(userId = 'default') {
  return (await dbGet(`settings:${userId}`)) || {
    antidelete: false,
    anticall:   false,
    alwaysonline: false,
  }
}

export async function saveSettings(userId = 'default', data) {
  return dbSet(`settings:${userId}`, data)
}

// ── Init ──────────────────────────────────────────
export async function connectDB() {
  await fs.ensureFile(config.dbPath)
  console.log('  🗄️   JSON database ready →', config.dbPath)
}

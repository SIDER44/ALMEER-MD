import 'dotenv/config'
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  isJidBroadcast,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { readdir } from 'fs/promises'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import chalk from 'chalk'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BOT_NAME    = process.env.BOT_NAME    || '✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞'
const PREFIX      = process.env.PREFIX      || '.'
const PORT        = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000')
const SESSION_ENV = process.env.SESSION_ID  || ''
const AUTO_STATUS = process.env.AUTOSTATUS  !== 'false'

let OWNER_RAW = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '')
let OWNER_JID = OWNER_RAW ? OWNER_RAW + '@s.whatsapp.net' : ''

export const startTime = Date.now()

const SESSION_DIR = path.join(__dirname, 'session')
const CREDS_PATH  = path.join(SESSION_DIR, 'creds.json')

const ts  = () => `[${new Date().toLocaleTimeString('en-KE', { hour12: false })}]`
const log = {
  info:    (m)    => console.log(chalk.blue(`${ts()} [ INFO ]  ${m}`)),
  success: (m)    => console.log(chalk.green(`${ts()} [  OK  ]  ${m}`)),
  warn:    (m)    => console.log(chalk.yellow(`${ts()} [ WARN ]  ${m}`)),
  error:   (m, e) => { console.log(chalk.red(`${ts()} [ ERR  ]  ${m}`)); if (e) console.log(chalk.red(e?.stack || String(e))) },
  cmd:     (s, c) => console.log(chalk.green(`${ts()} [ CMD  ]  ${s} → ${c}`)),
  pair:    (m)    => console.log(chalk.green(`${ts()} [ PAIR ]  ${m}`)),
  session: (m)    => console.log(chalk.yellow(`${ts()} [ SESS ]  ${m}`)),
  plugin:  (m)    => console.log(chalk.blue(`${ts()} [ PLUG ]  ${m}`)),
  divider: ()     => console.log(chalk.blue('━'.repeat(50))),
  bot: () => console.log(chalk.green(`
╔══════════════════════════════════════════╗
║  ✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞              ║
║        WhatsApp MD Bot v5.0.0            ║
║        by SIDER44 — ALMEER BRAND         ║
╚══════════════════════════════════════════╝`)),
}

const plugins     = new Map()
let pluginsLoaded = false

async function loadPlugins() {
  if (pluginsLoaded) return
  pluginsLoaded = true
  const dir = path.join(__dirname, 'plugins')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const files = (await readdir(dir)).filter(f => f.endsWith('.js'))
  for (const file of files) {
    try {
      const mod = await import(`./plugins/${file}`)
      if (mod.commands && typeof mod.commands === 'object') {
        for (const [name, handler] of Object.entries(mod.commands)) {
          plugins.set(name.toLowerCase(), handler)
        }
      }
    } catch (e) {
      log.error(`Plugin load failed: ${file} — ${e.message}`)
    }
  }
  log.success(`${plugins.size} command(s) loaded`)
}

function restoreSession() {
  if (existsSync(CREDS_PATH)) return true
  if (!SESSION_ENV) return false
  try {
    mkdirSync(SESSION_DIR, { recursive: true })
    const b64 = SESSION_ENV.startsWith('ALMEER_MD_')
      ? SESSION_ENV.replace('ALMEER_MD_', '')
      : SESSION_ENV
    writeFileSync(CREDS_PATH, Buffer.from(b64, 'base64').toString('utf-8'))
    log.session('Session restored from SESSION_ID env')
    return true
  } catch (e) {
    log.error('Failed to decode SESSION_ID', e)
    return false
  }
}

const ask = (rl, q) => new Promise(res => rl.question(q, a => res(a.trim())))

async function terminalMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  log.divider()
  console.log(chalk.green('\n  No session found. How do you want to connect?\n'))
  console.log(chalk.yellow('  [ 1 ]  Enter Session ID'))
  console.log(chalk.yellow('  [ 2 ]  Enter Phone Number  (get pairing code)\n'))
  log.divider()

  const choice = await ask(rl, chalk.green('  ➤ Enter choice (1 or 2): '))

  if (choice === '1') {
    log.divider()
    log.session('Session ID format:  ALMEER_MD_xxxxxxxxxx')
    log.session('Get yours from:  http://your-ip:port/session  after pairing')
    log.divider()
    const raw = await ask(rl, chalk.yellow('  ➤ Paste Session ID: '))
    rl.close()
    if (!raw.startsWith('ALMEER_MD_')) {
      log.error('Invalid — must start with ALMEER_MD_')
      process.exit(1)
    }
    try {
      const decoded = Buffer.from(raw.replace('ALMEER_MD_', ''), 'base64').toString('utf-8')
      mkdirSync(SESSION_DIR, { recursive: true })
      writeFileSync(CREDS_PATH, decoded)
      log.session('Session saved!')
      return { method: 'session', number: null }
    } catch (e) {
      log.error('Failed to decode session ID', e)
      process.exit(1)
    }

  } else if (choice === '2') {
    log.divider()
    log.pair('Enter your WhatsApp number with country code — no + sign')
    log.pair('Examples:  254712345678  |  27812345678  |  2348012345678')
    log.divider()
    const num   = await ask(rl, chalk.yellow('  ➤ Enter number: '))
    rl.close()
    const clean = num.replace(/[^0-9]/g, '')
    if (clean.length < 7) {
      log.error('Invalid number. Restart and try again.')
      process.exit(1)
    }
    OWNER_RAW = clean
    OWNER_JID = clean + '@s.whatsapp.net'
    return { method: 'phone', number: clean }

  } else {
    log.warn('Invalid choice. Restart and enter 1 or 2.')
    rl.close()
    process.exit(1)
  }
}

function getBody(msg) {
  const m = msg.message
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  )
}

function getContentPreview(msg) {
  const m = msg.message
  if (!m) return '[unknown]'
  if (m.conversation)        return m.conversation
  if (m.extendedTextMessage) return m.extendedTextMessage.text
  if (m.imageMessage)        return `[Image] ${m.imageMessage.caption || ''}`
  if (m.videoMessage)        return `[Video] ${m.videoMessage.caption || ''}`
  if (m.audioMessage)        return '[Voice/Audio]'
  if (m.stickerMessage)      return '[Sticker]'
  if (m.documentMessage)     return `[File] ${m.documentMessage.fileName || ''}`
  return '[Message]'
}

let retryCount = 0
const MAX_RETRIES = 5
let _sock = null

async function startBot(pairingNumber = null) {
  if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const { version }          = await fetchLatestBaileysVersion()

  log.info(`Baileys v${version.join('.')}   Node ${process.version}`)

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal:              false,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect:            true,
    syncFullHistory:                false,
    shouldIgnoreJid:                () => false,
    getMessage: async () => ({ conversation: '' }),
  })

  _sock = sock
  await loadPlugins()

  if (!sock.authState.creds.registered) {
    const phone = (pairingNumber || OWNER_RAW).replace(/[^0-9]/g, '')
    if (phone) {
      try {
        await new Promise(r => setTimeout(r, 3000))
        const code = await sock.requestPairingCode(phone)
        log.divider()
        console.log(chalk.green('  ╔══════════════════════════════════════════╗'))
        console.log(chalk.green('  ║        ALMEER MD — PAIRING CODE          ║'))
        console.log(chalk.green('  ╠══════════════════════════════════════════╣'))
        console.log(chalk.green('  ║  Number : ') + chalk.yellow(phone.padEnd(32)) + chalk.green('║'))
        console.log(chalk.green('  ║  Code   : ') + chalk.yellow.bold(code.padEnd(32)) + chalk.green('║'))
        console.log(chalk.green('  ╠══════════════════════════════════════════╣'))
        console.log(chalk.green('  ║  WhatsApp → Linked Devices               ║'))
        console.log(chalk.green('  ║  → Link with phone number → Enter code   ║'))
        console.log(chalk.green('  ╚══════════════════════════════════════════╝'))
        log.divider()
      } catch (err) {
        log.error('Pairing code failed: ' + err.message)
        log.warn('Check the number is correct and not already linked')
      }
    }
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'connecting') log.info('Connecting to WhatsApp...')

    if (connection === 'open') {
      retryCount = 0
      try {
        // Auto-detect owner from the linked WhatsApp number
        const me = sock.user?.id
        if (me) {
          const detectedJid = jidNormalizedUser(me)
          const detectedRaw = detectedJid.split('@')[0]
          // Only override if not manually set via .env
          if (!OWNER_RAW || OWNER_RAW === '') {
            OWNER_JID = detectedJid
            OWNER_RAW = detectedRaw
            log.success(`Owner auto-detected: ${OWNER_RAW}`)
          } else {
            log.success(`Owner from env: ${OWNER_RAW}`)
          }
        }
      } catch {}
      log.divider()
      log.success(`${BOT_NAME}  CONNECTED! ✅`)
      log.success(`Commands: ${plugins.size}   Prefix: [ ${PREFIX} ]`)
      log.divider()
      try {
        await sock.sendMessage(OWNER_JID, {
          text:
            `✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞\n\n` +
            `✅ *Bot is now online!*\n` +
            `📦 *Commands:* ${plugins.size}\n` +
            `🔖 *Prefix:* [ ${PREFIX} ]\n` +
            `🟢 *Node:* ${process.version}\n\n` +
            `_Ready to receive commands_ 🚀`,
        })
      } catch {}
    }

    if (connection === 'close') {
      const code   = lastDisconnect?.error?.output?.statusCode
      const reason = DisconnectReason[code] || code
      log.warn(`Disconnected — ${reason}`)
      if (code === DisconnectReason.loggedOut) {
        log.error('Logged out! Clearing session.')
        try { rmSync(SESSION_DIR, { recursive: true, force: true }) } catch {}
        process.exit(1)
      }
      if (retryCount < MAX_RETRIES) {
        retryCount++
        const delay = Math.min(1000 * 2 ** retryCount, 30000)
        log.warn(`Retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s...`)
        setTimeout(startBot, delay)
      } else {
        log.error('Max retries reached. Exiting.')
        process.exit(1)
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  const msgCache = new Map()
  const CACHE_MAX = 500

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      try {
        if (msg.message && msg.key?.id) {
          if (msgCache.size >= CACHE_MAX) msgCache.delete(msgCache.keys().next().value)
          msgCache.set(msg.key.id, msg)
        }

        if (AUTO_STATUS && type === 'append' && msg.key.remoteJid === 'status@broadcast' && msg.message) {
          await sock.readMessages([msg.key])
          if (msg.key.participant) {
            const emojis = ['❤️','🔥','😍','💯','👑','🤩','✨']
            await sock.sendMessage('status@broadcast', {
              react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: msg.key },
            })
          }
          continue
        }

        if (type !== 'notify') continue
        if (!msg.message) continue

        // If message is fromMe (sent from the linked/owner device),
        // only process it if it looks like a command — prevents loops
        if (msg.key.fromMe) {
          const b = getBody(msg)
          if (!b.startsWith(PREFIX)) continue
        }

        const from = msg.key.remoteJid
        if (!from || isJidBroadcast(from)) continue

        // When fromMe — sender is the linked (owner) number itself
        const sender   = msg.key.fromMe
          ? (OWNER_JID || sock.user?.id || msg.key.remoteJid)
          : (msg.key.participant || msg.key.remoteJid)
        const pushName = msg.pushName || (msg.key.fromMe ? 'Owner' : 'User')
        const isGroup  = from.endsWith('@g.us')
        const body     = getBody(msg)
        if (!body.startsWith(PREFIX)) continue

        const parts   = body.slice(PREFIX.length).trim().split(/\s+/)
        const cmdName = parts[0].toLowerCase()
        const args    = parts.slice(1)
        const handler = plugins.get(cmdName)
        if (!handler) continue

        log.cmd(sender.split('@')[0], `${PREFIX}${cmdName}`)

        const isOwner = OWNER_JID
          ? jidNormalizedUser(sender) === jidNormalizedUser(OWNER_JID)
          : false

        const ctx = {
          sock, msg, from, sender, isOwner, isGroup,
          body, args, prefix: PREFIX, pushName,
          reply: (text, opts = {}) => sock.sendMessage(from, { text, ...opts }, { quoted: msg }),
          react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
        }

        await ctx.react('⏳')
        await handler(ctx)
      } catch (e) {
        log.error('Handler error: ' + e.message)
      }
    }
  })

  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      try {
        if (update.update?.messageStubType !== 1 || !OWNER_JID) continue
        const cached  = msgCache.get(update.key?.id)
        const from    = update.key.remoteJid
        const sender  = update.key.participant || from
        await sock.sendMessage(OWNER_JID, {
          text: `🗑️ *DELETED MESSAGE*\n\n👤 From: @${sender.split('@')[0]}\n📍 ${from.endsWith('@g.us') ? 'Group' : 'DM'}\n\n📝 ${cached ? getContentPreview(cached) : '[not cached]'}`,
          mentions: [sender],
        })
      } catch {}
    }
  })

  sock.ev.on('message_delete', async (item) => {
    try {
      const key = item?.key || item
      if (!OWNER_JID || !key?.remoteJid) return
      const cached = msgCache.get(key?.id)
      const from   = key.remoteJid
      const sender = key.participant || from
      await sock.sendMessage(OWNER_JID, {
        text: `🗑️ *DELETED MESSAGE*\n\n👤 From: @${sender.split('@')[0]}\n📍 ${from.endsWith('@g.us') ? 'Group' : 'DM'}\n\n📝 ${cached ? getContentPreview(cached) : '[not cached]'}`,
        mentions: [sender],
      })
    } catch {}
  })

  return sock
}

function startServer() {
  const app = express()
  app.use(express.json())

  app.post('/pair', async (req, res) => {
    const { number } = req.body
    if (!number) return res.status(400).json({ error: 'number is required' })
    if (!_sock)  return res.status(503).json({ error: 'Bot not ready. Wait a moment.' })
    const clean = number.replace(/[^0-9]/g, '')
    if (clean.length < 7) return res.status(400).json({ error: 'Invalid number' })
    if (_sock.authState?.creds?.registered)
      return res.status(400).json({ error: 'Already paired. Restart to re-pair.' })
    try {
      await new Promise(r => setTimeout(r, 3000))
      const code = await _sock.requestPairingCode(clean)
      log.pair(`Web code for ${clean}: ${code}`)
      return res.json({ code })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  })

  app.get('/health', (_, res) => res.json({
    status: 'online', bot: BOT_NAME,
    connected: !!_sock,
    registered: _sock?.authState?.creds?.registered || false,
  }))

  app.get('/session', (_, res) => {
    if (!existsSync(CREDS_PATH))
      return res.status(404).json({ error: 'No session. Pair first.' })
    try {
      const raw = readFileSync(CREDS_PATH, 'utf-8')
      return res.json({ sessionId: `ALMEER_MD_${Buffer.from(raw).toString('base64')}` })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  })

  app.get('/', (_, res) => res.send(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>ALMEER MD</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet"/>
<style>
:root{--c:#00f5ff;--m:#ff00ff;--bg:#050510;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--c);font-family:'Orbitron',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;}
canvas{position:fixed;inset:0;z-index:0;opacity:.1;}
.box{position:relative;z-index:1;width:92%;max-width:460px;border:1px solid rgba(0,245,255,0.2);border-radius:12px;padding:36px 28px;background:rgba(0,245,255,0.03);backdrop-filter:blur(12px);}
h1{text-align:center;font-size:.95rem;color:var(--c);text-shadow:0 0 16px var(--c);line-height:1.7;margin-bottom:4px;}
.sub{text-align:center;font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--m);letter-spacing:3px;margin-bottom:18px;}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--c);margin-right:6px;animation:blink 1.3s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.1}}
.sbar{display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(0,245,255,0.4);margin-bottom:16px;}
.sd{width:7px;height:7px;border-radius:50%;background:#333;flex-shrink:0;}
.sd.ok{background:#00ff88;box-shadow:0 0 6px #00ff88;}
.sd.wait{background:#ffcc00;animation:blink 1s infinite;}
hr{border:none;border-top:1px solid rgba(0,245,255,0.15);margin:16px 0;}
.tabs{display:flex;gap:8px;margin-bottom:18px;}
.tab{flex:1;padding:9px 4px;background:rgba(0,245,255,0.03);border:1px solid rgba(0,245,255,0.15);border-radius:6px;color:rgba(0,245,255,0.4);font-family:'Orbitron',monospace;font-size:.62rem;cursor:pointer;transition:.2s;text-align:center;}
.tab.on{border-color:var(--c);color:var(--c);background:rgba(0,245,255,0.08);}
.pane{display:none;}.pane.on{display:block;}
.lbl{font-size:.58rem;letter-spacing:2px;color:var(--m);margin-bottom:6px;text-transform:uppercase;}
input,textarea{width:100%;background:rgba(0,245,255,0.04);border:1px solid rgba(0,245,255,0.18);border-radius:6px;color:#fff;font-family:'Share Tech Mono',monospace;font-size:.88rem;padding:11px 13px;outline:none;transition:.2s;margin-bottom:12px;resize:none;}
input:focus,textarea:focus{border-color:var(--c);box-shadow:0 0 10px rgba(0,245,255,0.2);}
input::placeholder,textarea::placeholder{color:rgba(0,245,255,0.25);}
button{width:100%;background:linear-gradient(135deg,rgba(0,245,255,0.1),rgba(255,0,255,0.06));border:1px solid var(--c);border-radius:6px;color:var(--c);font-family:'Orbitron',monospace;font-size:.76rem;font-weight:700;letter-spacing:1.5px;padding:12px;cursor:pointer;transition:.2s;}
button:hover{box-shadow:0 0 20px rgba(0,245,255,0.25);}
button:disabled{opacity:.4;cursor:not-allowed;}
button.mag{border-color:var(--m);color:var(--m);margin-bottom:10px;}
.res{display:none;margin-top:16px;border:1px solid var(--c);border-radius:8px;padding:16px;text-align:center;animation:glow 2s ease-in-out infinite;}
@keyframes glow{0%,100%{box-shadow:0 0 16px rgba(0,245,255,0.1)}50%{box-shadow:0 0 32px rgba(0,245,255,0.3)}}
.rlbl{font-size:.56rem;letter-spacing:3px;color:var(--m);margin-bottom:7px;}
.code{font-family:'Orbitron',monospace;font-size:2rem;font-weight:900;color:#fff;letter-spacing:6px;text-shadow:0 0 20px var(--c);}
.small{font-size:.7rem;letter-spacing:1px;word-break:break-all;}
.hint{margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:.62rem;color:rgba(0,245,255,0.5);line-height:1.9;}
.hint b{color:var(--m);}
.err{display:none;margin-top:12px;border:1px solid rgba(255,0,60,.3);border-radius:6px;padding:10px;font-family:'Share Tech Mono',monospace;font-size:.7rem;color:#ff4d6d;text-align:center;}
.copy{margin-top:8px;font-size:.66rem;padding:8px;border-color:var(--m);color:var(--m);}
footer{text-align:center;margin-top:22px;font-family:'Share Tech Mono',monospace;font-size:.54rem;color:rgba(0,245,255,0.18);letter-spacing:2px;}
</style></head><body>
<canvas id="cv"></canvas>
<div class="box">
  <h1>✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞</h1>
  <div class="sub"><span class="dot"></span>PAIRING INTERFACE</div>
  <div class="sbar"><div class="sd" id="sd"></div><span id="st">Checking...</span></div>
  <div class="tabs">
    <div class="tab on" onclick="sw('ph',this)">📱 Phone Number</div>
    <div class="tab" onclick="sw('ss',this)">🔑 Session ID</div>
  </div>
  <div class="pane on" id="pane-ph">
    <div class="lbl">WhatsApp Number</div>
    <input id="num" type="tel" placeholder="e.g. 254712345678  (no + sign)"/>
    <button id="pbtn" onclick="doPair()">⚡ GET PAIRING CODE</button>
    <div class="err" id="perr"></div>
    <div class="res" id="pres">
      <div class="rlbl">PAIRING CODE</div>
      <div class="code" id="pcode">----</div>
      <div class="hint">Open <b>WhatsApp</b> → <b>Linked Devices</b><br/>→ <b>Link with phone number</b><br/>→ Enter code above</div>
    </div>
  </div>
  <div class="pane" id="pane-ss">
    <div class="lbl">Export session</div>
    <button class="mag" onclick="doExport()">🔑 EXPORT SESSION ID</button>
    <div class="lbl">Or paste existing session ID</div>
    <textarea id="ssin" rows="3" placeholder="ALMEER_MD_xxxxxxxxxx..."></textarea>
    <div class="err" id="serr"></div>
    <div class="res" id="sres">
      <div class="rlbl">SESSION ID</div>
      <div class="code small" id="sval"></div>
      <div class="hint">Set as <b>SESSION_ID</b> in .env or Pterodactyl variables.</div>
      <button class="copy" onclick="doCopy()">📋 COPY</button>
    </div>
  </div>
  <footer>ALMEER MD v5.0 · SIDER44</footer>
</div>
<script>
const cv=document.getElementById('cv'),cx=cv.getContext('2d')
function rs(){cv.width=innerWidth;cv.height=innerHeight}rs()
window.onresize=()=>{rs();iD()}
const ch='ALMEERMD✞✠01アイウABCDEF',fsz=14;let dr=[]
function iD(){dr=Array(Math.floor(cv.width/fsz)).fill(1)}iD()
setInterval(()=>{cx.fillStyle='rgba(5,5,16,0.05)';cx.fillRect(0,0,cv.width,cv.height);cx.fillStyle='#00f5ff';cx.font=fsz+'px monospace';dr.forEach((y,i)=>{cx.fillText(ch[Math.floor(Math.random()*ch.length)],i*fsz,y*fsz);if(y*fsz>cv.height&&Math.random()>.975)dr[i]=0;dr[i]++})},40)
async function chk(){try{const d=await(await fetch('/health')).json();const dot=document.getElementById('sd'),txt=document.getElementById('st');if(d.connected){dot.className='sd ok';txt.textContent='Bot connected — ready to pair'}else{dot.className='sd wait';txt.textContent='Bot connecting...'}}catch{document.getElementById('sd').className='sd';document.getElementById('st').textContent='Cannot reach bot'}}
chk();setInterval(chk,5000)
function sw(id,el){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));el.classList.add('on');document.getElementById('pane-'+id).classList.add('on')}
async function doPair(){
  const n=document.getElementById('num').value.trim(),btn=document.getElementById('pbtn'),err=document.getElementById('perr'),res=document.getElementById('pres')
  err.style.display='none';res.style.display='none'
  if(!n||n.replace(/\D/g,'').length<7){err.textContent='⚠ Enter a valid number with country code';err.style.display='block';return}
  btn.disabled=true;btn.textContent='⏳ REQUESTING...'
  try{const d=await(await fetch('/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:n})})).json();if(d.code){document.getElementById('pcode').textContent=d.code;res.style.display='block'}else{err.textContent='⚠ '+(d.error||'Unknown error');err.style.display='block'}}catch{err.textContent='⚠ Network error';err.style.display='block'}
  btn.disabled=false;btn.textContent='⚡ GET PAIRING CODE'
}
async function doExport(){
  const err=document.getElementById('serr'),res=document.getElementById('sres')
  err.style.display='none';res.style.display='none'
  try{const d=await(await fetch('/session')).json();if(d.sessionId){document.getElementById('sval').textContent=d.sessionId;res.style.display='block'}else{err.textContent='⚠ '+(d.error||'No session. Pair first.');err.style.display='block'}}catch{err.textContent='⚠ Failed';err.style.display='block'}
}
function doCopy(){const v=document.getElementById('sval').textContent;navigator.clipboard.writeText(v).then(()=>alert('✅ Copied!')).catch(()=>{const t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);alert('✅ Copied!')})}
document.getElementById('num').onkeypress=e=>{if(e.key==='Enter')doPair()}
</script></body></html>`))

  app.listen(PORT, '0.0.0.0', () => {
    log.info(`Pairing site  → http://0.0.0.0:${PORT}`)
    log.info(`Session export → http://0.0.0.0:${PORT}/session`)
  })
}

async function main() {
  log.bot()
  log.divider()
  log.info('Starting ALMEER MD...')
  log.info(`Prefix: [ ${PREFIX} ]   Auto-status: ${AUTO_STATUS}`)
  log.divider()

  startServer()

  const hasSession = restoreSession()

  if (hasSession) {
    log.session('Session found — connecting...')
    await startBot()
  } else {
    const result = await terminalMenu()
    if (result.method === 'session') {
      await startBot()
    } else {
      log.info('Starting — pairing code in ~3 seconds...')
      await startBot(result.number)
    }
  }
}

main().catch(e => { log.error('Fatal: ' + e.message, e); process.exit(1) })
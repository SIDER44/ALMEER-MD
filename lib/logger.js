import chalk from 'chalk'

const ts = () => chalk.gray(`[${new Date().toLocaleTimeString('en-KE', { hour12: false })}]`)

const logger = {
  // Boot banner
  bot: () => {
    console.log(chalk.bgMagenta.black.bold(`
╔══════════════════════════════════════════╗
║  ✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞              ║
║        WhatsApp MD Bot v5.0.0            ║
║        by SIDER44 — ALMEER BRAND         ║
╚══════════════════════════════════════════╝`))
  },

  // General info — bright blue
  info: (msg) =>
    console.log(`${ts()} ${chalk.bgBlueBright.black(' INFO ')} ${chalk.blueBright(msg)}`),

  // Success — bright green
  success: (msg) =>
    console.log(`${ts()} ${chalk.bgGreenBright.black(' ✓ OK ')} ${chalk.greenBright(msg)}`),

  // Warning — bright yellow
  warn: (msg) =>
    console.log(`${ts()} ${chalk.bgYellow.black('  ⚠   ')} ${chalk.yellowBright(msg)}`),

  // Error — bright red
  error: (msg, err) => {
    console.log(`${ts()} ${chalk.bgRed.white(' ERROR ')} ${chalk.redBright(msg)}`)
    if (err) console.log(chalk.red(err?.stack || err))
  },

  // Command received — magenta
  cmd: (sender, cmd) =>
    console.log(`${ts()} ${chalk.bgMagenta.black('  CMD  ')} ${chalk.magentaBright(sender)} ${chalk.white('→')} ${chalk.cyanBright(cmd)}`),

  // Connection events — cyan
  conn: (msg) =>
    console.log(`${ts()} ${chalk.bgCyan.black(' CONN  ')} ${chalk.cyanBright(msg)}`),

  // Session events — orange (yellow + red mix via hex)
  session: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#FF8C00').black(' SESS  ')} ${chalk.hex('#FFA500')(msg)}`),

  // Pairing — bright magenta/pink
  pair: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#FF00FF').black('  📡   ')} ${chalk.hex('#FF69B4')(msg)}`),

  // Plugin loader — bright purple
  plugin: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#8A2BE2').white(' PLUG  ')} ${chalk.hex('#DA70D6')(msg)}`),

  // Auto-status — teal
  status: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#008080').white(' STAT  ')} ${chalk.hex('#40E0D0')(msg)}`),

  // Anti-delete — red-orange
  antidel: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#FF4500').black(' 🗑️ DEL ')} ${chalk.hex('#FF6347')(msg)}`),

  // Downloader — lime green
  download: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#32CD32').black(' ⬇️ DL  ')} ${chalk.hex('#7FFF00')(msg)}`),

  // AI — electric blue
  ai: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#1E90FF').black('  🤖   ')} ${chalk.hex('#00BFFF')(msg)}`),

  // Group actions — gold
  group: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#FFD700').black(' 👥 GRP ')} ${chalk.hex('#FFEC8B')(msg)}`),

  // Owner commands — deep pink
  owner: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#C71585').white(' 👑 OWN ')} ${chalk.hex('#FF1493')(msg)}`),

  // Server/Express — indigo
  server: (msg) =>
    console.log(`${ts()} ${chalk.bgHex('#4B0082').white('  🌐   ')} ${chalk.hex('#9370DB')(msg)}`),

  // Terminal prompt styling helper
  prompt: (msg) => console.log(chalk.hex('#00FFFF').bold(msg)),
  choice: (msg) => console.log(chalk.hex('#FF00FF')(msg)),
  input:  (msg) => chalk.hex('#00FF7F').bold(msg),
  divider: () => console.log(chalk.hex('#444444')('━'.repeat(50))),
}

export default logger

// In-memory settings store
export const settings = {
  autoviewstatus:  process.env.AUTOSTATUS !== 'false',
  autoreactstatus: true,
  antidelete:      true,
  anticall:        false,
  alwaysonline:    false,
  autobio:         false,
  autoread:        false,
  chatbot:         false,
  mode:            'public',
  prefix:          process.env.PREFIX || '.',
  botname:         process.env.BOT_NAME || '✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞',
  ownername:       'SIDER44',
}

const toggle = async (ctx, key, label) => {
  if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
  settings[key] = !settings[key]
  await ctx.react(settings[key] ? '✅' : '❌')
  await ctx.reply(
    `┏▣ ◈ *SETTINGS* ◈\n` +
    `┃ *${label}* : ${settings[key] ? 'Enabled ✅' : 'Disabled ❌'}\n` +
    `┗▣`
  )
}

export const commands = {
  autoviewstatus:  (ctx) => toggle(ctx, 'autoviewstatus',  'ᴀᴜᴛᴏ ᴠɪᴇᴡ sᴛᴀᴛᴜs'),
  autoreactstatus: (ctx) => toggle(ctx, 'autoreactstatus', 'ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ sᴛᴀᴛᴜs'),
  antidelete:      (ctx) => toggle(ctx, 'antidelete',      'ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ'),
  anticall:        (ctx) => toggle(ctx, 'anticall',        'ᴀɴᴛɪ ᴄᴀʟʟ'),
  alwaysonline:    (ctx) => toggle(ctx, 'alwaysonline',    'ᴀʟᴡᴀʏs ᴏɴʟɪɴᴇ'),
  autobio:         (ctx) => toggle(ctx, 'autobio',         'ᴀᴜᴛᴏ ʙɪᴏ'),
  autoread:        (ctx) => toggle(ctx, 'autoread',        'ᴀᴜᴛᴏ ʀᴇᴀᴅ'),
  chatbot:         (ctx) => toggle(ctx, 'chatbot',         'ᴄʜᴀᴛ ʙᴏᴛ'),

  mode: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
    const m = ctx.args[0]?.toLowerCase()
    if (!['public', 'private'].includes(m))
      return ctx.reply(`❌ Usage: ${ctx.prefix}mode public/private`)
    settings.mode = m
    await ctx.react('✅')
    await ctx.reply(
      `┏▣ ◈ *MODE* ◈\n` +
      `┃ *ᴍᴏᴅᴇ* : ${m} ✅\n` +
      `┗▣`
    )
  },

  setprefix: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
    const p = ctx.args[0]
    if (!p || p.length > 3) return ctx.reply(`❌ Usage: ${ctx.prefix}setprefix <char>`)
    settings.prefix = p
    await ctx.react('✅')
    await ctx.reply(`┏▣ ◈ *PREFIX* ◈\n┃ Changed to: *${p}*\n┗▣`)
  },

  setbotname: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
    const name = ctx.args.join(' ')
    if (!name) return ctx.reply(`❌ Usage: ${ctx.prefix}setbotname <name>`)
    settings.botname = name
    await ctx.react('✅')
    await ctx.reply(`┏▣ ◈ *BOT NAME* ◈\n┃ Changed to: *${name}*\n┗▣`)
  },

  setownername: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
    const name = ctx.args.join(' ')
    if (!name) return ctx.reply(`❌ Usage: ${ctx.prefix}setownername <name>`)
    settings.ownername = name
    await ctx.react('✅')
    await ctx.reply(`┏▣ ◈ *OWNER NAME* ◈\n┃ Changed to: *${name}*\n┗▣`)
  },

  getsettings: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
    await ctx.react('⚙️')
    await ctx.reply(
      `┏▣ ◈ *SETTINGS* ◈\n` +
      `┃ *ᴀᴜᴛᴏᴠɪᴇᴡsᴛᴀᴛᴜs* : ${settings.autoviewstatus ? '✅' : '❌'}\n` +
      `┃ *ᴀᴜᴛᴏʀᴇᴀᴄᴛsᴛᴀᴛᴜs* : ${settings.autoreactstatus ? '✅' : '❌'}\n` +
      `┃ *ᴀɴᴛɪᴅᴇʟᴇᴛᴇ* : ${settings.antidelete ? '✅' : '❌'}\n` +
      `┃ *ᴀɴᴛɪᴄᴀʟʟ* : ${settings.anticall ? '✅' : '❌'}\n` +
      `┃ *ᴀʟᴡᴀʏsᴏɴʟɪɴᴇ* : ${settings.alwaysonline ? '✅' : '❌'}\n` +
      `┃ *ᴀᴜᴛᴏʀᴇᴀᴅ* : ${settings.autoread ? '✅' : '❌'}\n` +
      `┃ *ᴄʜᴀᴛʙᴏᴛ* : ${settings.chatbot ? '✅' : '❌'}\n` +
      `┃ *ᴍᴏᴅᴇ* : ${settings.mode}\n` +
      `┃ *ᴘʀᴇғɪx* : ${settings.prefix}\n` +
      `┗▣`
    )
  },

  setwelcome: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
    const msg = ctx.args.join(' ')
    if (!msg) return ctx.reply(`❌ Usage: ${ctx.prefix}setwelcome <message>\nUse {name} for member name`)
    settings.welcome = msg
    await ctx.react('✅')
    await ctx.reply(`┏▣ ◈ *WELCOME* ◈\n┃ Welcome message set!\n┗▣`)
  },

  setgoodbye: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply('🚫 Owner only.')
    const msg = ctx.args.join(' ')
    if (!msg) return ctx.reply(`❌ Usage: ${ctx.prefix}setgoodbye <message>`)
    settings.goodbye = msg
    await ctx.react('✅')
    await ctx.reply(`┏▣ ◈ *GOODBYE* ◈\n┃ Goodbye message set!\n┗▣`)
  },
}
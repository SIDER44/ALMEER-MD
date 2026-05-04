import { exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)

export const commands = {

  calculate: async (ctx) => {
    const expr = ctx.args.join(' ')
    if (!expr) return ctx.reply(`❌ Usage: ${ctx.prefix}calculate <expression>\nExample: ${ctx.prefix}calculate 25 * 4`)
    await ctx.react('🧮')
    try {
      const safe = expr.replace(/[^0-9+\-*/().% ]/g, '')
      const result = Function(`"use strict"; return (${safe})`)()
      await ctx.reply(
        `┏▣ ◈ *CALCULATOR* ◈\n` +
        `┃ *ɪɴᴘᴜᴛ* : ${expr}\n` +
        `┃ *ʀᴇsᴜʟᴛ* : ${result}\n` +
        `┗▣`
      )
      await ctx.react('✅')
    } catch {
      await ctx.react('❌')
      await ctx.reply('❌ Invalid expression.')
    }
  },

  fancy: async (ctx) => {
    const text = ctx.args.join(' ')
    if (!text) return ctx.reply(`❌ Usage: ${ctx.prefix}fancy <text>`)
    await ctx.react('✨')
    const normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const fancy  = '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗'
    let out = ''
    for (const c of text) {
      const i = normal.indexOf(c)
      out += i >= 0 ? fancy[i] : c
    }
    await ctx.reply(
      `┏▣ ◈ *FANCY TEXT* ◈\n` +
      `┃ ${out}\n` +
      `┗▣`
    )
  },

  fliptext: async (ctx) => {
    const text = ctx.args.join(' ')
    if (!text) return ctx.reply(`❌ Usage: ${ctx.prefix}fliptext <text>`)
    await ctx.react('🔄')
    await ctx.reply(
      `┏▣ ◈ *FLIP TEXT* ◈\n` +
      `┃ ${text.split('').reverse().join('')}\n` +
      `┗▣`
    )
  },

  genpass: async (ctx) => {
    const len = parseInt(ctx.args[0]) || 12
    await ctx.react('🔐')
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let pass = ''
    for (let i = 0; i < Math.min(len, 32); i++) {
      pass += chars[Math.floor(Math.random() * chars.length)]
    }
    await ctx.reply(
      `┏▣ ◈ *PASSWORD GENERATOR* ◈\n` +
      `┃ *ʟᴇɴɢᴛʜ* : ${pass.length}\n` +
      `┃ *ᴘᴀss* : \`${pass}\`\n` +
      `┗▣`
    )
  },

  tinyurl: async (ctx) => {
    const url = ctx.args[0]
    if (!url) return ctx.reply(`❌ Usage: ${ctx.prefix}tinyurl <url>`)
    await ctx.react('🔗')
    try {
      const res  = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
      const short = await res.text()
      await ctx.reply(
        `┏▣ ◈ *TINYURL* ◈\n` +
        `┃ *ᴏʀɪɢɪɴᴀʟ* : ${url}\n` +
        `┃ *sʜᴏʀᴛ* : ${short}\n` +
        `┗▣`
      )
      await ctx.react('✅')
    } catch {
      await ctx.react('❌')
      await ctx.reply('❌ Failed to shorten URL.')
    }
  },

  weather: async (ctx) => {
    const city = ctx.args.join(' ')
    if (!city) return ctx.reply(`❌ Usage: ${ctx.prefix}weather <city>`)
    await ctx.react('🌤️')
    try {
      const res  = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      const data = await res.json()
      const w    = data.current_condition[0]
      const area = data.nearest_area[0]
      const name = area.areaName[0].value + ', ' + area.country[0].value
      await ctx.reply(
        `┏▣ ◈ *WEATHER* ◈\n` +
        `┃ *ʟᴏᴄᴀᴛɪᴏɴ* : ${name}\n` +
        `┃ *ᴄᴏɴᴅɪᴛɪᴏɴ* : ${w.weatherDesc[0].value}\n` +
        `┃ *ᴛᴇᴍᴘ* : ${w.temp_C}°C / ${w.temp_F}°F\n` +
        `┃ *ʜᴜᴍɪᴅɪᴛʏ* : ${w.humidity}%\n` +
        `┃ *ᴡɪɴᴅ* : ${w.windspeedKmph} km/h\n` +
        `┗▣`
      )
      await ctx.react('✅')
    } catch {
      await ctx.react('❌')
      await ctx.reply('❌ Could not fetch weather. Check the city name.')
    }
  },

  define: async (ctx) => {
    const word = ctx.args[0]
    if (!word) return ctx.reply(`❌ Usage: ${ctx.prefix}define <word>`)
    await ctx.react('📖')
    try {
      const res  = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Not found')
      const entry = data[0]
      const meaning = entry.meanings[0]
      const def     = meaning.definitions[0]
      await ctx.reply(
        `┏▣ ◈ *DICTIONARY* ◈\n` +
        `┃ *ᴡᴏʀᴅ* : ${entry.word}\n` +
        `┃ *ᴘᴀʀᴛ* : ${meaning.partOfSpeech}\n` +
        `┃ *ᴅᴇғɪɴɪᴛɪᴏɴ* : ${def.definition}\n` +
        `┃ *ᴇxᴀᴍᴘʟᴇ* : ${def.example || 'N/A'}\n` +
        `┗▣`
      )
      await ctx.react('✅')
    } catch {
      await ctx.react('❌')
      await ctx.reply(`❌ Word not found: *${word}*`)
    }
  },

  translate: async (ctx) => {
    const text = ctx.args.join(' ')
    if (!text) return ctx.reply(`❌ Usage: ${ctx.prefix}translate <text>\nDefault: translates to English`)
    await ctx.react('🌐')
    try {
      const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|en`)
      const data = await res.json()
      const out  = data.responseData?.translatedText
      if (!out) throw new Error('Failed')
      await ctx.reply(
        `┏▣ ◈ *TRANSLATE* ◈\n` +
        `┃ *ɪɴᴘᴜᴛ* : ${text}\n` +
        `┃ *ᴏᴜᴛᴘᴜᴛ* : ${out}\n` +
        `┗▣`
      )
      await ctx.react('✅')
    } catch {
      await ctx.react('❌')
      await ctx.reply('❌ Translation failed.')
    }
  },

  lyrics: async (ctx) => {
    const query = ctx.args.join(' ')
    if (!query) return ctx.reply(`❌ Usage: ${ctx.prefix}lyrics <song name>`)
    await ctx.react('🎵')
    try {
      const res  = await fetch(`https://lyrist.vercel.app/api/${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!data.lyrics) throw new Error('Not found')
      const trimmed = data.lyrics.length > 3000 ? data.lyrics.slice(0, 3000) + '\n...' : data.lyrics
      await ctx.reply(
        `┏▣ ◈ *LYRICS* ◈\n` +
        `┃ *sᴏɴɢ* : ${data.title || query}\n` +
        `┃ *ᴀʀᴛɪsᴛ* : ${data.artist || 'Unknown'}\n` +
        `┗▣\n\n${trimmed}`
      )
      await ctx.react('✅')
    } catch {
      await ctx.react('❌')
      await ctx.reply(`❌ Lyrics not found for: *${query}*`)
    }
  },

  jokes: async (ctx) => {
    await ctx.react('😂')
    try {
      const res  = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode')
      const data = await res.json()
      const joke = data.type === 'single'
        ? data.joke
        : `${data.setup}\n\n${data.delivery}`
      await ctx.reply(
        `┏▣ ◈ *JOKE* ◈\n` +
        `┃ *ᴄᴀᴛᴇɢᴏʀʏ* : ${data.category}\n` +
        `┗▣\n\n${joke}`
      )
    } catch {
      await ctx.reply('❌ Could not fetch a joke.')
    }
  },

  fact: async (ctx) => {
    await ctx.react('🧠')
    try {
      const res  = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
      const data = await res.json()
      await ctx.reply(
        `┏▣ ◈ *RANDOM FACT* ◈\n` +
        `┃ ${data.text}\n` +
        `┗▣`
      )
    } catch {
      await ctx.reply('❌ Could not fetch a fact.')
    }
  },

  quotes: async (ctx) => {
    await ctx.react('💬')
    try {
      const res  = await fetch('https://zenquotes.io/api/random')
      const data = await res.json()
      await ctx.reply(
        `┏▣ ◈ *QUOTE* ◈\n` +
        `┃ _"${data[0].q}"_\n` +
        `┃ — *${data[0].a}*\n` +
        `┗▣`
      )
    } catch {
      await ctx.reply('❌ Could not fetch a quote.')
    }
  },

  trivia: async (ctx) => {
    await ctx.react('❓')
    try {
      const res  = await fetch('https://opentdb.com/api.php?amount=1&type=multiple')
      const data = await res.json()
      const q    = data.results[0]
      const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5)
      const letters = ['A', 'B', 'C', 'D']
      const opts    = answers.map((a, i) => `┃ ${letters[i]}) ${a}`).join('\n')
      await ctx.reply(
        `┏▣ ◈ *TRIVIA* ◈\n` +
        `┃ *ᴄᴀᴛᴇɢᴏʀʏ* : ${q.category}\n` +
        `┃ *ǫ* : ${q.question.replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"')}\n` +
        `┃\n${opts}\n` +
        `┃\n┃ _Reply with the correct letter!_\n` +
        `┗▣\n\n||Answer: ${q.correct_answer}||`
      )
    } catch {
      await ctx.reply('❌ Could not fetch trivia.')
    }
  },

  dare: async (ctx) => {
    await ctx.react('🎯')
    const dares = [
      'Send a voice note singing your favourite song.',
      'Change your profile photo for 1 hour.',
      'Send a selfie right now.',
      'Text someone you haven\'t talked to in 6 months.',
      'Post a status with an embarrassing childhood photo.',
    ]
    const dare = dares[Math.floor(Math.random() * dares.length)]
    await ctx.reply(`┏▣ ◈ *DARE* ◈\n┃ ${dare}\n┗▣`)
  },

  truth: async (ctx) => {
    await ctx.react('💭')
    const truths = [
      'What is the most embarrassing thing that has ever happened to you?',
      'Have you ever lied to your best friend?',
      'What is your biggest fear?',
      'What is the most childish thing you still do?',
      'Who was your first crush?',
    ]
    const truth = truths[Math.floor(Math.random() * truths.length)]
    await ctx.reply(`┏▣ ◈ *TRUTH* ◈\n┃ ${truth}\n┗▣`)
  },

  truthordare: async (ctx) => {
    await ctx.react('🎲')
    const choice = Math.random() < 0.5 ? 'TRUTH' : 'DARE'
    const truths = ['What is your biggest secret?', 'Have you ever cheated on a test?', 'What is your biggest regret?']
    const dares  = ['Send a voice note right now.', 'Change your name on WhatsApp for 1 hour.', 'Tag 3 people randomly.']
    const pick   = choice === 'TRUTH'
      ? truths[Math.floor(Math.random() * truths.length)]
      : dares[Math.floor(Math.random() * dares.length)]
    await ctx.reply(`┏▣ ◈ *TRUTH OR DARE* ◈\n┃ *ᴄʜᴏɪᴄᴇ* : ${choice}\n┃ ${pick}\n┗▣`)
  },

  memes: async (ctx) => {
    await ctx.react('😂')
    try {
      const res  = await fetch('https://meme-api.com/gimme')
      const data = await res.json()
      await ctx.sock.sendMessage(ctx.from, {
        image: { url: data.url },
        caption:
          `┏▣ ◈ *MEME* ◈\n` +
          `┃ *ᴛɪᴛʟᴇ* : ${data.title}\n` +
          `┃ *sᴜʙ* : r/${data.subreddit}\n` +
          `┗▣`,
      }, { quoted: ctx.msg })
      await ctx.react('✅')
    } catch {
      await ctx.react('❌')
      await ctx.reply('❌ Could not fetch a meme.')
    }
  },
}
import config from '../config.js'
import logger from '../lib/logger.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const askGroq = async (prompt) => {
  if (!config.groqApiKey) throw new Error('GROQ_API_KEY not set')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: `You are ALMEER AI, an intelligent assistant built into the ✞『✦𝑨𝑳𝑴𝑬𝑬𝑹 ✠ 𝑴𝑫✦』✞ WhatsApp bot. Be helpful, concise, and friendly.`,
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response from AI.'
}

const handleAI = async (ctx) => {
  const { args, reply, react } = ctx
  const prompt = args.join(' ').trim()

  if (!prompt) {
    return reply(`❌ Usage: ${ctx.prefix}ai <your question>`)
  }

  if (!config.groqApiKey) {
    return reply('⚠️ AI is not configured. Set GROQ_API_KEY in your .env file.\nGet a free key at: https://console.groq.com')
  }

  await react('🤖')

  try {
    const answer = await askGroq(prompt)
    await reply(`🤖 *ALMEER AI*\n\n${answer}`)
    await react('✅')
  } catch (err) {
    logger.error('AI command error', err)
    await react('❌')
    await reply(`❌ AI Error: ${err.message}`)
  }
}

export const commands = {
  ai: handleAI,
  gpt: handleAI,
}

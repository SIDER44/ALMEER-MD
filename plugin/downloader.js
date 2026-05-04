import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import logger from '../lib/logger.js'

const execAsync = promisify(exec)
const TMP = './tmp'

if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true })

// ── Helpers ─────────────────────────────────────────────────────────────────

const isValidUrl = (url) => {
  try { new URL(url); return true } catch { return false }
}

const cleanTmp = (file) => {
  try { if (fs.existsSync(file)) fs.unlinkSync(file) } catch {}
}

// API fallback for when yt-dlp is unavailable
const fetchYtApi = async (url, type) => {
  const apiUrl = `https://api.cobalt.tools/api/json`
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      url,
      vCodec: 'h264',
      vQuality: '720',
      aFormat: 'mp3',
      isAudioOnly: type === 'audio',
    }),
  })
  const data = await res.json()
  if (data.status === 'stream' || data.status === 'redirect') return data.url
  throw new Error(data.text || 'API failed')
}

// ── YouTube MP3 ──────────────────────────────────────────────────────────────

const ytmp3 = async (ctx) => {
  const { args, reply, react, sock, from, msg } = ctx
  const url = args[0]

  if (!url || !isValidUrl(url)) return reply(`❌ Usage: ${ctx.prefix}ytmp3 <YouTube URL>`)

  await react('⏳')
  await reply('📥 Downloading audio... please wait')

  try {
    const outFile = path.join(TMP, `yt_audio_${Date.now()}.mp3`)
    await execAsync(`yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outFile}" "${url}"`)

    if (!fs.existsSync(outFile)) throw new Error('Download failed — file not found')

    const buffer = fs.readFileSync(outFile)
    await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg })
    await react('✅')
    cleanTmp(outFile)
  } catch (err) {
    logger.error('ytmp3 error', err)
    // Fallback to API
    try {
      const dlUrl = await fetchYtApi(url, 'audio')
      await reply(`📥 *Audio Download Link*\n${dlUrl}\n\n_(Direct download — link expires soon)_`)
      await react('✅')
    } catch (apiErr) {
      await react('❌')
      await reply(`❌ Download failed.\nTry a valid YouTube link.\nError: ${err.message}`)
    }
  }
}

// ── YouTube MP4 ──────────────────────────────────────────────────────────────

const ytmp4 = async (ctx) => {
  const { args, reply, react, sock, from, msg } = ctx
  const url = args[0]

  if (!url || !isValidUrl(url)) return reply(`❌ Usage: ${ctx.prefix}ytmp4 <YouTube URL>`)

  await react('⏳')
  await reply('📥 Downloading video... please wait')

  try {
    const outFile = path.join(TMP, `yt_video_${Date.now()}.mp4`)
    await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outFile}" "${url}"`)

    if (!fs.existsSync(outFile)) throw new Error('Download failed — file not found')

    const buffer = fs.readFileSync(outFile)
    await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4' }, { quoted: msg })
    await react('✅')
    cleanTmp(outFile)
  } catch (err) {
    logger.error('ytmp4 error', err)
    try {
      const dlUrl = await fetchYtApi(url, 'video')
      await reply(`📥 *Video Download Link*\n${dlUrl}\n\n_(Direct download — link expires soon)_`)
      await react('✅')
    } catch {
      await react('❌')
      await reply(`❌ Download failed. Error: ${err.message}`)
    }
  }
}

// ── TikTok ────────────────────────────────────────────────────────────────────

const tiktok = async (ctx) => {
  const { args, reply, react, sock, from, msg } = ctx
  const url = args[0]

  if (!url || !isValidUrl(url)) return reply(`❌ Usage: ${ctx.prefix}tiktok <TikTok URL>`)

  await react('⏳')
  await reply('📥 Downloading TikTok video...')

  try {
    // Try tikwm API (no watermark)
    const apiRes = await fetch(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`)
    const apiData = await apiRes.json()

    if (apiData?.no_watermark) {
      const vidRes = await fetch(apiData.no_watermark)
      const buffer = Buffer.from(await vidRes.arrayBuffer())
      await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4', caption: apiData?.title || '' }, { quoted: msg })
      await react('✅')
      return
    }
    throw new Error('No video URL from API')
  } catch (err) {
    logger.error('TikTok download error', err)
    try {
      // yt-dlp fallback
      const outFile = path.join(TMP, `tiktok_${Date.now()}.mp4`)
      await execAsync(`yt-dlp --no-check-certificate -o "${outFile}" "${url}"`)
      const buffer = fs.readFileSync(outFile)
      await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4' }, { quoted: msg })
      await react('✅')
      cleanTmp(outFile)
    } catch (e2) {
      await react('❌')
      await reply(`❌ TikTok download failed. Error: ${e2.message}`)
    }
  }
}

// ── Instagram ─────────────────────────────────────────────────────────────────

const ig = async (ctx) => {
  const { args, reply, react, sock, from, msg } = ctx
  const url = args[0]

  if (!url || !isValidUrl(url)) return reply(`❌ Usage: ${ctx.prefix}ig <Instagram URL>`)

  await react('⏳')
  await reply('📥 Downloading Instagram media...')

  try {
    const outFile = path.join(TMP, `ig_${Date.now()}.mp4`)
    await execAsync(`yt-dlp --cookies-from-browser firefox -o "${outFile}" "${url}" 2>/dev/null || yt-dlp -o "${outFile}" "${url}"`)
    const buffer = fs.readFileSync(outFile)
    await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4' }, { quoted: msg })
    await react('✅')
    cleanTmp(outFile)
  } catch (err) {
    logger.error('Instagram download error', err)
    try {
      const dlUrl = await fetchYtApi(url, 'video')
      await reply(`📥 *Instagram Download Link*\n${dlUrl}`)
      await react('✅')
    } catch {
      await react('❌')
      await reply(`❌ Instagram download failed. Error: ${err.message}\n\n_Tip: Instagram requires login for some content._`)
    }
  }
}

export const commands = { ytmp3, ytmp4, tiktok, ig }

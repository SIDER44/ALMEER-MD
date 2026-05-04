import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLUGINS_DIR = path.join(__dirname, '..', 'plugins')

// Module-level flag — survives reconnects within same process
let loaded = false

// Global command map — persists across reconnects
export const commands = new Map()

export const loadPlugins = async () => {
  // Guard: only load once per process lifetime
  if (loaded) {
    logger.info('Plugins already loaded — skipping re-load')
    return commands
  }

  const files = fs.readdirSync(PLUGINS_DIR).filter((f) => f.endsWith('.js'))

  for (const file of files) {
    try {
      const filePath = `file://${path.join(PLUGINS_DIR, file)}`
      const plugin = await import(filePath)

      if (plugin.commands && typeof plugin.commands === 'object') {
        for (const [name, handler] of Object.entries(plugin.commands)) {
          commands.set(name, handler)
        }
        logger.success(`Plugin loaded: ${file} (${Object.keys(plugin.commands).length} cmd${Object.keys(plugin.commands).length > 1 ? 's' : ''})`)
      }
    } catch (err) {
      logger.error(`Failed to load plugin: ${file}`, err)
    }
  }

  loaded = true
  logger.success(`Total commands registered: ${commands.size}`)
  return commands
}

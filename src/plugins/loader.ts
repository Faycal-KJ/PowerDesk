import { pluginManager } from './pluginManager'
import { loadPluginFromManifest } from './pluginApi'
import type { PluginManifest } from './types'
import { getApi } from '../lib/api'

const BUNDLED_PLUGINS: Array<{ manifest: PluginManifest; activate: (api: any) => void }> = []
const log = (msg: string, ...args: any[]) => console.log(`[PluginLoader] ${msg}`, ...args)

export async function loadBundledPlugins() {
  for (const plugin of BUNDLED_PLUGINS) {
    await loadPluginFromManifest(plugin.manifest, '')
    const api = createTempApi(plugin.manifest.id)
    plugin.activate(api)
  }
}

export async function discoverExternalPlugins(): Promise<PluginManifest[]> {
  try {
    const api = getApi()
    if (!api) { log('No electronAPI available'); return [] }
    log('Discovering plugins...')
    const pluginsDir = await api.getPluginsDir()
    log('Plugins directory:', pluginsDir)
    if (!pluginsDir) { log('No plugins directory'); return [] }
    const rawEntries = await api.readDir(pluginsDir)
    log('Raw entries:', JSON.stringify(rawEntries?.map((e: any) => ({ name: e.name, isDirectory: e.isDirectory }))))
    const entries: any[] = Array.isArray(rawEntries) ? rawEntries : []
    if (entries.length === 0) { log('No entries in plugins dir'); return [] }
    const manifests: PluginManifest[] = []
    for (const entry of entries) {
      if (entry.isDirectory) {
        const manifestPath = pluginsDir + '\\' + entry.name + '\\manifest.json'
        try {
          log('Reading manifest:', manifestPath)
          const res = await api.readFileText(manifestPath)
          log('readFileText result:', res ? ('content' in res ? 'has content' : 'has error: ' + (res as any).error) : 'null')
          if (res && 'content' in res) {
            const manifest = JSON.parse(res.content)
            if (manifest.id && manifest.name && manifest.version) {
              log('Valid manifest found:', manifest.id, manifest.name)
              manifests.push(manifest)
            } else {
              log('Invalid manifest (missing id/name/version):', entry.name)
            }
          }
        } catch (e) {
          log(`Failed to read manifest for "${entry.name}":`, e)
        }
      }
    }
    log(`Discovered ${manifests.length} plugin(s)`)
    return manifests
  } catch (e) {
    log('discoverExternalPlugins failed:', e)
    return []
  }
}

export async function loadExternalPlugin(pluginId: string): Promise<boolean> {
  try {
    const api = getApi()
    if (!api) { log(`No API for loading "${pluginId}"`); return false }
    const pluginsDir = await api.getPluginsDir()
    if (!pluginsDir) return false

    const manifestPath = pluginsDir + '\\' + pluginId + '\\manifest.json'
    const manifestRes = await api.readFileText(manifestPath)
    const manifestContent = manifestRes && 'content' in manifestRes ? manifestRes.content : null
    if (!manifestContent) { log(`No manifest content for "${pluginId}"`); return false }
    const manifest: PluginManifest = JSON.parse(manifestContent)

    const entryPath = pluginsDir + '\\' + pluginId + '\\index.js'
    const entryRes = await api.readFileText(entryPath)
    const entryContent = entryRes && 'content' in entryRes ? entryRes.content : null
    if (!entryContent) { log(`No entry file content for "${pluginId}" at ${entryPath}`); return false }

    log(`Loading plugin "${pluginId}" (${entryContent.length} bytes of code)...`)
    const result = await loadPluginFromManifest(manifest, entryContent)
    log(`Plugin "${pluginId}" load result: ${result}`)
    return result
  } catch (err) {
    log(`Failed to load external plugin "${pluginId}":`, err)
    return false
  }
}

function createTempApi(pluginId: string) {
  const { createPluginApi } = require('./pluginApi')
  return createPluginApi(pluginId)
}

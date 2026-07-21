import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { useStore } from '../stores/useStore'
import { pluginManager } from './pluginManager'
import type { PluginApi, PluginManifest } from './types'
import { getApi } from '../lib/api'

export function createPluginApi(pluginId: string): PluginApi {
  return {
    pluginId,
    store: {
      getState: () => useStore.getState(),
      setState: (partial) => useStore.setState(partial),
      subscribe: (listener) => {
        return useStore.subscribe(listener)
      },
    },
    ui: {
      registerSidebarPanel: (panel) => pluginManager.addSidebarPanel({ ...panel, pluginId }),
      registerToolbarButton: (btn) => pluginManager.addToolbarButton({ ...btn, pluginId }),
      registerStatusBarEntry: (entry) => pluginManager.addStatusBarEntry({ ...entry, pluginId }),
      registerContextMenuItem: (item) => pluginManager.addContextMenuItem({ ...item, pluginId }),
      registerBackgroundContextMenuItem: (item) => pluginManager.addBackgroundContextMenuItem({ ...item, pluginId }),
      registerSettingsTab: (tab) => pluginManager.addSettingsTab({ ...tab, pluginId }),
      registerPreviewHandler: (handler) => pluginManager.addPreviewHandler({ ...handler, pluginId }),
      registerView: (view) => pluginManager.addView({ ...view, pluginId }),
      registerTabType: (tabType) => pluginManager.addTabType({ ...tabType, pluginId }),
      registerTreeDataProvider: (provider) => pluginManager.addTreeDataProvider({ ...provider, pluginId }),
      registerFileDecorationProvider: (provider) => pluginManager.addFileDecorationProvider({ ...provider, pluginId }),
      registerTheme: (theme) => pluginManager.addTheme({ ...theme, pluginId }),
      registerTopBarItem: (item) => pluginManager.addTopBarItem({ ...item, pluginId }),
      getViews: () => pluginManager.getViews(),
      getTabTypes: () => pluginManager.getTabTypes(),
      getTreeDataProviders: () => pluginManager.getTreeDataProviders(),
      getFileDecorationProviders: () => pluginManager.getFileDecorationProviders(),
      getThemes: () => pluginManager.getThemes(),
      getTopBarItems: () => pluginManager.getTopBarItems(),
      getBackgroundContextMenuItems: () => pluginManager.getBackgroundContextMenuItems(),
    },
    events: {
      onDidNavigate: (callback) => pluginManager.on('didNavigate', callback),
      onDidFileOperation: (callback) => pluginManager.on('didFileOperation', callback),
      onDidTabChange: (callback) => pluginManager.on('didTabChange', callback),
      onDidSettingsChange: (callback) => pluginManager.on('didSettingsChange', callback),
      onAppReady: (callback) => pluginManager.on('appReady', callback),
      on: (event, callback) => pluginManager.on(event, callback),
      emit: (event, ...args) => pluginManager.emit(event, ...args),
    },
    hooks: {
      registerBeforeHook: (hookId, callback) => {
        pluginManager.registerBeforeHook(hookId, callback)
      },
      registerAfterHook: (hookId, callback) => {
        pluginManager.registerAfterHook(hookId, callback)
      },
    },
    commands: {
      register: (cmd) => pluginManager.addCommand({ ...cmd, pluginId }),
    },
    shortcuts: {
      register: (binding) => pluginManager.addShortcut({ ...binding, pluginId }),
    },
    ipc: {
      invoke: (channel, ...args) => {
        const api = getApi()
        if (!api) return Promise.reject(new Error('No API available'))
        return (api as any)[channel]?.(...args) ?? Promise.reject(new Error(`Unknown channel: ${channel}`))
      },
      on: (channel, callback) => {
        const api = getApi()
        if (api && (api as any)[`on${channel.charAt(0).toUpperCase() + channel.slice(1)}`]) {
          (api as any)[`on${channel.charAt(0).toUpperCase() + channel.slice(1)}`](callback)
        }
      },
      send: (channel, ...args) => {
        const api = getApi()
        if (api && (api as any)[channel]) {
          (api as any)[channel](...args)
        }
      },
    },
    fs: {
      readDir: async (dirPath) => {
        const api = getApi()
        return api?.readDir(dirPath) ?? []
      },
      readFile: async (filePath) => {
        const api = getApi()
        const res = await api?.readFileText(filePath)
        return (res && 'content' in res) ? res.content : ''
      },
      writeFile: async (filePath, content) => {
        const api = getApi()
        await api?.writeFileText(filePath, content)
      },
      stat: async (filePath) => {
        const api = getApi()
        return api?.getFileStat(filePath) ?? null
      },
    },
    log: {
      info: (msg) => console.log(`[Plugin:${pluginId}]`, msg),
      warn: (msg) => console.warn(`[Plugin:${pluginId}]`, msg),
      error: (msg) => console.error(`[Plugin:${pluginId}]`, msg),
    },
  }
}

const PLUGIN_MODULES: Record<string, any> = {
  react: React,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOM,
}

function requireModule(name: string): any {
  if (PLUGIN_MODULES[name]) return PLUGIN_MODULES[name]
  console.warn(`[PluginManager] Unknown module: "${name}" — available: react, react-dom, react-dom/client`)
  return {}
}

export async function loadPluginFromManifest(manifest: PluginManifest, entryCode: string): Promise<boolean> {
  try {
    console.log(`[PluginManager] Registering plugin "${manifest.id}"...`)
    pluginManager.registerPlugin(manifest)
    const api = createPluginApi(manifest.id)

    const wrappedCode = `
      var module = { exports: {} };
      var exports = module.exports;
      function require(name) {
        if (name === 'react') return __PD_REACT__;
        if (name === 'react-dom') return __PD_REACT_DOM__;
        if (name === 'react-dom/client') return __PD_REACT_DOM_CLIENT__;
        throw new Error('Unknown module: ' + name);
      }
      ${entryCode}
      return module.exports;
    `

    const factory = new Function(
      '__PD_REACT__',
      '__PD_REACT_DOM__',
      '__PD_REACT_DOM_CLIENT__',
      wrappedCode,
    )

    const pluginExports = factory(React, ReactDOM, ReactDOM)

    if (pluginExports && typeof pluginExports.activate === 'function') {
      pluginExports.activate(api)
    } else if (pluginExports && typeof pluginExports.default === 'function') {
      pluginExports.default(api)
    } else {
      console.warn(`[PluginManager] Plugin "${manifest.id}" has no activate() or default export`)
    }

    console.log(`[PluginManager] Plugin "${manifest.id}" loaded v${manifest.version}`)
    return true
  } catch (err) {
    console.error(`[PluginManager] Failed to load plugin "${manifest.name}":`, err)
    pluginManager.unregisterPlugin(manifest.id)
    return false
  }
}

export async function loadPluginFromFile(manifestPath: string): Promise<boolean> {
  try {
    const api = getApi()
    if (!api) return false
    const dirPath = manifestPath.replace(/[/\\]manifest\.json$/, '')
    const manifestRaw = await api.readFileText(manifestPath)
    const manifestContent = manifestRaw && 'content' in manifestRaw ? manifestRaw.content : null
    if (!manifestContent) return false
    const manifest: PluginManifest = JSON.parse(manifestContent)
    if (!manifest.id || !manifest.name || !manifest.version) {
      console.error(`[PluginManager] Invalid manifest at ${manifestPath}`)
      return false
    }
    const entryFile = manifest.permissions?.includes('main-process') ? 'main.js' : 'index.js'
    const entryPath = dirPath + '\\' + entryFile
    const entryRaw = await api.readFileText(entryPath)
    const entryContent = entryRaw && 'content' in entryRaw ? entryRaw.content : null
    if (!entryContent) {
      console.error(`[PluginManager] No entry file found at ${entryPath}`)
      return false
    }
    return loadPluginFromManifest(manifest, entryContent)
  } catch (err) {
    console.error(`[PluginManager] Failed to load plugin from ${manifestPath}:`, err)
    return false
  }
}

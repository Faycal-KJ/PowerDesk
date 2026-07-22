import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore, applyUiSettings } from './stores/useStore'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import TabBar from './components/TabBar'
import FileArea from './components/FileArea'
import StatusBar from './components/StatusBar'
import ContextMenu from './components/ContextMenu'
import BackgroundContextMenu from './components/BackgroundContextMenu'
import SearchOverlay from './components/SearchOverlay'
import FilePreview from './components/FilePreview'
import PropertiesPanel from './components/PropertiesPanel'
import QRGenerator from './components/QRGenerator'
import Terminal from './components/Terminal'
import ColorTool from './components/ColorTool'
import SettingsPanel from './components/SettingsPanel'
import TransferCenter from './components/TransferCenter'
import ConflictDialog from './components/ConflictDialog'
import UndoHistory from './components/UndoHistory'
import FolderAnalysis from './components/FolderAnalysis'
import ClipboardManager from './components/ClipboardManager'
import WorkspaceProfiles from './components/WorkspaceProfiles'
import FavoriteBar from './components/FavoriteBar'
import CommandHistory from './components/CommandHistory'
import FavoriteCommands from './components/FavoriteCommands'
import TitleBar from './components/TitleBar'
import ErrorBoundary from './components/ErrorBoundary'
import { getApi } from './lib/api'
import { pluginManager } from './plugins/pluginManager'
import { SidebarPanels, ToolbarButtons, PluginTopBarItems, PluginBackgroundContextItems } from './plugins/ExtensionPoint'
import { discoverExternalPlugins, loadExternalPlugin } from './plugins/loader'

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchMode, setSearchMode] = useState<'search' | 'command'>('search')
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const sidebarWidth = useStore((s) => s.sidebarWidth)
  const tabs = useStore((s) => s.tabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const dualPaneTabId = activeTab?.dualPaneTabId
  const dualPaneTab = dualPaneTabId ? tabs.find((t) => t.id === dualPaneTabId) : undefined
  const focusedPane = useStore((s) => s.focusedPane)
  const setFocusedPane = useStore((s) => s.setFocusedPane)
  const navigateTo = useStore((s) => s.navigateTo)
  const setInitialDirs = useStore((s) => s.setInitialDirs)
  const appendWorkspaceTabs = useStore((s) => s.appendWorkspaceTabs)
  const persistWorkspace = useStore((s) => s.persistWorkspace)
  const loadedRef = useRef(false)

  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const clipboardOpen = useStore((s) => s.clipboardOpen)
  const setClipboardOpen = useStore((s) => s.setClipboardOpen)
  const profilesOpen = useStore((s) => s.profilesOpen)
  const setProfilesOpen = useStore((s) => s.setProfilesOpen)
  const favoriteBarOpen = useStore((s) => s.favoriteBarOpen)
  const setFavoriteBarOpen = useStore((s) => s.setFavoriteBarOpen)
  const commandHistoryOpen = useStore((s) => s.commandHistoryOpen)
  const setCommandHistoryOpen = useStore((s) => s.setCommandHistoryOpen)
  const favoriteCommandsOpen = useStore((s) => s.favoriteCommandsOpen)
  const setFavoriteCommandsOpen = useStore((s) => s.setFavoriteCommandsOpen)
  const syncEnabled = useStore((s) => s.syncEnabled)
  const setSyncEnabled = useStore((s) => s.setSyncEnabled)
  const files = useStore((s) => s.files)
  const focusedFileIndex = useStore((s) => s.focusedFileIndex)
  const setPreviewFile = useStore((s) => s.setPreviewFile)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return

    // Check plugin shortcuts first (highest priority)
    const pluginShortcuts = pluginManager.getShortcuts()
    for (const binding of pluginShortcuts) {
      if (matchShortcut(e, binding.keys)) {
        e.preventDefault()
        binding.action()
        return
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      setSearchMode('command')
      setSearchOpen(true)
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault()
      setSearchMode('search')
      setSearchOpen((v) => !v)
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      redo()
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault()
      setClipboardOpen(!clipboardOpen)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
      e.preventDefault()
      setProfilesOpen(!profilesOpen)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
      e.preventDefault()
      setFavoriteBarOpen(!favoriteBarOpen)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault()
      setCommandHistoryOpen(!commandHistoryOpen)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault()
      setFavoriteCommandsOpen(!favoriteCommandsOpen)
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      setSyncEnabled(!syncEnabled)
    } else if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      const idx = focusedFileIndex >= 0 ? focusedFileIndex : 0
      if (files.length > 0 && idx < files.length) {
        setPreviewFile(files[idx])
      }
    }
  }, [undo, redo, clipboardOpen, setClipboardOpen, profilesOpen, setProfilesOpen, favoriteBarOpen, setFavoriteBarOpen, commandHistoryOpen, setCommandHistoryOpen, favoriteCommandsOpen, setFavoriteCommandsOpen, syncEnabled, setSyncEnabled, files, focusedFileIndex, setPreviewFile])

  useEffect(() => {
    applyUiSettings()
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const api = getApi()
    if (!api) return

    // Start building search index on launch
    if (api.searchBuildIndex) {
      api.searchBuildIndex([])
    }

    api.getInitialDirs().then((dirs) => {
      setInitialDirs(dirs as unknown as Record<string, string>)
      api.loadWorkspace().then((savedTabs: any) => {
        if (savedTabs && savedTabs.length > 0) {
          appendWorkspaceTabs(savedTabs)
          const first = savedTabs[0]
          if (first?.path) {
            navigateTo(first.path, first.id)
          } else if (dirs.home) {
            navigateTo(dirs.home)
          }
        } else if (dirs.home) {
          navigateTo(dirs.home)
        }
        loadedRef.current = true
      })
    })

    // Listen for save request from main process on close
    if (api.onSaveWorkspaceRequest) {
      api.onSaveWorkspaceRequest(() => {
        persistWorkspace()
      })
    }

    // Discover and load external plugins
    console.log('[App] Starting plugin discovery...')
    discoverExternalPlugins().then((manifests) => {
      console.log(`[App] Discovered ${manifests.length} plugin(s):`, manifests.map(m => m.id))
      for (const manifest of manifests) {
        console.log(`[App] Loading plugin "${manifest.id}"...`)
        loadExternalPlugin(manifest.id).then(ok => {
          console.log(`[App] Plugin "${manifest.id}" loaded: ${ok}`)
        }).catch(err => {
          console.error(`[App] Plugin "${manifest.id}" failed:`, err)
        })
      }
      // Apply plugin themes to the theme engine
      applyPluginThemes()
      // Fire app ready event for plugins
      pluginManager.emit('appReady')
    }).catch(err => {
      console.error('[App] Plugin discovery failed:', err)
    })
  }, [])

  // Auto-save on tab changes
  useEffect(() => {
    if (!loadedRef.current) return
    const timer = setTimeout(() => persistWorkspace(), 300)
    return () => clearTimeout(timer)
  }, [tabs])

  // Transfer progress listener
  useEffect(() => {
    const api = getApi()
    if (!api?.onTransferProgress) return
    api.onTransferProgress((data: any) => {
      useStore.getState().updateTransfer(data)
    })
  }, [])

  // Clipboard text monitor — polls system clipboard every 2s
  useEffect(() => {
    const api = getApi()
    if (!api?.readClipboardText) return
    let lastText = ''
    const interval = setInterval(async () => {
      try {
        const text = await api.readClipboardText()
        if (text && text !== lastText && text.length > 0 && text.length < 10000) {
          lastText = text
          useStore.getState().addClipboardEntry({
            type: 'text',
            content: text,
          })
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Multi Window Sync — listen for sync messages
  const handleSyncMessage = useStore((s) => s.handleSyncMessage)
  const broadcastSync = useStore((s) => s.broadcastSync)

  useEffect(() => {
    const api = getApi()
    if (!api?.onSyncMessage) return
    const handler = (_channel: string, data: any) => {
      handleSyncMessage(data)
    }
    api.onSyncMessage(handler)
  }, [handleSyncMessage])

  // Broadcast navigation changes when sync is active
  useEffect(() => {
    if (!syncEnabled || !activeTab?.path) return
    broadcastSync({ type: 'navigate', path: activeTab.path })
  }, [activeTab?.path, syncEnabled, broadcastSync])

  // Broadcast selection changes when sync is active
  const selectedPaths = useStore((s) => s.selectedPathsForContext)
  useEffect(() => {
    if (!syncEnabled) return
    broadcastSync({ type: 'select', paths: selectedPaths })
  }, [selectedPaths, syncEnabled, broadcastSync])

  const dualPane = activeTab ? activeTab.dualPane : false

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TitleBar />
      <TopBar />
      <PluginToolbarRow />
      <TabBar />
      <FavoriteBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarOpen && (
          <ErrorBoundary name="Sidebar">
            <div style={{ display: 'flex', flexDirection: 'column', width: sidebarWidth, flexShrink: 0, overflow: 'hidden' }}>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Sidebar />
              </div>
              <SidebarPanels />
            </div>
          </ErrorBoundary>
        )}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {dualPane && dualPaneTab ? (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <PaneColumn
                label={activeTab?.title || 'Tab 1'}
                tabId={activeTabId}
                focused={focusedPane === 'left'}
                onClick={() => setFocusedPane('left')}
              />
              <div style={{ width: 1, background: 'var(--border-color)', flexShrink: 0 }} />
              <PaneColumn
                label={dualPaneTab.title || 'Tab 2'}
                tabId={dualPaneTabId!}
                focused={focusedPane === 'right'}
                onClick={() => setFocusedPane('right')}
              />
            </div>
          ) : (
            <ErrorBoundary name="File Browser">
              <FileArea tabId={activeTabId} />
            </ErrorBoundary>
          )}
        </div>
      </div>
      <ErrorBoundary name="Status Bar">
        <StatusBar />
      </ErrorBoundary>
      <ContextMenu />
      <BackgroundContextMenu />
      {searchOpen && (
        <ErrorBoundary name="Search">
          <SearchOverlay mode={searchMode} onClose={() => setSearchOpen(false)} />
        </ErrorBoundary>
      )}
      <ErrorBoundary name="File Preview">
        <FilePreview />
      </ErrorBoundary>
      <ErrorBoundary name="Properties">
        <PropertiesPanel />
      </ErrorBoundary>
      <ErrorBoundary name="QR Generator">
        <QRGenerator />
      </ErrorBoundary>
      <ErrorBoundary name="Terminal">
        <Terminal />
      </ErrorBoundary>
      <ErrorBoundary name="Color Tool">
        <ColorTool />
      </ErrorBoundary>
      <ErrorBoundary name="Settings">
        <SettingsPanel />
      </ErrorBoundary>
      <ErrorBoundary name="Transfer Center">
        <TransferCenter />
      </ErrorBoundary>
      <ErrorBoundary name="Conflict Resolution">
        <ConflictDialog />
      </ErrorBoundary>
      <ErrorBoundary name="Undo History">
        <UndoHistory />
      </ErrorBoundary>
      <ErrorBoundary name="Folder Analysis">
        <FolderAnalysis />
      </ErrorBoundary>
      <ErrorBoundary name="Clipboard Manager">
        <ClipboardManager />
      </ErrorBoundary>
      <ErrorBoundary name="Workspace Profiles">
        <WorkspaceProfiles />
      </ErrorBoundary>
      <ErrorBoundary name="Command History">
        <CommandHistory />
      </ErrorBoundary>
      <ErrorBoundary name="Favorite Commands">
        <FavoriteCommands />
      </ErrorBoundary>
    </div>
  )
}

function PluginToolbarRow() {
  const [, setTick] = useState(0)
  useEffect(() => pluginManager.onChange(() => setTick((t) => t + 1)), [])
  const buttons = pluginManager.getToolbarButtons()
  const topBarItems = pluginManager.getTopBarItems()
  if (buttons.length === 0 && topBarItems.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px 2px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
      <ToolbarButtons />
      <PluginTopBarItems />
    </div>
  )
}

function applyPluginThemes() {
  const themes = pluginManager.getThemes()
  for (const theme of themes) {
    for (const [key, value] of Object.entries(theme.colors)) {
      document.documentElement.style.setProperty(`--${key}`, value)
    }
  }
}

function matchShortcut(e: KeyboardEvent, keys: string): boolean {
  const parts = keys.toLowerCase().split('+').map((s) => s.trim())
  const hasCtrl = parts.includes('ctrl')
  const hasShift = parts.includes('shift')
  const hasAlt = parts.includes('alt')
  const key = parts.find((p) => !['ctrl', 'shift', 'alt'].includes(p))
  if (hasCtrl !== (e.ctrlKey || e.metaKey)) return false
  if (hasShift !== e.shiftKey) return false
  if (hasAlt !== e.altKey) return false
  if (key && e.key.toLowerCase() !== key) return false
  return true
}

function PaneColumn({
  label,
  tabId,
  focused,
  onClick,
}: {
  label: string
  tabId: string
  focused: boolean
  onClick: () => void
}) {
  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div
        onClick={onClick}
        style={{
          padding: '2px 8px',
          fontSize: 10.5,
          color: focused ? 'var(--accent)' : 'var(--text-muted)',
          background: focused ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {focused && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
        {label}
      </div>
      <ErrorBoundary name="File Browser">
        <FileArea tabId={tabId} />
      </ErrorBoundary>
    </div>
  )
}

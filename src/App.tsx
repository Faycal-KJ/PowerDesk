import { useState, useEffect } from 'react'
import { useStore } from './stores/useStore'
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
import { ToastContainer } from './components/Toast'
import { SidebarPanels, ToolbarButtons, PluginTopBarItems, PluginBackgroundContextItems } from './plugins/ExtensionPoint'
import { pluginManager } from './plugins/pluginManager'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAppInit } from './hooks/useAppInit'
import { useAutoSave } from './hooks/useAutoSave'
import { useTransferListener, useClipboardMonitor, useMultiWindowSync } from './hooks/useSystemListeners'

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

  const loadedRef = useAppInit()
  useKeyboardShortcuts(setSearchMode, setSearchOpen)
  useAutoSave(loadedRef)
  useTransferListener()
  useClipboardMonitor()
  useMultiWindowSync()

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
      <ToastContainer />
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

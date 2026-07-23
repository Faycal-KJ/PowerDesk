import { useStore } from '../stores/useStore'
import { ArrowDownToLine, Clock, Clipboard, Layers, History, Bookmark, Link } from 'lucide-react'

export default function StatusBar() {
  const files = useStore((s) => s.files)
  const searchQuery = useStore((s) => s.searchQuery)
  const activeTab = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const loading = useStore((s) => s.loading)
  const activeTagFilter = useStore((s) => s.activeTagFilter)
  const transfers = useStore((s) => s.transfers)
  const transferOpen = useStore((s) => s.transferOpen)
  const setTransferOpen = useStore((s) => s.setTransferOpen)
  const undoStack = useStore((s) => s.undoStack)
  const undoHistoryOpen = useStore((s) => s.undoHistoryOpen)
  const setUndoHistoryOpen = useStore((s) => s.setUndoHistoryOpen)
  const clipboardHistory = useStore((s) => s.clipboardHistory)
  const clipboardOpen = useStore((s) => s.clipboardOpen)
  const setClipboardOpen = useStore((s) => s.setClipboardOpen)
  const profilesOpen = useStore((s) => s.profilesOpen)
  const setProfilesOpen = useStore((s) => s.setProfilesOpen)
  const profiles = useStore((s) => s.profiles)
  const commandHistory = useStore((s) => s.commandHistory)
  const commandHistoryOpen = useStore((s) => s.commandHistoryOpen)
  const setCommandHistoryOpen = useStore((s) => s.setCommandHistoryOpen)
  const favoriteCommands = useStore((s) => s.favoriteCommands)
  const favoriteCommandsOpen = useStore((s) => s.favoriteCommandsOpen)
  const setFavoriteCommandsOpen = useStore((s) => s.setFavoriteCommandsOpen)
  const syncEnabled = useStore((s) => s.syncEnabled)
  const setSyncEnabled = useStore((s) => s.setSyncEnabled)

  const dirs = files.filter((f) => f.isDirectory).length
  const fileCount = files.length - dirs
  const activeTransfers = transfers.filter((t) => t.status === 'running' || t.status === 'paused').length

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2px 8px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        fontSize: 11.5,
        color: 'var(--text-secondary)',
        minHeight: 22,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {loading ? (
          <span>Loading...</span>
        ) : activeTab?.path ? (
          <>
            <span>{files.length} items</span>
            <span>{dirs} folders, {fileCount} files</span>
          </>
        ) : (
          <span>No folder open</span>
        )}
        {searchQuery && <span style={{ color: 'var(--accent)' }}>Filtering: &ldquo;{searchQuery}&rdquo;</span>}
        {activeTagFilter && <span style={{ color: 'var(--accent)' }}>Tag: {activeTagFilter}</span>}
        {activeTab?.dualPane && <span style={{ color: 'var(--accent)' }}>Dual Pane</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setCommandHistoryOpen(!commandHistoryOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: commandHistoryOpen ? 'var(--accent-bg)' : 'transparent', color: commandHistoryOpen ? 'var(--accent)' : commandHistory.length > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', fontSize: 11 }}
          title="Command History (Ctrl+Shift+H)"
        >
          <History size={12} />
          {commandHistory.length > 0 && <span>{commandHistory.length}</span>}
        </button>
        <button
          onClick={() => setFavoriteCommandsOpen(!favoriteCommandsOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: favoriteCommandsOpen ? 'var(--accent-bg)' : 'transparent', color: favoriteCommandsOpen ? 'var(--accent)' : favoriteCommands.length > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', fontSize: 11 }}
          title="Favorite Commands (Ctrl+Shift+F)"
        >
          <Bookmark size={12} />
          {favoriteCommands.length > 0 && <span>{favoriteCommands.length}</span>}
        </button>
        <button
          onClick={() => setClipboardOpen(!clipboardOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: clipboardOpen ? 'var(--accent-bg)' : 'transparent', color: clipboardOpen ? 'var(--accent)' : clipboardHistory.length > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', fontSize: 11 }}
          title="Clipboard Manager (Ctrl+Shift+V)"
        >
          <Clipboard size={12} />
          {clipboardHistory.length > 0 && <span>{clipboardHistory.length}</span>}
        </button>
        <button
          onClick={() => setProfilesOpen(!profilesOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: profilesOpen ? 'var(--accent-bg)' : 'transparent', color: profilesOpen ? 'var(--accent)' : profiles.length > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', fontSize: 11 }}
          title="Workspace Profiles (Ctrl+Shift+W)"
        >
          <Layers size={12} />
          {profiles.length > 0 && <span>{profiles.length}</span>}
        </button>
        <button
          onClick={() => setUndoHistoryOpen(!undoHistoryOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: undoHistoryOpen ? 'var(--accent-bg)' : 'transparent', color: undoHistoryOpen ? 'var(--accent)' : undoStack.length > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', fontSize: 11 }}
          title="Undo History (Ctrl+Z / Ctrl+Y)"
        >
          <Clock size={12} />
          {undoStack.length > 0 && <span>{undoStack.length}</span>}
        </button>
        <button
          onClick={() => setSyncEnabled(!syncEnabled)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: syncEnabled ? 'var(--accent-bg)' : 'transparent', color: syncEnabled ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', fontSize: 11 }}
          title={syncEnabled ? 'Sync enabled — other windows match this one' : 'Enable multi-window sync (Ctrl+Shift+S)'}
        >
          <Link size={12} />
          {syncEnabled && <span>Sync</span>}
        </button>
        <button
          onClick={() => setTransferOpen(!transferOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: activeTransfers > 0 ? 'var(--accent-bg)' : 'transparent', color: activeTransfers > 0 ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', fontSize: 11 }}
        >
          <ArrowDownToLine size={12} />
          {activeTransfers > 0 && <span>{activeTransfers}</span>}
        </button>
      </div>
    </div>
  )
}

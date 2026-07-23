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
        padding: '3px 12px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 11,
        color: 'var(--text-muted)',
        minHeight: 24,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {loading ? (
          <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
        ) : activeTab?.path ? (
          <>
            <span>{files.length} items</span>
            <span style={{ opacity: 0.6 }}>{dirs} folders, {fileCount} files</span>
          </>
        ) : (
          <span>No folder open</span>
        )}
        {searchQuery && <span style={{ color: 'var(--accent)' }}>Filtering: &ldquo;{searchQuery}&rdquo;</span>}
        {activeTagFilter && <span style={{ color: 'var(--accent)' }}>Tag: {activeTagFilter}</span>}
        {activeTab?.dualPane && <span style={{ color: 'var(--accent)' }}>Dual Pane</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <StatusBtn
          onClick={() => setCommandHistoryOpen(!commandHistoryOpen)}
          active={commandHistoryOpen}
          hasContent={commandHistory.length > 0}
          title="Command History (Ctrl+Shift+H)"
        >
          <History size={11} />
          {commandHistory.length > 0 && <span>{commandHistory.length}</span>}
        </StatusBtn>
        <StatusBtn
          onClick={() => setFavoriteCommandsOpen(!favoriteCommandsOpen)}
          active={favoriteCommandsOpen}
          hasContent={favoriteCommands.length > 0}
          title="Favorite Commands (Ctrl+Shift+F)"
        >
          <Bookmark size={11} />
          {favoriteCommands.length > 0 && <span>{favoriteCommands.length}</span>}
        </StatusBtn>
        <StatusBtn
          onClick={() => setClipboardOpen(!clipboardOpen)}
          active={clipboardOpen}
          hasContent={clipboardHistory.length > 0}
          title="Clipboard Manager (Ctrl+Shift+V)"
        >
          <Clipboard size={11} />
          {clipboardHistory.length > 0 && <span>{clipboardHistory.length}</span>}
        </StatusBtn>
        <StatusBtn
          onClick={() => setProfilesOpen(!profilesOpen)}
          active={profilesOpen}
          hasContent={profiles.length > 0}
          title="Workspace Profiles (Ctrl+Shift+W)"
        >
          <Layers size={11} />
          {profiles.length > 0 && <span>{profiles.length}</span>}
        </StatusBtn>
        <StatusBtn
          onClick={() => setUndoHistoryOpen(!undoHistoryOpen)}
          active={undoHistoryOpen}
          hasContent={undoStack.length > 0}
          title="Undo History (Ctrl+Z / Ctrl+Y)"
        >
          <Clock size={11} />
          {undoStack.length > 0 && <span>{undoStack.length}</span>}
        </StatusBtn>
        <StatusBtn
          onClick={() => setSyncEnabled(!syncEnabled)}
          active={syncEnabled}
          hasContent={false}
          title={syncEnabled ? 'Sync enabled — other windows match this one' : 'Enable multi-window sync (Ctrl+Shift+S)'}
        >
          <Link size={11} />
          {syncEnabled && <span>Sync</span>}
        </StatusBtn>
        <StatusBtn
          onClick={() => setTransferOpen(!transferOpen)}
          active={activeTransfers > 0}
          hasContent={activeTransfers > 0}
          title="Transfer Center"
        >
          <ArrowDownToLine size={11} />
          {activeTransfers > 0 && <span>{activeTransfers}</span>}
        </StatusBtn>
      </div>
    </div>
  )
}

function StatusBtn({
  children,
  onClick,
  active,
  hasContent,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  hasContent: boolean
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--accent-bg)' : 'transparent',
        color: active ? 'var(--accent)' : hasContent ? 'var(--text-secondary)' : 'var(--text-muted)',
        cursor: 'pointer',
        border: 'none',
        fontSize: 10.5,
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = active ? 'var(--accent-bg)' : 'transparent'
      }}
    >
      {children}
    </button>
  )
}

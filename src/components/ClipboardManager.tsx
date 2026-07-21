import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../stores/useStore'
import {
  X,
  Search,
  Star,
  Trash2,
  Clipboard,
  File,
  FileText,
  Trash,
  Clock,
} from 'lucide-react'

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

function isCodeLike(text: string): boolean {
  const codePatterns = [
    /^(import|export|const|let|var|function|class|interface|type|from|return|if|else|for|while)\s/m,
    /[{};]$|=>|\|\||&&/,
    /^\s*(def|class|import|from|return|if|else|for|while|try|except)\s/m,
    /console\.(log|error|warn)/,
    /^\s*<[A-Za-z]/m,
  ]
  return codePatterns.some((p) => p.test(text))
}

export default function ClipboardManager() {
  const clipboardOpen = useStore((s) => s.clipboardOpen)
  const setClipboardOpen = useStore((s) => s.setClipboardOpen)
  const clipboardHistory = useStore((s) => s.clipboardHistory)
  const toggleClipboardFavorite = useStore((s) => s.toggleClipboardFavorite)
  const removeClipboardEntry = useStore((s) => s.removeClipboardEntry)
  const clearClipboardHistory = useStore((s) => s.clearClipboardHistory)
  const copyClipboardEntry = useStore((s) => s.copyClipboardEntry)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (clipboardOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [clipboardOpen])

  const filteredEntries = useMemo(() => {
    let entries = clipboardHistory
    if (showFavoritesOnly) {
      entries = entries.filter((e) => e.favorite)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      entries = entries.filter((e) => {
        if (e.type === 'file') {
          return e.fileNames?.some((n) => n.toLowerCase().includes(q)) ||
            e.filePaths?.some((p) => p.toLowerCase().includes(q))
        }
        return e.content.toLowerCase().includes(q)
      })
    }
    return entries
  }, [clipboardHistory, searchQuery, showFavoritesOnly])

  const handleCopy = useCallback(async (entry: typeof clipboardHistory[0]) => {
    copyClipboardEntry(entry)
    setCopiedId(entry.id)
    setTimeout(() => setCopiedId(null), 1200)
  }, [copyClipboardEntry])

  const handleClear = useCallback(() => {
    if (clipboardHistory.filter((e) => !e.favorite).length === 0) return
    clearClipboardHistory()
  }, [clearClipboardHistory, clipboardHistory])

  if (!clipboardOpen) return null

  const favCount = clipboardHistory.filter((e) => e.favorite).length
  const totalCount = clipboardHistory.length

  return (
    <div
      className="floating-panel"
      style={{
        position: 'fixed',
        top: 32,
        right: 8,
        bottom: 28,
        width: 340,
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>
        <Clipboard size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Clipboard</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>{totalCount} items</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleClear}
          style={{ display: 'flex', padding: 3, borderRadius: 4, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Clear non-favorites"
        >
          <Trash size={13} />
        </button>
        <button
          onClick={() => setClipboardOpen(false)}
          style={{ display: 'flex', padding: 3, borderRadius: 4, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={13} />
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          ref={searchRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clipboard..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 12,
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ display: 'flex', padding: 1, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <TabBtn active={!showFavoritesOnly} onClick={() => setShowFavoritesOnly(false)}>
          All ({totalCount})
        </TabBtn>
        <TabBtn active={showFavoritesOnly} onClick={() => setShowFavoritesOnly(true)}>
          <Star size={10} style={{ marginRight: 3, fill: showFavoritesOnly ? 'var(--accent)' : 'none' }} />
          Pinned ({favCount})
        </TabBtn>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: 4 }}>
        {filteredEntries.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 6, fontSize: 12 }}>
            <Clipboard size={28} style={{ opacity: 0.3 }} />
            <span>{searchQuery ? 'No matches' : showFavoritesOnly ? 'No pinned items' : 'Clipboard is empty'}</span>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                border: '1px solid transparent',
                marginBottom: 2,
              }}
              onClick={() => handleCopy(entry)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.borderColor = 'var(--border-color)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                  {entry.type === 'file' ? (
                    <File size={12} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                  ) : isCodeLike(entry.content) ? (
                    <FileText size={12} style={{ color: '#e67e22', flexShrink: 0, marginTop: 1 }} />
                  ) : (
                    <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {entry.type === 'file'
                      ? (entry.fileNames?.length === 1 ? entry.fileNames[0] : `${entry.fileNames?.length || 0} files`)
                      : truncateText(entry.content.split('\n')[0], 60)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  <ActionBtn
                    onClick={(e) => { e.stopPropagation(); toggleClipboardFavorite(entry.id) }}
                    title={entry.favorite ? 'Unpin' : 'Pin'}
                  >
                    <Star size={11} style={{ fill: entry.favorite ? 'var(--accent)' : 'none', color: entry.favorite ? 'var(--accent)' : 'var(--text-muted)' }} />
                  </ActionBtn>
                  <ActionBtn
                    onClick={(e) => { e.stopPropagation(); removeClipboardEntry(entry.id) }}
                    title="Remove"
                  >
                    <Trash2 size={11} />
                  </ActionBtn>
                </div>
              </div>

              {/* Content preview */}
              {entry.type !== 'file' && (
                <div style={{
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                  fontFamily: isCodeLike(entry.content) ? "'Cascadia Code', monospace" : 'inherit',
                  lineHeight: 1.4,
                  maxHeight: 36,
                  overflow: 'hidden',
                  marginLeft: 18,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {truncateText(entry.content, 120)}
                </div>
              )}
              {entry.type === 'file' && entry.filePaths && entry.filePaths.length > 1 && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 18, lineHeight: 1.3, maxHeight: 32, overflow: 'hidden' }}>
                  {entry.filePaths.slice(0, 3).map((p) => p.split('\\').pop() || p.split('/').pop()).join(', ')}
                  {entry.filePaths.length > 3 && ` +${entry.filePaths.length - 3} more`}
                </div>
              )}

              {/* Timestamp + copy indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 18 }}>
                <Clock size={9} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                <span style={{ fontSize: 9.5, color: 'var(--text-muted)', opacity: 0.6 }}>{formatTime(entry.timestamp)}</span>
                {copiedId === entry.id && (
                  <span style={{ fontSize: 9.5, color: 'var(--accent)', fontWeight: 600, marginLeft: 4 }}>Copied!</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div style={{ padding: '5px 10px', borderTop: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
        Click to copy &middot; Star to pin &middot; Esc close
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        cursor: 'pointer',
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  )
}

function ActionBtn({ onClick, title, children }: { onClick: (e: React.MouseEvent) => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        padding: 2,
        borderRadius: 3,
        color: 'var(--text-muted)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        opacity: 0.5,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

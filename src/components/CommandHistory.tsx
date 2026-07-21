import { useState, useMemo } from 'react'
import { useStore } from '../stores/useStore'
import { History, Star, Trash2, X, RotateCcw, File, Folder, Tag, Palette, Copy, Scissors, Archive, Pencil, Plus } from 'lucide-react'

const TYPE_ICONS: Record<string, typeof History> = {
  delete: Trash2,
  rename: Pencil,
  move: Scissors,
  copy: Copy,
  cut: Scissors,
  replace: RotateCcw,
  tag: Tag,
  color: Palette,
  compress: Archive,
  'create-folder': Folder,
  'create-file': File,
}

const TYPE_COLORS: Record<string, string> = {
  delete: '#e74c3c',
  rename: '#f39c12',
  move: '#3498db',
  copy: '#2ecc71',
  cut: '#e67e22',
  replace: '#9b59b6',
  tag: '#1abc9c',
  color: '#e91e63',
  compress: '#00bcd4',
  'create-folder': '#8bc34a',
  'create-file': '#607d8b',
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(ts).toLocaleDateString()
}

export default function CommandHistory() {
  const open = useStore((s) => s.commandHistoryOpen)
  const setOpen = useStore((s) => s.setCommandHistoryOpen)
  const history = useStore((s) => s.commandHistory)
  const toggleFavorite = useStore((s) => s.toggleCommandFavorite)
  const clearHistory = useStore((s) => s.clearCommandHistory)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const undoStack = useStore((s) => s.undoStack)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = filter === 'favorites' ? history.filter((e) => e.favorite) : history
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((e) => e.description.toLowerCase().includes(q))
    }
    return list
  }, [history, filter, search])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)}>
      <div className="floating-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', width: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Command History</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 10 }}>{history.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {undoStack.length > 0 && (
              <button onClick={() => { undo(); undo() }} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '3px 8px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Undo last">
                <RotateCcw size={11} /> Undo
              </button>
            )}
            <button onClick={clearHistory} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '3px 8px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }} title="Clear non-favorites">
              <Trash2 size={11} />
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={16} /></button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div style={{ padding: '8px 12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            {(['all', 'favorites'] as const).map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)} style={{ flex: 1, padding: '4px 0', fontSize: 11.5, fontWeight: 500, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 150ms', background: filter === tab ? 'var(--bg-secondary)' : 'transparent', color: filter === tab ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {tab === 'all' ? 'All' : 'Favorites'}
              </button>
            ))}
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search commands..." style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              {history.length === 0 ? 'No commands recorded yet' : 'No matching commands'}
            </div>
          ) : (
            filtered.map((entry) => {
              const Icon = TYPE_ICONS[entry.type] || History
              const color = TYPE_COLORS[entry.type] || 'var(--text-muted)'
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'default', transition: 'background 100ms' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.description}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(entry.timestamp)}</div>
                  </div>
                  <button onClick={() => toggleFavorite(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: entry.favorite ? '#f39c12' : 'var(--text-muted)', opacity: entry.favorite ? 1 : 0.5, transition: 'opacity 100ms' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = entry.favorite ? '1' : '0.5'}>
                    <Star size={12} fill={entry.favorite ? '#f39c12' : 'none'} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

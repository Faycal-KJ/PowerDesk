import { useState } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { Bookmark, X, GripVertical, Archive, Share2, Pencil, FolderSearch, Terminal, Plus, Trash2 } from 'lucide-react'

const COMMAND_TYPES = [
  { value: 'compress' as const, label: 'Compress', icon: Archive },
  { value: 'share' as const, label: 'Share', icon: Share2 },
  { value: 'analyze' as const, label: 'Analyze Folder', icon: FolderSearch },
  { value: 'open-terminal' as const, label: 'Open Terminal', icon: Terminal },
  { value: 'rename' as const, label: 'Batch Rename', icon: Pencil },
]

export default function FavoriteCommands() {
  const open = useStore((s) => s.favoriteCommandsOpen)
  const setOpen = useStore((s) => s.setFavoriteCommandsOpen)
  const commands = useStore((s) => s.favoriteCommands)
  const addCmd = useStore((s) => s.addFavoriteCommand)
  const removeCmd = useStore((s) => s.removeFavoriteCommand)
  const reorderCmds = useStore((s) => s.reorderFavoriteCommands)
  const activeTab = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<string>('compress')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const executeCommand = (cmd: typeof commands[0]) => {
    const api = getApi()
    const dir = activeTab?.path
    if (!api || !dir) return
    switch (cmd.type) {
      case 'compress': api.openPath?.(`explorer.exe /select,"${dir}"`); break
      case 'analyze': useStore.getState().openFolderAnalysis(dir); break
      case 'open-terminal': useStore.getState().setOpenTool('terminal'); break
      case 'rename': break
      case 'share': break
      case 'open-vscode': break
      case 'compare': break
      case 'custom': break
    }
    setOpen(false)
  }

  const handleAdd = () => {
    if (!newLabel.trim()) return
    addCmd({ label: newLabel.trim(), type: newType as any, icon: newType })
    setNewLabel('')
    setNewType('compress')
    setAdding(false)
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)}>
      <div className="floating-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', width: 380, maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bookmark size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Favorite Commands</span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => setAdding(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: 11, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={11} /> Add
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={16} /></button>
          </div>
        </div>

        {/* Add form */}
        {adding && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Command name..." onKeyDown={(e) => e.key === 'Enter' && handleAdd()} autoFocus style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {COMMAND_TYPES.map((ct) => (
                <button key={ct.value} onClick={() => setNewType(ct.value)} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 'var(--radius-sm)', border: '1px solid', borderColor: newType === ct.value ? 'var(--accent)' : 'var(--border-color)', background: newType === ct.value ? 'var(--accent-bg)' : 'transparent', color: newType === ct.value ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ct.icon size={11} /> {ct.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => setAdding(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontSize: 11.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontSize: 11.5, color: '#fff', cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {commands.length === 0 && !adding ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No favorite commands yet. Click Add to create one.
            </div>
          ) : (
            commands.map((cmd, idx) => {
              const ct = COMMAND_TYPES.find((c) => c.value === cmd.type)
              const Icon = ct?.icon || Bookmark
              const isDragOver = dragOverIdx === idx && dragIdx !== null && dragIdx !== idx
              return (
                <div
                  key={cmd.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
                  onDrop={() => { if (dragIdx !== null && dragIdx !== idx) reorderCmds(dragIdx, idx); setDragIdx(null); setDragOverIdx(null) }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer', background: isDragOver ? 'var(--accent-bg)' : 'transparent', borderLeft: isDragOver ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 100ms' }}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={(e) => { if (!isDragOver) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { if (!isDragOver) e.currentTarget.style.background = 'transparent' }}
                >
                  <GripVertical size={12} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0, opacity: 0.5 }} />
                  <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-primary)' }}>{cmd.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeCmd(cmd.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', opacity: 0, transition: 'opacity 100ms' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                    <Trash2 size={11} />
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

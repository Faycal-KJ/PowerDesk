import { useStore } from "../stores/useStore"
import { Undo2, Redo2, Trash2, FileText, FolderPlus, FolderInput, Palette, Tag, Archive, X, Clock } from "lucide-react"

const TYPE_ICONS: Record<string, any> = {
  delete: Trash2,
  rename: FileText,
  move: FolderInput,
  copy: FileText,
  replace: FileText,
  tag: Tag,
  color: Palette,
  compress: Archive,
  'create-folder': FolderPlus,
  'create-file': FileText,
}

const TYPE_COLORS: Record<string, string> = {
  delete: 'var(--danger)',
  rename: 'var(--accent)',
  move: '#3498db',
  copy: '#2ecc71',
  replace: '#e74c3c',
  tag: '#f39c12',
  color: '#9b59b6',
  compress: '#e67e22',
  'create-folder': '#2ecc71',
  'create-file': '#3498db',
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function UndoHistory() {
  const open = useStore((s) => s.undoHistoryOpen)
  const setOpen = useStore((s) => s.setUndoHistoryOpen)
  const undoStack = useStore((s) => s.undoStack)
  const redoStack = useStore((s) => s.redoStack)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)

  if (!open) return null

  const all = [...undoStack].reverse()

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 1500 }} onClick={() => setOpen(false)} />
      <div
        className="floating-panel"
        style={{
          position: "fixed",
          right: 12,
          bottom: 40,
          zIndex: 1501,
          width: 340,
          maxHeight: 480,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>History</span>
            {undoStack.length > 0 && (
              <span style={{ fontSize: 10.5, color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "1px 6px", borderRadius: 8 }}>
                {undoStack.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <QuickAction icon={<Undo2 size={13} />} label="Undo" disabled={undoStack.length === 0} onClick={undo} />
            <QuickAction icon={<Redo2 size={13} />} label="Redo" disabled={redoStack.length === 0} onClick={redo} />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
          {all.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 12.5 }}>
              No history yet
            </div>
          ) : (
            all.map((entry, idx) => {
              const Icon = TYPE_ICONS[entry.type] || FileText
              const color = TYPE_COLORS[entry.type] || 'var(--text-muted)'
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 16px",
                    fontSize: 12.5,
                    opacity: 1,
                  }}
                >
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: "var(--radius-sm)",
                    background: color + '18',
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.description}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}>
                      {timeAgo(entry.timestamp)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

function QuickAction({ icon, label, disabled, onClick }: {
  icon: React.ReactNode; label: string; disabled: boolean; onClick: () => void
}) {
  return (
    <button
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        fontSize: 11,
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-tertiary)",
        color: disabled ? "var(--text-muted)" : "var(--text-primary)",
        border: "1px solid var(--border-subtle)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {icon}{label}
    </button>
  )
}

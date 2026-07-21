import { useStore } from "../stores/useStore"
import { AlertTriangle, Replace, SkipForward, FilePlus, Check } from "lucide-react"

export default function ConflictDialog() {
  const pasteConflicts = useStore((s) => s.pasteConflicts)
  const resolvePasteConflicts = useStore((s) => s.resolvePasteConflicts)
  const _pastePerFileActions = useStore((s) => s._pastePerFileActions)
  const setPastePerFileAction = useStore((s) => s.setPastePerFileAction)

  if (!pasteConflicts || pasteConflicts.length === 0) return null

  const handleApplyAll = (action: 'replace' | 'skip' | 'rename') => {
    resolvePasteConflicts({ action, applyToAll: true })
  }

  const handleConfirm = () => {
    resolvePasteConflicts({ action: 'replace', applyToAll: false })
  }

  const handleCancel = () => {
    resolvePasteConflicts(null)
  }

  const getAction = (idx: number): 'replace' | 'skip' | 'rename' => {
    return _pastePerFileActions[idx] || 'skip'
  }

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={handleCancel}
      />
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2001,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: 0,
          minWidth: 440,
          maxWidth: 560,
          maxHeight: "80vh",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <AlertTriangle size={18} style={{ color: "#f39c12" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              {pasteConflicts.length} {pasteConflicts.length === 1 ? "file" : "files"} already exist
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            Choose how to handle conflicting files:
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "8px 0", maxHeight: 320 }}>
          {pasteConflicts.map((conflict, idx) => (
            <div
              key={conflict.dest}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 20px",
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  flex: 1,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={conflict.dest}
              >
                {conflict.name}
              </span>
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                <ActionBtn
                  icon={<Replace size={12} />}
                  label="Replace"
                  active={getAction(idx) === "replace"}
                  color="var(--danger)"
                  onClick={() => setPastePerFileAction(idx, "replace")}
                />
                <ActionBtn
                  icon={<SkipForward size={12} />}
                  label="Skip"
                  active={getAction(idx) === "skip"}
                  color="var(--text-secondary)"
                  onClick={() => setPastePerFileAction(idx, "skip")}
                />
                <ActionBtn
                  icon={<FilePlus size={12} />}
                  label="Rename"
                  active={getAction(idx) === "rename"}
                  color="var(--accent)"
                  onClick={() => setPastePerFileAction(idx, "rename")}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 20px 14px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
          {pasteConflicts.length > 1 && (
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: "24px", marginRight: 4 }}>Apply to all:</span>
              <QuickBtn label="Replace All" color="var(--danger)" onClick={() => handleApplyAll("replace")} />
              <QuickBtn label="Skip All" color="var(--text-secondary)" onClick={() => handleApplyAll("skip")} />
              <QuickBtn label="Rename All" color="var(--accent)" onClick={() => handleApplyAll("rename")} />
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={handleCancel}
              style={{
                padding: "6px 16px",
                fontSize: 12.5,
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              style={{
                padding: "6px 16px",
                fontSize: 12.5,
                borderRadius: "var(--radius-sm)",
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={13} /> Confirm
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ActionBtn({ icon, label, active, color, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "3px 7px",
        fontSize: 10.5,
        borderRadius: "var(--radius-sm)",
        background: active ? color : "transparent",
        color: active ? "#fff" : "var(--text-muted)",
        border: active ? "none" : "1px solid var(--border-color)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = color }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--border-color)" }}
    >
      {icon}{label}
    </button>
  )
}

function QuickBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 10px",
        fontSize: 11,
        borderRadius: "var(--radius-sm)",
        background: "transparent",
        color: color,
        border: `1px solid ${color}40`,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = `${color}15`}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      {label}
    </button>
  )
}

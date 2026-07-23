import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useStore } from "../stores/useStore"
import { FolderPlus, FilePlus, Clipboard, RefreshCw, FolderSearch, Star } from "lucide-react"
import { PluginBackgroundContextItems } from "../plugins/ExtensionPoint"

export default function BackgroundContextMenu() {
  const bgContextMenu = useStore((s) => s.bgContextMenu)
  const setBgContextMenu = useStore((s) => s.setBgContextMenu)
  const createFolder = useStore((s) => s.createFolder)
  const createFile = useStore((s) => s.createFile)
  const pasteClipboard = useStore((s) => s.pasteClipboard)
  const clipboardItems = useStore((s) => s.clipboardItems)
  const refresh = useStore((s) => s.refresh)
  const setFolderAnalysisOpen = useStore((s) => s.setFolderAnalysisOpen)
  const activeTab = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId))

  const [creating, setCreating] = useState<"folder" | "file" | null>(null)
  const [newName, setNewName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const x = bgContextMenu?.x ?? 0
  const y = bgContextMenu?.y ?? 0

  useEffect(() => {
    if (creating) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [creating])

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el || !bgContextMenu) return
    const rect = el.getBoundingClientRect()
    let left = x
    let top = y
    if (left + rect.width > window.innerWidth - 4) left = Math.max(4, window.innerWidth - rect.width - 4)
    if (top + rect.height > window.innerHeight - 4) top = Math.max(4, window.innerHeight - rect.height - 4)
    el.style.left = left + 'px'
    el.style.top = top + 'px'
  })

  if (!bgContextMenu) return null

  const currentDir = activeTab?.path || ""

  const close = () => {
    setBgContextMenu(null)
    setCreating(null)
    setNewName("")
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    if (creating === "folder") {
      await createFolder(newName.trim())
    } else if (creating === "file") {
      await createFile(newName.trim())
    }
    close()
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={close} onContextMenu={(e) => { e.preventDefault(); close() }} />
      <div ref={menuRef} className="floating-panel" style={{ position: "fixed", left: x, top: y, zIndex: 1000, background: "var(--surface-flyout)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-lg)", padding: "8px 0", minWidth: 180, boxShadow: "0 2px 4px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.22)", backdropFilter: "blur(48px) saturate(150%)" }} onClick={(e) => e.stopPropagation()}>

        {creating && (
          <div style={{ padding: "4px 8px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
              {creating === "folder" ? "Folder name:" : "File name:"}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                  if (e.key === "Escape") close()
                }}
                placeholder={creating === "folder" ? "New Folder" : "newfile.txt"}
                style={{
                  flex: 1,
                  background: "var(--bg-primary)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "var(--radius-md)",
                  padding: "5px 10px",
                  fontSize: 12,
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
              <button
                onClick={handleCreate}
                style={{
                  padding: '5px 12px',
                  fontSize: 11,
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent)",
                  color: "#fff",
                  transition: "background 150ms ease",
                }}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {!creating && (
          <>
            <MenuItem
              icon={<FolderPlus size={13} />}
              label="New Folder"
              onClick={() => { setCreating("folder"); setNewName("New Folder") }}
            />
            <MenuItem
              icon={<FilePlus size={13} />}
              label="New File"
              onClick={() => { setCreating("file"); setNewName("newfile.txt") }}
            />
            {clipboardItems.length > 0 && currentDir && (
              <>
                <Sep />
                <MenuItem
                  icon={<Clipboard size={13} />}
                  label="Paste here"
                  onClick={() => { pasteClipboard(currentDir); close() }}
                />
              </>
            )}
            <Sep />
            <MenuItem
              icon={<RefreshCw size={13} />}
              label="Refresh"
              onClick={() => { refresh(); close() }}
            />
            {currentDir && (
              <>
                <Sep />
                <MenuItem
                  icon={<Star size={13} />}
                  label={useStore.getState().favorites.some((f) => f.path === currentDir) ? "Remove from Favorites" : "Add to Favorites"}
                  onClick={() => {
                    const state = useStore.getState()
                    if (state.favorites.some((f) => f.path === currentDir)) {
                      state.removeFavorite(currentDir)
                    } else {
                      state.addFavorite(currentDir, 'folder')
                    }
                    close()
                  }}
                />
                <MenuItem
                  icon={<FolderSearch size={13} />}
                  label="Analyze Folder"
                  onClick={() => { useStore.getState().openFolderAnalysis(currentDir); close() }}
                />
              </>
            )}
          </>
        )}
        {!creating && <PluginBackgroundContextItems onAction={close} />}
      </div>
    </>
  )
}

function MenuItem({ icon, label, danger, onClick }: { icon?: React.ReactElement; label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "8px 18px",
        fontSize: 12.5,
        fontWeight: 400,
        color: danger ? "var(--danger)" : "var(--text-primary)",
        background: "transparent",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        transition: "background 120ms ease",
        letterSpacing: "0.1px",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = "var(--bg-hover)" }}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      {icon}{label}
    </button>
  )
}

function Sep() {
  return <div style={{ height: 1, background: "var(--border-subtle)", margin: "5px 0" }} />
}

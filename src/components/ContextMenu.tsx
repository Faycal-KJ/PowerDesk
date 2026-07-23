import { useState, useRef, useLayoutEffect } from "react"
import { useStore } from "../stores/useStore"
import { getApi } from '../lib/api'
import {
  File, Copy, Clipboard, Pencil, Trash2, Scissors, Palette, Star, Tag, X, Share2, Bot, Workflow, FolderSearch, Bookmark
} from "lucide-react"
import { PluginContextMenuItems } from '../plugins/ExtensionPoint'

const COLORS = [
  { label: "None", value: undefined as string | undefined, color: "var(--text-muted)" },
  { label: "Red", value: "#e74c3c", color: "#e74c3c" },
  { label: "Orange", value: "#e67e22", color: "#e67e22" },
  { label: "Yellow", value: "#f1c40f", color: "#f1c40f" },
  { label: "Green", value: "#2ecc71", color: "#2ecc71" },
  { label: "Blue", value: "#3498db", color: "#3498db" },
  { label: "Purple", value: "#9b59b6", color: "#9b59b6" },
]

export default function ContextMenu() {
  const contextTarget = useStore((s) => s.contextTarget)
  const setContextTarget = useStore((s) => s.setContextTarget)
  const setClipboard = useStore((s) => s.setClipboard)
  const pasteClipboard = useStore((s) => s.pasteClipboard)
  const clipboardItems = useStore((s) => s.clipboardItems)
  const deleteFile = useStore((s) => s.deleteFile)
  const renameFile = useStore((s) => s.renameFile)
  const setColor = useStore((s) => s.setColor)
  const setPreviewFile = useStore((s) => s.setPreviewFile)
  const activeTab = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const navigateTo = useStore((s) => s.navigateTo)

  const selectedPathsForContext = useStore((s) => s.selectedPathsForContext)

  const addFavorite = useStore((s) => s.addFavorite)
  const removeFavoriteFromStore = useStore((s) => s.removeFavorite)

  const [showColors, setShowColors] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const renameRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [newTagValue, setNewTagValue] = useState("")
  const addTagToFile = useStore((s) => s.addTagToFile)
  const removeTagFromFile = useStore((s) => s.removeTagFromFile)
  const setPropertiesFile = useStore((s) => s.setPropertiesFile)
  const addFolderBookmark = useStore((s) => s.addFavorite)

  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el || !contextTarget) return
    const rect = el.getBoundingClientRect()
    let left = contextTarget.x
    let top = contextTarget.y
    if (left + rect.width > window.innerWidth - 4) left = Math.max(4, window.innerWidth - rect.width - 4)
    if (top + rect.height > window.innerHeight - 4) top = Math.max(4, window.innerHeight - rect.height - 4)
    el.style.left = left + 'px'
    el.style.top = top + 'px'
  })

  if (!contextTarget) return null

  const { item, x, y } = contextTarget
  const isDir = item.isDirectory
  const parentDir = activeTab?.path || ""
  const isFavorited = useStore.getState().favorites.some((f) => f.path === item.path)

  const close = () => {
    setContextTarget(null)
    setShowColors(false)
    setRenaming(false)
  }

  const handleRename = () => {
    setRenaming(true)
    setRenameValue(item.name)
  }

  const submitRename = () => {
    if (renameValue.trim() && renameValue !== item.name) {
      renameFile(item.path, renameValue.trim())
    }
    setRenaming(false)
    close()
  }

  const toggleFavorite = () => {
    if (isFavorited) {
      removeFavoriteFromStore(item.path)
    } else {
      addFavorite(item.path, isDir ? 'folder' : 'file')
    }
    close()
  }

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 1000,
    background: "var(--surface-flyout)",
    border: "1px solid var(--border-card)",
    borderRadius: "var(--radius-lg)",
    padding: "6px 0",
    minWidth: 210,
    boxShadow: "var(--shadow-lg)",
    backdropFilter: "blur(40px) saturate(160%)",
    WebkitBackdropFilter: "blur(40px) saturate(160%)",
    animation: "scale-in 150ms cubic-bezier(0.33, 0, 0.67, 1)",
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={close} onContextMenu={(e) => { e.preventDefault(); close() }} />
      <div ref={menuRef} style={menuStyle} onClick={(e) => e.stopPropagation()}>

        {renaming ? (
          <div style={{ padding: "4px 10px" }}>
            <input ref={renameRef} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setRenaming(false) }} onBlur={() => setRenaming(false)} style={{ width: "100%", background: "var(--bg-tertiary)", border: "1px solid var(--accent)", borderRadius: "var(--radius-sm)", padding: "4px 8px", fontSize: 12.5, color: "var(--text-primary)", outline: "none" }} />
          </div>
        ) : null}

        <MenuItem icon={<File size={13} />} label="Open" onClick={() => {
          if (isDir) { navigateTo(item.path); close() }
          else { setPreviewFile(item); close() }
        }} />

        <Sep />

        <MenuItem icon={<Copy size={13} />} label={selectedPathsForContext.length > 1 ? `Copy (${selectedPathsForContext.length})` : "Copy"} onClick={() => { setClipboard(selectedPathsForContext.length > 0 ? selectedPathsForContext : [item.path], "copy"); close() }} />
        <MenuItem icon={<Scissors size={13} />} label={selectedPathsForContext.length > 1 ? `Cut (${selectedPathsForContext.length})` : "Cut"} onClick={() => { setClipboard(selectedPathsForContext.length > 0 ? selectedPathsForContext : [item.path], "cut"); close() }} />
        {clipboardItems.length > 0 && (
          <MenuItem icon={<Clipboard size={13} />} label="Paste here" onClick={() => { pasteClipboard(isDir ? item.path : parentDir); close() }} />
        )}
        <MenuItem icon={<Pencil size={13} />} label="Rename" onClick={handleRename} />
        <MenuItem icon={<Trash2 size={13} />} label="Delete" danger onClick={async () => { await deleteFile(item.path); close() }} />

        <Sep />

        {isDir && (
          <>
            <div style={{ position: "relative" }}>
              <MenuItem icon={<Palette size={13} />} label="Color Label" onClick={() => setShowColors(!showColors)} />
              {showColors && (
                <div style={{ position: "absolute", left: "100%", top: 0, marginLeft: 6, background: "var(--surface-flyout)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "6px", boxShadow: "var(--shadow-lg)", zIndex: 1001, minWidth: 130, backdropFilter: "blur(40px) saturate(160%)" }}>
                  {COLORS.map((c) => (
                    <button key={c.label} onClick={async () => { await setColor(parentDir, item.name, c.value); close() }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "5px 8px", fontSize: 12, borderRadius: "var(--radius-sm)", color: "var(--text-primary)", background: item.color === c.value ? "var(--bg-active)" : "transparent", transition: "background 100ms ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => { if (item.color !== c.value) e.currentTarget.style.background = "transparent" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color || "transparent", border: c.value ? "none" : "1px solid var(--text-muted)" }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <MenuItem icon={<Star size={13} />} label={isFavorited ? "Remove Favorite" : "Add to Favorites"} onClick={toggleFavorite} />
          </>
        )}

        {!isDir && (
          <>
            <Sep />
            <div style={{ position: "relative" }}>
              <MenuItem icon={<Tag size={13} />} label={selectedPathsForContext.length > 1 ? `Manage Tags (${selectedPathsForContext.length})` : "Manage Tags"} onClick={() => setShowTags(!showTags)} />
              {showTags && (
                <div style={{ position: "absolute", left: "100%", top: 0, marginLeft: 6, background: "var(--surface-flyout)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "10px", boxShadow: "var(--shadow-lg)", zIndex: 1001, minWidth: 210, backdropFilter: "blur(40px) saturate(160%)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                    {selectedPathsForContext.length > 1
                      ? `Tags for ${selectedPathsForContext.length} files`
                      : `Tags for this file`}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: "var(--accent-bg)",
                            color: "var(--accent)",
                            border: "1px solid rgba(124, 92, 252, 0.2)",
                          }}
                        >
                          {tag}
                          <button
                            onClick={async () => {
                              for (const p of selectedPathsForContext) {
                                const sep = p.includes("\\") ? "\\" : "/"
                                const parts = p.split(sep)
                                const fileName = parts.pop()!
                                const dir = parts.join(sep)
                                await removeTagFromFile(dir, fileName, tag)
                              }
                            }}
                            style={{ display: "flex", color: "var(--accent)", padding: 0 }}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      ref={tagInputRef}
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && newTagValue.trim()) {
                          for (const p of selectedPathsForContext) {
                            const sep = p.includes("\\") ? "\\" : "/"
                            const parts = p.split(sep)
                            const fileName = parts.pop()!
                            const dir = parts.join(sep)
                            await addTagToFile(dir, fileName, newTagValue.trim())
                          }
                          setNewTagValue("")
                        }
                        if (e.key === "Escape") {
                          setShowTags(false)
                          setNewTagValue("")
                        }
                      }}
                      placeholder="Add tag..."
                      style={{
                        flex: 1,
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-card)",
                        borderRadius: "var(--radius-sm)",
                        padding: "4px 8px",
                        fontSize: 11,
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (newTagValue.trim()) {
                          for (const p of selectedPathsForContext) {
                            const sep = p.includes("\\") ? "\\" : "/"
                            const parts = p.split(sep)
                            const fileName = parts.pop()!
                            const dir = parts.join(sep)
                            await addTagToFile(dir, fileName, newTagValue.trim())
                          }
                          setNewTagValue("")
                        }
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--accent)",
                        color: "#fff",
                        transition: "background 150ms ease",
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Sep />
        <MenuItem
          icon={<File size={13} />}
          label="Compress to ZIP"
          onClick={async () => {
            const api = getApi()
            if (!api) return
            const paths = selectedPathsForContext?.length ? selectedPathsForContext : (item ? [item.path] : [])
            if (!paths.length) return
            const dir = item ? item.path.substring(0, item.path.lastIndexOf('\\') !== -1 ? item.path.lastIndexOf('\\') : item.path.lastIndexOf('/')) : ''
            const zipPath = dir + '\\archive.zip'
            await api.compressFiles(paths, zipPath)
            close()
          }}
        />
        <MenuItem
          icon={<Bookmark size={13} />}
          label="Bookmark This File"
          onClick={() => {
            addFolderBookmark(item.path, 'file')
            close()
          }}
        />
        <MenuItem
          icon={<Share2 size={13} />}
          label="Share (Copy Path)"
          onClick={() => {
            const paths = selectedPathsForContext?.length ? selectedPathsForContext : (item ? [item] : [])
            if (paths.length) {
              navigator.clipboard.writeText(paths.join('\n'))
            }
            close()
          }}
        />
        {isDir && (
          <MenuItem
            icon={<FolderSearch size={13} />}
            label="Analyze Folder"
            onClick={() => {
              useStore.getState().openFolderAnalysis(item!.path)
              close()
            }}
          />
        )}
        <Sep />
        <MenuItem
          icon={<Bot size={13} />}
          label="Run AI Action"
          muted
        />
        <MenuItem
          icon={<Workflow size={13} />}
          label="Automation"
          muted
        />
        <PluginContextMenuItems onAction={close} />
        <Sep />
        <MenuItem
          icon={<File size={13} />}
          label="Properties"
          onClick={() => {
            setPropertiesFile(item)
            close()
          }}
        />
      </div>
    </>
  )
}

function MenuItem({ icon, label, danger, muted, onClick }: { icon?: React.ReactElement; label: string; danger?: boolean; muted?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 14px", fontSize: 12.5, color: danger ? "var(--danger)" : muted ? "var(--text-muted)" : "var(--text-primary)", background: "transparent", textAlign: "left", cursor: onClick ? "pointer" : "default", borderRadius: 0, transition: "background 100ms ease" }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = "var(--bg-hover)" }} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      {icon}{label}
    </button>
  )
}

function SubMenu({ icon, label, children }: { icon?: React.ReactElement; label: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }} onMouseEnter={(e) => { const sub = e.currentTarget.querySelector("[data-submenu]") as HTMLElement; if (sub) sub.style.display = "block" }} onMouseLeave={(e) => { const sub = e.currentTarget.querySelector("[data-submenu]") as HTMLElement; if (sub) sub.style.display = "none" }}>
      <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 14px", fontSize: 12.5, color: "var(--text-primary)", background: "transparent", textAlign: "left", cursor: "pointer", transition: "background 100ms ease" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
        {icon}{label}
      </button>
      <div data-submenu style={{ display: "none", position: "absolute", left: "100%", top: 0, marginLeft: 6, background: "var(--surface-flyout)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "6px 0", boxShadow: "var(--shadow-lg)", zIndex: 1002, minWidth: 180, backdropFilter: "blur(40px) saturate(160%)" }}>
        {children}
      </div>
    </div>
  )
}

function Sep() {
  return <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
}

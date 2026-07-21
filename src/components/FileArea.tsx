import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { Folder } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'
import GridView from './fileviews/GridView'
import GalleryView from './fileviews/GalleryView'
import ListView from './fileviews/ListView'
import { imageExts, useThumbnailCache, sortFiles, rectsIntersect } from '../lib/fileAreaUtils'
import type { FileItem } from '../types'

export default function FileArea({ pane, tabId }: { pane?: 'left' | 'right' | 'single'; tabId?: string }) {
  const globalFiles = useStore((s) => s.files)
  const loading = useStore((s) => s.loading)
  const allTabs = useStore((s) => s.tabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const navigateTo = useStore((s) => s.navigateTo)
  const setContextTarget = useStore((s) => s.setContextTarget)
  const searchQuery = useStore((s) => s.searchQuery)
  const iconSize = useStore((s) => s.iconSize)
  const showThumbnails = useStore((s) => s.showThumbnails)
  const activeTagFilter = useStore((s) => s.activeTagFilter)
  const folderSizes = useStore((s) => s.folderSizes)

  const resolvedTabId = tabId || activeTabId
  const tab = allTabs.find((t) => t.id === resolvedTabId)

  const [localFiles, setLocalFiles] = useState<FileItem[]>([])
  const [localLoading, setLocalLoading] = useState(false)

  const isActiveTab = resolvedTabId === activeTabId
  const files = isActiveTab ? globalFiles : localFiles
  const isLoading = isActiveTab ? loading : localLoading

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [batchRenameOpen, setBatchRenameOpen] = useState(false)
  const renameFile = useStore((s) => s.renameFile)
  const deleteFile = useStore((s) => s.deleteFile)
  const refresh = useStore((s) => s.refresh)
  const setPreviewFile = useStore((s) => s.setPreviewFile)
  const setSelectedPathsForContext = useStore((s) => s.setSelectedPathsForContext)
  const setBgContextMenu = useStore((s) => s.setBgContextMenu)
  const focusedFileIndex = useStore((s) => s.focusedFileIndex)
  const setFocusedFileIndex = useStore((s) => s.setFocusedFileIndex)
  const clipboardItems = useStore((s) => s.clipboardItems)
  const setClipboard = useStore((s) => s.setClipboard)
  const pasteClipboard = useStore((s) => s.pasteClipboard)

  const [dragOverPath, setDragOverPath] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [dragSelect, setDragSelect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const isDragging = useRef(false)

  const getItemRect = useCallback((path: string): DOMRect | null => {
    const el = itemRefs.current.get(path)
    if (!el || !containerRef.current) return null
    const containerRect = containerRef.current.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    return new DOMRect(elRect.left - containerRect.left, elRect.top - containerRect.top, elRect.width, elRect.height)
  }, [])

  const computeDragSelection = useCallback(() => {
    if (!dragSelect || !containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const sel = {
      left: Math.min(dragSelect.startX, dragSelect.endX) - containerRect.left,
      top: Math.min(dragSelect.startY, dragSelect.endY) - containerRect.top,
      right: Math.max(dragSelect.startX, dragSelect.endX) - containerRect.left,
      bottom: Math.max(dragSelect.startY, dragSelect.endY) - containerRect.top,
    }
    const newSelected = new Set<string>()
    for (const file of (isActiveTab ? globalFiles : localFiles)) {
      const rect = getItemRect(file.path)
      if (rect && rectsIntersect(rect, sel)) newSelected.add(file.path)
    }
    setSelectedPaths(newSelected)
    setSelectedPathsForContext(Array.from(newSelected))
  }, [dragSelect, isActiveTab, globalFiles, localFiles, getItemRect, setSelectedPathsForContext])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    const target = e.target as HTMLElement
    if (target.closest('[data-file-item]')) return
    if (target.closest('[data-thumb-toggle]')) return

    isDragging.current = true
    const startX = e.clientX
    const startY = e.clientY
    setDragSelect({ startX, startY, endX: startX, endY: startY })
    if (!e.ctrlKey && !e.metaKey) {
      setSelectedPaths(new Set())
      setSelectedPathsForContext([])
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      setDragSelect((prev) => prev ? { ...prev, endX: ev.clientX, endY: ev.clientY } : null)
    }
    const handleMouseUp = () => {
      isDragging.current = false
      setDragSelect(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  useEffect(() => {
    if (!dragSelect) return
    const raf = requestAnimationFrame(computeDragSelection)
    return () => cancelAnimationFrame(raf)
  }, [dragSelect, computeDragSelection])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        const path = selectedPaths.size === 1 ? selectedPaths.values().next().value : null
        if (path) {
          const file = (isActiveTab ? globalFiles : localFiles).find((f) => f.path === path)
          if (file) setPreviewFile(file)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedPaths, isActiveTab, globalFiles, localFiles, setPreviewFile])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const source = isActiveTab ? globalFiles : localFiles
      const sorted = sortFiles(source)
      if (sorted.length === 0) return

      const idx = focusedFileIndex

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        const newIdx = idx < sorted.length - 1 ? idx + 1 : 0
        setFocusedFileIndex(newIdx)
        const newPath = sorted[newIdx].path
        setSelectedPaths(new Set([newPath]))
        setSelectedPathsForContext([newPath])
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const newIdx = idx > 0 ? idx - 1 : sorted.length - 1
        setFocusedFileIndex(newIdx)
        const newPath = sorted[newIdx].path
        setSelectedPaths(new Set([newPath]))
        setSelectedPathsForContext([newPath])
      } else if (e.key === 'Home') {
        e.preventDefault()
        setFocusedFileIndex(0)
        const newPath = sorted[0].path
        setSelectedPaths(new Set([newPath]))
        setSelectedPathsForContext([newPath])
      } else if (e.key === 'End') {
        e.preventDefault()
        const newIdx = sorted.length - 1
        setFocusedFileIndex(newIdx)
        const newPath = sorted[newIdx].path
        setSelectedPaths(new Set([newPath]))
        setSelectedPathsForContext([newPath])
      } else if (e.key === 'Enter' && idx >= 0 && idx < sorted.length) {
        e.preventDefault()
        const file = sorted[idx]
        if (file.isDirectory) navigateTo(file.path, resolvedTabId)
        else setPreviewFile(file)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        if (tab?.path) {
          const sep = tab.path.includes('\\') ? '\\' : '/'
          const parts = tab.path.split(sep)
          parts.pop()
          navigateTo(parts.join(sep) || sep, resolvedTabId)
        }
      } else if (e.key === 'Delete') {
        e.preventDefault()
        const paths = selectedPaths.size > 1 ? Array.from(selectedPaths) : (idx >= 0 && idx < sorted.length ? [sorted[idx].path] : [])
        for (const p of paths) deleteFile(p)
      } else if (e.key === 'F2' && idx >= 0 && idx < sorted.length) {
        e.preventDefault()
        setContextTarget({ item: sorted[idx], x: window.innerWidth / 2, y: window.innerHeight / 2 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActiveTab, globalFiles, localFiles, focusedFileIndex, tab, navigateTo, setFocusedFileIndex, setSelectedPaths, setSelectedPathsForContext, setPreviewFile, setContextTarget, deleteFile, resolvedTabId])

  useEffect(() => {
    if (focusedFileIndex < 0) return
    const source = isActiveTab ? globalFiles : localFiles
    const sorted = sortFiles(source)
    if (focusedFileIndex >= sorted.length) return
    const el = itemRefs.current.get(sorted[focusedFileIndex].path)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedFileIndex, isActiveTab, globalFiles, localFiles])

  const toggleSelect = useCallback((path: string, ctrl: boolean) => {
    let newSelected: Set<string>
    if (ctrl) {
      setSelectedPaths((prev) => {
        const next = new Set(prev)
        if (next.has(path)) next.delete(path)
        else next.add(path)
        newSelected = next
        return next
      })
    } else {
      newSelected = new Set([path])
      setSelectedPaths(newSelected)
    }
    setTimeout(() => setSelectedPathsForContext(Array.from(newSelected)), 0)
  }, [setSelectedPathsForContext])

  const handleClick = useCallback((file: FileItem, e: React.MouseEvent) => {
    toggleSelect(file.path, e.ctrlKey || e.metaKey)
  }, [toggleSelect])

  const { thumbnailCache, addThumbnails } = useThumbnailCache()

  const handleBatchRename = useCallback(async (oldPath: string, newName: string) => {
    await renameFile(oldPath, newName)
  }, [renameFile])

  const onBatchDone = useCallback(() => {
    setBatchRenameOpen(false)
    setSelectedPaths(new Set())
    setSelectedPathsForContext([])
    refresh()
  }, [refresh])

  useEffect(() => {
    if (isActiveTab) return
    if (!tab?.path) { setLocalFiles([]); return }
    setLocalLoading(true)
    const api = getApi()
    api?.readDir(tab.path).then((result) => { setLocalFiles(result || []); setLocalLoading(false) })
  }, [tab?.path, isActiveTab, resolvedTabId])

  useEffect(() => {
    if (!showThumbnails) return
    const source = isActiveTab ? globalFiles : localFiles
    const toLoad = source.filter((f) => imageExts.has(f.extension) && !thumbnailCache[f.path]).map((f) => f.path)
    if (toLoad.length === 0) return
    const api = getApi()
    if (api?.readImageThumbnailsBatch) {
      api.readImageThumbnailsBatch(toLoad).then((results) => { if (Object.keys(results).length > 0) addThumbnails(results) })
    } else if (api?.readImageThumbnail) {
      Promise.all(toLoad.map((p) => api!.readImageThumbnail(p).then((d) => d && addThumbnails({[p]: d}))))
    }
  }, [showThumbnails, isActiveTab, globalFiles, localFiles])

  const filtered = useMemo(() => {
    const source = isActiveTab ? globalFiles : localFiles
    let result = source
    if (activeTagFilter) result = result.filter((f) => f.tags && f.tags.includes(activeTagFilter))
    if (!searchQuery.trim()) return result
    const q = searchQuery.toLowerCase()
    return result.filter((f) => f.name.toLowerCase().includes(q) || f.extension.toLowerCase().includes(q))
  }, [isActiveTab, globalFiles, localFiles, searchQuery, activeTagFilter])

  const handleDoubleClick = (file: FileItem) => {
    if (file.isDirectory) navigateTo(file.path, resolvedTabId)
    else getApi()?.openPath(file.path)
  }

  const handleContextMenu = useCallback((file: FileItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedPaths.has(file.path)) {
      setSelectedPaths(new Set([file.path]))
      setSelectedPathsForContext([file.path])
    }
    setContextTarget({ item: file, x: e.clientX, y: e.clientY })
  }, [selectedPaths, setSelectedPathsForContext, setContextTarget])

  const handleDragStart = useCallback((file: FileItem, e: React.DragEvent) => {
    if (!selectedPaths.has(file.path)) {
      setSelectedPaths(new Set([file.path]))
      setSelectedPathsForContext([file.path])
    }
    const paths = selectedPaths.has(file.path) ? Array.from(selectedPaths) : [file.path]
    e.dataTransfer.setData('application/json', JSON.stringify({ paths, operation: 'copy' }))
    e.dataTransfer.effectAllowed = 'copyMove'
  }, [selectedPaths, setSelectedPathsForContext])

  const handleDragOver = useCallback((file: FileItem, e: React.DragEvent) => {
    if (file.isDirectory) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move'
      setDragOverPath(file.path)
    }
  }, [])

  const handleDrop = useCallback(async (file: FileItem, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPath(null)
    if (!file.isDirectory) return
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data?.paths) {
        const api = getApi()
        if (!api) return
        for (const src of data.paths) {
          const baseName = src.split('\\').pop() || src.split('/').pop() || ''
          const dest = file.path + '\\' + baseName
          if (e.ctrlKey) await api.fileCopy(src, dest)
          else await api.fileRename(src, dest)
        }
        refresh()
      }
    } catch {}
  }, [refresh])

  if (isLoading) {
    return <div style={{ flex: 1 }}><LoadingSpinner label="Loading..." /></div>
  }

  if (filtered.length === 0) {
    return (
      <div
        onContextMenu={(e) => {
          if (!searchQuery) {
            e.preventDefault()
            setBgContextMenu({ x: e.clientX, y: e.clientY })
          }
        }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}
      >
        <Folder size={48} style={{ opacity: 0.3 }} />
        <span>{searchQuery ? 'No results found' : 'This folder is empty'}</span>
        {!tab?.path && <span style={{ fontSize: 12 }}>Select a folder from the sidebar to get started</span>}
      </div>
    )
  }

  const sorted = sortFiles(filtered)
  const viewMode = tab?.viewMode || 'grid'

  const sharedProps = {
    sorted, selectedPaths, hoveredPath, dragOverPath, dragSelect,
    iconSize, showThumbnails, thumbnailCache, batchRenameOpen, folderSizes,
    containerRef, itemRefs,
    onClick: handleClick, onDoubleClick: handleDoubleClick, onContextMenu: handleContextMenu,
    onMouseEnter: setHoveredPath, onMouseLeave: () => setHoveredPath(null),
    onDragStart: handleDragStart, onDragOver: handleDragOver, onDragLeave: () => setDragOverPath(null), onDrop: handleDrop,
    setBatchRenameOpen,
    onBgContextMenu: (x: number, y: number) => setBgContextMenu({ x, y }),
    onBatchDone,
    onBatchRename: handleBatchRename,
    onMouseDown: handleMouseDown,
  }

  if (viewMode === 'grid') return <GridView {...sharedProps} />
  if (viewMode === 'gallery') return <GalleryView {...sharedProps} />
  return <ListView {...sharedProps} />
}

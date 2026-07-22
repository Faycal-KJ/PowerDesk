import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { Search, Folder, File, X, Command, ArrowUpDown, Settings, Sidebar, Columns, LayoutGrid, List, Image, PanelRight, Monitor, Sun, Moon, SlidersHorizontal, QrCode, Terminal, Palette, Save, Bookmark, Trash2, Star } from 'lucide-react'
import { parseSearchQuery } from '../lib/searchParser'
import type { SearchFilters } from '../types'
import { pluginManager } from '../plugins/pluginManager'

const COMMANDS = [
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', keys: 'Ctrl+B', icon: 'Sidebar', action: 'toggleSidebar' },
  { id: 'toggle-dualpane', label: 'Toggle Dual Pane', keys: 'Ctrl+Shift+\\', icon: 'Columns', action: 'toggleDualPane' },
  { id: 'grid-view', label: 'Grid View', keys: '', icon: 'LayoutGrid', action: 'setViewMode:grid' },
  { id: 'list-view', label: 'List View', keys: '', icon: 'List', action: 'setViewMode:list' },
  { id: 'gallery-view', label: 'Gallery View', keys: '', icon: 'Image', action: 'setViewMode:gallery' },
  { id: 'back', label: 'Go Back', keys: 'Alt+Left', icon: 'ArrowUpDown', action: 'navigateBack' },
  { id: 'forward', label: 'Go Forward', keys: 'Alt+Right', icon: 'ArrowUpDown', action: 'navigateForward' },
  { id: 'refresh', label: 'Refresh', keys: 'F5', icon: 'ArrowUpDown', action: 'refresh' },
  { id: 'new-tab', label: 'New Tab', keys: 'Ctrl+T', icon: 'File', action: 'newTab' },
  { id: 'close-tab', label: 'Close Current Tab', keys: 'Ctrl+W', icon: 'X', action: 'closeTab' },
  { id: 'previous-tab', label: 'Previous Tab', keys: 'Ctrl+Shift+Tab', icon: 'ArrowUpDown', action: 'prevTab' },
  { id: 'next-tab', label: 'Next Tab', keys: 'Ctrl+Tab', icon: 'ArrowUpDown', action: 'nextTab' },
  { id: 'qr-generator', label: 'QR Generator', keys: '', icon: 'QrCode', action: 'openTool:qr' },
  { id: 'terminal', label: 'Terminal', keys: '', icon: 'Terminal', action: 'openTool:terminal' },
  { id: 'color-tool', label: 'Color Tool', keys: '', icon: 'Palette', action: 'openTool:color' },
  { id: 'settings', label: 'Settings', keys: '', icon: 'Settings', action: 'openSettings' },
]

const iconMap: Record<string, React.ReactNode> = {
  Sidebar: <Sidebar size={14} />,
  Columns: <Columns size={14} />,
  LayoutGrid: <LayoutGrid size={14} />,
  List: <List size={14} />,
  Image: <Image size={14} />,
  ArrowUpDown: <ArrowUpDown size={14} />,
  File: <File size={14} />,
  X: <X size={14} />,
  QrCode: <QrCode size={14} />,
  Terminal: <Terminal size={14} />,
  Palette: <Palette size={14} />,
  Settings: <Settings size={14} />,
}

export default function SearchOverlay({ onClose, mode = 'search' }: { onClose: () => void; mode?: 'search' | 'command' }) {
  const [query, setQuery] = useState('')
  const [filteredCommands, setFilteredCommands] = useState(COMMANDS)
  const [searching, setSearching] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const navigateTo = useStore((s) => s.navigateTo)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const activeTab = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const activeTabId = useStore((s) => s.activeTabId)
  const tabs = useStore((s) => s.tabs)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const addTab = useStore((s) => s.addTab)
  const closeTab = useStore((s) => s.closeTab)
  const setTabViewMode = useStore((s) => s.setTabViewMode)
  const navigateBack = useStore((s) => s.navigateBack)
  const navigateForward = useStore((s) => s.navigateForward)
  const toggleDualPane = useStore((s) => s.toggleDualPane)
  const refresh = useStore((s) => s.refresh)
  const setOpenTool = useStore((s) => s.setOpenTool)

  const isCommandMode = mode === 'command'

  // Advanced filters
  const searchFilters = useStore((s) => s.searchFilters)
  const setSearchFilters = useStore((s) => s.setSearchFilters)
  const resetSearchFilters = useStore((s) => s.resetSearchFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const savedSearches = useStore((s) => s.savedSearches)
  const addSavedSearch = useStore((s) => s.addSavedSearch)
  const removeSavedSearch = useStore((s) => s.removeSavedSearch)
  const [saveName, setSaveName] = useState('')

  // Quick filter input (inside filters panel)
  const [quickFilter, setQuickFilter] = useState('')

  // Size filter display state (local, converts to bytes for store)
  const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  type SizeUnit = typeof SIZE_UNITS[number]
  const SIZE_MULT: Record<SizeUnit, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }
  function bytesToUnit(bytes: number | null): { val: string; unit: SizeUnit } {
    if (bytes == null || bytes <= 0) return { val: '', unit: 'MB' }
    for (let i = SIZE_UNITS.length - 1; i >= 0; i--) {
      const u = SIZE_UNITS[i]
      if (bytes >= SIZE_MULT[u] && bytes % SIZE_MULT[u] === 0) {
        return { val: String(bytes / SIZE_MULT[u]), unit: u }
      }
    }
    return { val: String(bytes), unit: 'B' }
  }
  const [minSizeVal, setMinSizeVal] = useState(() => bytesToUnit(searchFilters.minSize).val)
  const [minSizeUnit, setMinSizeUnit] = useState<SizeUnit>(() => bytesToUnit(searchFilters.minSize).unit)
  const [maxSizeVal, setMaxSizeVal] = useState(() => bytesToUnit(searchFilters.maxSize).val)
  const [maxSizeUnit, setMaxSizeUnit] = useState<SizeUnit>(() => bytesToUnit(searchFilters.maxSize).unit)

  useEffect(() => {
    inputRef.current?.focus()
    if (isCommandMode) return
    const api = getApi()
    api?.searchStatus().then(setIndexStatus)
  }, [])

  // Filter commands (built-in + plugin)
  useEffect(() => {
    if (!isCommandMode) return
    const q = query.toLowerCase()
    const pluginCmds = pluginManager.getCommands().map((c) => ({
      id: c.id,
      label: c.label,
      keys: c.shortcut || '',
      icon: 'Settings',
      action: `plugin:${c.pluginId}:${c.id}`,
      category: c.category,
    }))
    const all = [...COMMANDS, ...pluginCmds]
    setFilteredCommands(
      q ? all.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q)) : all
    )
  }, [query, isCommandMode])

  // File search
  const [indexStatus, setIndexStatus] = useState<{ built: boolean; building: boolean; total: number } | null>(null)
  const [rawResults, setRawResults] = useState<any[]>([])

  // Parse quick filter for smart filters
  const parsedQuery = useMemo(() => parseSearchQuery(quickFilter), [quickFilter])

  // Merge: manual filters take priority, quick filter only fills in what manual hasn't set
  const effectiveFilters = useMemo<SearchFilters>(() => {
    if (!quickFilter.trim()) return searchFilters
    const parsed = parsedQuery.filters
    return {
      type: searchFilters.type !== 'all' ? searchFilters.type : (parsed.type ?? 'all'),
      extension: searchFilters.extension || parsed.extension || null,
      minSize: searchFilters.minSize ?? parsed.minSize ?? null,
      maxSize: searchFilters.maxSize ?? parsed.maxSize ?? null,
      minDate: searchFilters.minDate || parsed.minDate || null,
      maxDate: searchFilters.maxDate || parsed.maxDate || null,
      author: searchFilters.author || parsed.author || null,
      tags: searchFilters.tags || parsed.tags || null,
      color: searchFilters.color || parsed.color || null,
    }
  }, [searchFilters, parsedQuery.filters, quickFilter])

  useEffect(() => {
    if (isCommandMode || !query.trim()) { setRawResults([]); return }
    const api = getApi()
    if (!api?.searchQuery) return
    setSearching(true)
    const timer = setTimeout(async () => {
      const res = await api.searchQuery(query)
      setRawResults(res || [])
      setSelectedIdx(0)
      setSearching(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, isCommandMode])

  // Apply filters to raw results
  const results = useMemo(() => {
    let filtered = rawResults
    if (effectiveFilters.type === 'files') {
      filtered = filtered.filter((r) => !r.isDirectory)
    } else if (effectiveFilters.type === 'folders') {
      filtered = filtered.filter((r) => r.isDirectory)
    }
    if (effectiveFilters.minSize != null) {
      filtered = filtered.filter((r) => r.size >= effectiveFilters.minSize!)
    }
    if (effectiveFilters.maxSize != null) {
      filtered = filtered.filter((r) => r.size <= effectiveFilters.maxSize!)
    }
    if (effectiveFilters.extension) {
      const ext = effectiveFilters.extension.toLowerCase()
      filtered = filtered.filter((r) => r.extension?.toLowerCase() === ext)
    }
    if (effectiveFilters.minDate) {
      const min = new Date(effectiveFilters.minDate).getTime()
      filtered = filtered.filter((r) => r.modifiedAt && new Date(r.modifiedAt).getTime() >= min)
    }
    if (effectiveFilters.maxDate) {
      const max = new Date(effectiveFilters.maxDate).getTime()
      filtered = filtered.filter((r) => r.modifiedAt && new Date(r.modifiedAt).getTime() <= max)
    }
    if (effectiveFilters.author) {
      const q = effectiveFilters.author.toLowerCase()
      filtered = filtered.filter((r) => r.author?.toLowerCase().includes(q))
    }
    if (effectiveFilters.tags) {
      const q = effectiveFilters.tags.toLowerCase()
      filtered = filtered.filter((r) => r.tags?.some((t: string) => t.toLowerCase().includes(q)))
    }
    if (effectiveFilters.color) {
      filtered = filtered.filter((r) => r.color === effectiveFilters.color)
    }
    return filtered
  }, [rawResults, effectiveFilters])

  const executeCommand = useCallback((cmd: typeof COMMANDS[0]) => {
    const [action, ...rest] = cmd.action.split(':')
    if (action === 'plugin') {
      const pluginId = rest[0]
      const cmdId = rest[1]
      const pluginCmds = pluginManager.getCommands()
      const match = pluginCmds.find((c) => c.pluginId === pluginId && c.id === cmdId)
      if (match) match.action()
      onClose()
      return
    }
    const param = rest.join(':')
    switch (action) {
      case 'toggleSidebar':
        setSidebarOpen(!sidebarOpen)
        break
      case 'toggleDualPane':
        toggleDualPane(activeTabId)
        break
      case 'setViewMode':
        if (param) setTabViewMode(activeTabId, param as any)
        break
      case 'navigateBack':
        navigateBack(activeTabId)
        break
      case 'navigateForward':
        navigateForward(activeTabId)
        break
      case 'refresh':
        refresh()
        break
      case 'newTab':
        addTab()
        break
      case 'closeTab':
        closeTab(activeTabId)
        break
      case 'prevTab': {
        const idx = tabs.findIndex((t) => t.id === activeTabId)
        if (idx > 0) setActiveTab(tabs[idx - 1].id)
        break
      }
      case 'nextTab': {
        const idx = tabs.findIndex((t) => t.id === activeTabId)
        if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id)
        break
      }
      case 'openTool':
        setOpenTool(param as any)
        break
      case 'openSettings':
        useStore.getState().setSettingsOpen(true)
        break
    }
    onClose()
  }, [sidebarOpen, setSidebarOpen, toggleDualPane, activeTabId, setTabViewMode, navigateBack, navigateForward, refresh, addTab, closeTab, tabs, setActiveTab, onClose])

  const openResult = useCallback((item: any) => {
    if (item.isDirectory) navigateTo(item.path)
    else { const api = getApi(); api?.openPath(item.path) }
    onClose()
  }, [navigateTo, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = isCommandMode ? filteredCommands : results
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (isCommandMode && filteredCommands[selectedIdx]) executeCommand(filteredCommands[selectedIdx])
      else if (results[selectedIdx]) openResult(results[selectedIdx])
    }
    else if (e.key === 'Escape') { onClose() }
  }, [results, filteredCommands, selectedIdx, openResult, onClose, isCommandMode, executeCommand])

  function highlightMatch(text: string, query: string) {
    if (!query.trim()) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    )
  }

  function formatSize(bytes: number) {
    if (!bytes) return ''
    const u = ['B', 'KB', 'MB', 'GB']
    let i = 0; let s = bytes
    while (s >= 1024 && i < u.length - 1) { s /= 1024; i++ }
    return `${s.toFixed(i === 0 ? 0 : 1)} ${u[i]}`
  }

  const headerLabel = isCommandMode ? 'Commands' : 'Search Everything...'
  const chipStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', fontSize: 10.5, borderRadius: 'var(--radius-sm)', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)', opacity: 0.85 }
  const placeholder = isCommandMode ? 'Type a command...' : 'Search files, folders, extensions...'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh', background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 560, maxWidth: '90vw', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
          {isCommandMode ? <Command size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13.5 }} />
          {query && <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)', display: 'flex', padding: 2 }}><X size={14} /></button>}
          {!isCommandMode && query && (
            <button
              onClick={() => {
                if (!saveName.trim()) return
                addSavedSearch(saveName.trim(), quickFilter || query)
                setSaveName('')
              }}
              style={{ color: 'var(--text-muted)', display: 'flex', padding: 2, borderRadius: 'var(--radius-sm)' }}
              title="Save this search"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <Save size={14} />
            </button>
          )}
          {!isCommandMode && (
            <button
              onClick={() => setShowSaved(!showSaved)}
              style={{
                color: showSaved ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex',
                padding: 2,
                borderRadius: 'var(--radius-sm)',
              }}
              title="Saved Searches"
            >
              <Bookmark size={14} />
            </button>
          )}
          {!isCommandMode && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                color: showFilters ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex',
                padding: 2,
                borderRadius: 'var(--radius-sm)',
              }}
              title="Advanced Filters"
            >
              <SlidersHorizontal size={14} />
            </button>
          )}
        </div>

        {!isCommandMode && indexStatus && !indexStatus.built && !indexStatus.building && (
          <div style={{ padding: '8px 14px', fontSize: 11.5, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
            Index not built. Type to search current directory only.
          </div>
        )}

        {!isCommandMode && indexStatus?.building && (
          <div style={{ padding: '8px 14px', fontSize: 11.5, color: 'var(--accent)', borderBottom: '1px solid var(--border-subtle)' }}>
            Building index... ({indexStatus.total.toLocaleString()} files indexed)
          </div>
        )}

        {/* Saved Searches Panel */}
        {!isCommandMode && showSaved && (
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Search name..."
                onKeyDown={(e) => { if (e.key === 'Enter' && saveName.trim() && query) { addSavedSearch(saveName.trim(), query); setSaveName('') } }}
                style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '3px 6px', fontSize: 11.5, color: 'var(--text-primary)', outline: 'none' }}
              />
              <button
                onClick={() => { if (saveName.trim() && (quickFilter || query)) { addSavedSearch(saveName.trim(), quickFilter || query); setSaveName('') } }}
                disabled={!saveName.trim() || (!quickFilter && !query)}
                style={{ padding: '3px 8px', fontSize: 11, borderRadius: 'var(--radius-sm)', background: saveName.trim() && (quickFilter || query) ? 'var(--accent)' : 'var(--bg-primary)', color: saveName.trim() && (quickFilter || query) ? '#fff' : 'var(--text-muted)', border: 'none', cursor: saveName.trim() && (quickFilter || query) ? 'pointer' : 'default' }}
              >
                Save
              </button>
            </div>
            {savedSearches.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 0' }}>No saved searches yet. Open Filters and set a quick filter to save.</div>
            ) : (
              savedSearches.map((ss) => (
                <div
                  key={ss.id}
                  onClick={() => { setQuickFilter(ss.query); setShowSaved(false); setShowFilters(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 100ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Bookmark size={11} style={{ color: 'var(--accent)', opacity: 0.6, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ss.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{ss.query}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSavedSearch(ss.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1, color: 'var(--text-muted)', opacity: 0, transition: 'opacity 100ms' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Advanced Filters Panel */}
        {!isCommandMode && showFilters && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
            {/* Quick Filter Input */}
            <div style={{ marginBottom: 10 }}>
              <label style={filterLabel}>Quick Filter</label>
              <input
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                placeholder='e.g. type:pdf size>5MB tag:important'
                style={filterInput}
              />
              {quickFilter && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {parsedQuery.filters.type && <span style={chipStyle}>type: {parsedQuery.filters.type}</span>}
                  {parsedQuery.filters.extension && <span style={chipStyle}>ext: {parsedQuery.filters.extension}</span>}
                  {parsedQuery.filters.minSize != null && <span style={chipStyle}>min: {formatSize(parsedQuery.filters.minSize)}</span>}
                  {parsedQuery.filters.maxSize != null && <span style={chipStyle}>max: {formatSize(parsedQuery.filters.maxSize)}</span>}
                  {parsedQuery.filters.minDate && <span style={chipStyle}>after: {parsedQuery.filters.minDate}</span>}
                  {parsedQuery.filters.maxDate && <span style={chipStyle}>before: {parsedQuery.filters.maxDate}</span>}
                  {parsedQuery.filters.tags && <span style={chipStyle}>tag: {parsedQuery.filters.tags}</span>}
                  {parsedQuery.filters.color && <span style={chipStyle}>color: {parsedQuery.filters.color}</span>}
                  {parsedQuery.filters.author && <span style={chipStyle}>author: {parsedQuery.filters.author}</span>}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Type filter */}
              <div>
                <label style={filterLabel}>Type</label>
                <select
                  value={searchFilters.type}
                  onChange={(e) => setSearchFilters({ type: e.target.value as any })}
                  style={filterSelect}
                >
                  <option value="all">All</option>
                  <option value="files">Files only</option>
                  <option value="folders">Folders only</option>
                </select>
              </div>

              {/* Extension filter */}
              <div>
                <label style={filterLabel}>Extension</label>
                <input
                  value={searchFilters.extension || ''}
                  onChange={(e) => setSearchFilters({ extension: e.target.value || null })}
                  placeholder=".txt, .pdf..."
                  style={filterInput}
                />
              </div>

              {/* Min size */}
              <div>
                <label style={filterLabel}>Min Size</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    value={minSizeVal}
                    onChange={(e) => {
                      const v = e.target.value
                      setMinSizeVal(v)
                      if (v === '' || v === '-') { setSearchFilters({ minSize: null }); return }
                      const num = parseFloat(v)
                      if (!isNaN(num)) setSearchFilters({ minSize: Math.round(num * SIZE_MULT[minSizeUnit]) })
                    }}
                    placeholder="0"
                    style={{ ...filterInput, flex: 1 }}
                  />
                  <select
                    value={minSizeUnit}
                    onChange={(e) => {
                      const u = e.target.value as SizeUnit
                      setMinSizeUnit(u)
                      const num = parseFloat(minSizeVal)
                      if (minSizeVal !== '' && !isNaN(num)) setSearchFilters({ minSize: Math.round(num * SIZE_MULT[u]) })
                    }}
                    style={{ ...filterSelect, width: 58 }}
                  >
                    {SIZE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Max size */}
              <div>
                <label style={filterLabel}>Max Size</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    value={maxSizeVal}
                    onChange={(e) => {
                      const v = e.target.value
                      setMaxSizeVal(v)
                      if (v === '' || v === '-') { setSearchFilters({ maxSize: null }); return }
                      const num = parseFloat(v)
                      if (!isNaN(num)) setSearchFilters({ maxSize: Math.round(num * SIZE_MULT[maxSizeUnit]) })
                    }}
                    placeholder="0"
                    style={{ ...filterInput, flex: 1 }}
                  />
                  <select
                    value={maxSizeUnit}
                    onChange={(e) => {
                      const u = e.target.value as SizeUnit
                      setMaxSizeUnit(u)
                      const num = parseFloat(maxSizeVal)
                      if (maxSizeVal !== '' && !isNaN(num)) setSearchFilters({ maxSize: Math.round(num * SIZE_MULT[u]) })
                    }}
                    style={{ ...filterSelect, width: 58 }}
                  >
                    {SIZE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Modified after */}
              <div>
                <label style={filterLabel}>Modified After</label>
                <input
                  type="date"
                  value={searchFilters.minDate || ''}
                  onChange={(e) => setSearchFilters({ minDate: e.target.value || null })}
                  style={filterInput}
                />
              </div>

              {/* Modified before */}
              <div>
                <label style={filterLabel}>Modified Before</label>
                <input
                  type="date"
                  value={searchFilters.maxDate || ''}
                  onChange={(e) => setSearchFilters({ maxDate: e.target.value || null })}
                  style={filterInput}
                />
              </div>

              {/* Author */}
              <div>
                <label style={filterLabel}>Author</label>
                <input
                  value={searchFilters.author || ''}
                  onChange={(e) => setSearchFilters({ author: e.target.value || null })}
                  placeholder="Author name..."
                  style={filterInput}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={filterLabel}>Tags</label>
                <input
                  value={searchFilters.tags || ''}
                  onChange={(e) => setSearchFilters({ tags: e.target.value || null })}
                  placeholder="tag name..."
                  style={filterInput}
                />
              </div>

              {/* Color */}
              <div>
                <label style={filterLabel}>Color</label>
                <select
                  value={searchFilters.color || ''}
                  onChange={(e) => setSearchFilters({ color: e.target.value || null })}
                  style={filterInput}
                >
                  <option value="">Any</option>
                  <option value="red">Red</option>
                  <option value="orange">Orange</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => { resetSearchFilters(); setQuickFilter(''); setMinSizeVal(''); setMinSizeUnit('MB'); setMaxSizeVal(''); setMaxSizeUnit('MB') }}
                style={{
                  fontSize: 11,
                  color: 'var(--accent)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Reset filters
              </button>
            </div>
          </div>
        )}

        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {isCommandMode ? (
            <>
              {searching && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>Searching...</div>}
              {filteredCommands.map((cmd, i) => (
                <div key={cmd.id} onClick={() => executeCommand(cmd)} onMouseEnter={() => setSelectedIdx(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', background: i === selectedIdx ? 'var(--bg-hover)' : 'transparent' }}>
                  <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>{iconMap[cmd.icon] || <File size={14} />}</div>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{cmd.label}</span>
                  {cmd.keys && <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cmd.keys}</span>}
                </div>
              ))}
            </>
          ) : (
            <>
              {searching && results.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>Searching...</div>}
              {!searching && query && results.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>No results for "{query}"</div>}
              {results.map((item, i) => (
                <div key={item.path} onClick={() => openResult(item)} onMouseEnter={() => setSelectedIdx(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', background: i === selectedIdx ? 'var(--bg-hover)' : 'transparent' }}>
                  <div style={{ flexShrink: 0, color: item.isDirectory ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {item.isDirectory ? <Folder size={16} /> : <File size={16} />}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {highlightMatch(item.name, query)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.path}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(item.size)}</div>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 14px', fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
          <span>↑↓ Navigate</span>
          <span>↵ {isCommandMode ? 'Run' : 'Open'}</span>
          <span>Esc Close</span>
          <span style={{ marginLeft: 'auto' }}>{isCommandMode ? `${filteredCommands.length} commands` : `${results.length} results`}</span>
        </div>
      </div>
    </div>
  )
}

const filterLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  color: 'var(--text-muted)',
  marginBottom: 3,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  fontWeight: 600,
}

const filterInput: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 6px',
  fontSize: 11.5,
  color: 'var(--text-primary)',
  outline: 'none',
}

const filterSelect: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 6px',
  fontSize: 11.5,
  color: 'var(--text-primary)',
  outline: 'none',
  cursor: 'pointer',
}

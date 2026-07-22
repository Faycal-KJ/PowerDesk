import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getApi } from '../lib/api'
import { useStore } from '../stores/useStore'
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  FolderOpen,
  Search,
  Heart,
  ListMusic,
  Trash2,
  GripVertical,
  Music2,
  Disc3,
} from 'lucide-react'

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.opus'])
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp'])
const COVER_NAMES = ['cover', 'folder', 'album', 'front', 'artwork', 'thumb', 'art']
const STORAGE_KEYS = { folders: 'mp_folders', vol: 'mp_volume', shuf: 'mp_shuffle', rep: 'mp_repeat', liked: 'mp_liked', playlists: 'mp_playlists', eq: 'mp_eq' }

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') || fallback } catch { return fallback }
}
function save(key: string, val: any) { localStorage.setItem(key, JSON.stringify(val)) }
function fmt(s: number): string {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
function fname(p: string): string { return p.replace(/\\/g, '/').split('/').pop() || p }
function stripExt(n: string): string { return n.replace(/\.[^.]+$/, '') }
function hashColor(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  const hue = Math.abs(h) % 360
  return `hsl(${hue}, 45%, 25%)`
}

interface Track { name: string; path: string; dir: string }
interface Playlist { id: string; name: string; tracks: string[] }

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let audioEl: HTMLAudioElement | null = null

function getAnalyser(el: HTMLAudioElement): AnalyserNode {
  if (analyser && audioEl === el) return analyser
  if (!audioCtx) audioCtx = new AudioContext()
  if (sourceNode) { try { sourceNode.disconnect() } catch {} }
  sourceNode = audioCtx.createMediaElementSource(el)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256
  sourceNode.connect(analyser)
  analyser.connect(audioCtx.destination)
  audioEl = el
  return analyser
}

export default function MusicPlayer() {
  const api = getApi()
  const [expanded, setExpanded] = useState(false)
  const [folders, setFolders] = useState<string[]>(() => load(STORAGE_KEYS.folders, []))
  const [tracks, setTracks] = useState<Track[]>([])
  const [current, setCurrent] = useState<Track | null>(null)
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [dur, setDur] = useState(0)
  const [volume, setVolume] = useState<number>(() => load(STORAGE_KEYS.vol, 0.8))
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState<boolean>(() => load(STORAGE_KEYS.shuf, false))
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>(() => load(STORAGE_KEYS.rep, 'off'))
  const [cover, setCover] = useState<string | null>(null)
  const [coverGradient, setCoverGradient] = useState('#333')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'library' | 'queue' | 'playlists'>('library')
  const [liked, setLiked] = useState<Set<string>>(() => new Set(load(STORAGE_KEYS.liked, [])))
  const [playlists, setPlaylists] = useState<Playlist[]>(() => load(STORAGE_KEYS.playlists, []))
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIdx, setQueueIdx] = useState(-1)
  const [showVisualizer, setShowVisualizer] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const seekRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const tickRef = useRef<number>(0)

  // Initialize audio element
  useEffect(() => {
    const a = new Audio()
    a.volume = volume
    audioRef.current = a

    const onEnd = () => {
      if (repeat === 'one') {
        a.currentTime = 0
        a.play().catch(() => {})
      } else {
        playNext()
      }
    }
    const onTime = () => { setPos(a.currentTime); setDur(a.duration || 0) }
    const onErr = () => { setPlaying(false) }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    a.addEventListener('ended', onEnd)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('error', onErr)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)

    return () => {
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('error', onErr)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.pause()
      a.src = ''
    }
  }, [repeat])

  // Persist settings
  useEffect(() => { save(STORAGE_KEYS.folders, folders) }, [folders])
  useEffect(() => { save(STORAGE_KEYS.vol, volume) }, [volume])
  useEffect(() => { save(STORAGE_KEYS.shuf, shuffle) }, [shuffle])
  useEffect(() => { save(STORAGE_KEYS.rep, repeat) }, [repeat])
  useEffect(() => { save(STORAGE_KEYS.liked, [...liked]) }, [liked])
  useEffect(() => { save(STORAGE_KEYS.playlists, playlists) }, [playlists])

  // Scan folders
  useEffect(() => {
    let cancelled = false
    async function scan() {
      const all: Track[] = []
      for (const d of folders) {
        try {
          const items = await api?.readDir(d)
          if (!Array.isArray(items)) continue
          for (const f of items) {
            if (!f.isDirectory) {
              const ext = '.' + f.name.split('.').pop()?.toLowerCase()
              if (AUDIO_EXTS.has(ext)) {
                all.push({ name: stripExt(f.name), path: f.path || d + '\\' + f.name, dir: d })
              }
            }
          }
        } catch {}
      }
      if (!cancelled) setTracks(all.sort((a, b) => a.name.localeCompare(b.name)))
    }
    scan()
    return () => { cancelled = true }
  }, [folders, api])

  // Album art
  const findCover = useCallback(async (track: Track): Promise<{ url: string | null; gradient: string }> => {
    const dir = track.dir
    for (const n of COVER_NAMES) {
      for (const ext of IMAGE_EXTS) {
        const path = dir + '\\' + n + ext
        try {
          const result = await api?.checkFilesExist([path])
          if (result?.[path]?.exists) return { url: path, gradient: hashColor(track.name) }
        } catch {}
      }
    }
    return { url: null, gradient: hashColor(track.name) }
  }, [api])

  // Visualizer
  useEffect(() => {
    if (!showVisualizer || !canvasRef.current || !audioRef.current || !playing) {
      cancelAnimationFrame(animRef.current)
      return
    }
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    let a: AnalyserNode
    try { a = getAnalyser(audioRef.current) } catch { return }

    const bufLen = a.frequencyBinCount
    const data = new Uint8Array(bufLen)

    function draw() {
      animRef.current = requestAnimationFrame(draw)
      a.getByteFrequencyData(data)
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barW = (canvas.width / bufLen) * 2
      let x = 0
      for (let i = 0; i < bufLen; i++) {
        const h = (data[i] / 255) * canvas.height * 0.85
        const hue = (i / bufLen) * 60 + 250
        ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.8)`
        ctx.fillRect(x, canvas.height - h, barW - 1, h)
        x += barW
      }
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, showVisualizer])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.ctrlKey && e.shiftKey && e.key === 'M') { e.preventDefault(); togglePlay() }
      if (e.ctrlKey && e.shiftKey && e.key === 'N') { e.preventDefault(); playNext() }
      if (e.ctrlKey && e.shiftKey && e.key === 'B') { e.preventDefault(); playPrev() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [current, tracks, queue, queueIdx, repeat, shuffle])

  // Media session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.name,
      artist: 'PowerDesk Music',
      album: fname(current.dir),
    })
    navigator.mediaSession.setActionHandler('play', () => togglePlay())
    navigator.mediaSession.setActionHandler('pause', () => togglePlay())
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrev())
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext())
  }, [current, playing])

  const loadTrack = useCallback(async (track: Track, idx: number) => {
    const a = audioRef.current
    if (!a) return
    a.src = 'file:///' + track.path.replace(/\\/g, '/')
    a.load()
    setCurrent(track)
    setCurrentIdx(idx)
    try {
      await a.play()
      setPlaying(true)
    } catch {}
    const { url, gradient } = await findCover(track)
    setCover(url)
    setCoverGradient(gradient)
  }, [findCover])

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a || !current) return
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }, [current])

  const playNext = useCallback(() => {
    const list = queue.length > 0 ? queue : tracks
    if (!list.length) return
    const activeIdx = queue.length > 0 ? queueIdx : currentIdx
    let next: number
    if (shuffle) {
      next = Math.floor(Math.random() * list.length)
    } else {
      next = activeIdx + 1
      if (next >= list.length) {
        if (repeat === 'all') next = 0
        else { setPlaying(false); return }
      }
    }
    if (queue.length > 0) setQueueIdx(next)
    loadTrack(list[next], next)
  }, [queue, queueIdx, tracks, currentIdx, shuffle, repeat, loadTrack])

  const playPrev = useCallback(() => {
    const a = audioRef.current
    if (a && a.currentTime > 3) { a.currentTime = 0; return }
    const list = queue.length > 0 ? queue : tracks
    const activeIdx = queue.length > 0 ? queueIdx : currentIdx
    if (!list.length) return
    let prev = activeIdx - 1
    if (prev < 0) prev = list.length - 1
    if (queue.length > 0) setQueueIdx(prev)
    loadTrack(list[prev], prev)
  }, [queue, queueIdx, tracks, currentIdx, loadTrack])

  const playTrack = useCallback((track: Track, idx: number) => {
    setQueue([])
    setQueueIdx(-1)
    loadTrack(track, idx)
  }, [loadTrack])

  const addToQueue = useCallback((track: Track) => {
    setQueue(q => [...q, track])
  }, [])

  const removeFromQueue = useCallback((idx: number) => {
    setQueue(q => q.filter((_, i) => i !== idx))
  }, [])

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekRef.current
    const a = audioRef.current
    if (!bar || !a || !dur) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    a.currentTime = pct * dur
    setPos(pct * dur)
  }, [dur])

  const toggleMute = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (muted) { a.volume = volume; setMuted(false) }
    else { a.volume = 0; setMuted(true) }
  }, [muted, volume])

  const cycleRepeat = useCallback(() => {
    setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')
  }, [])

  const toggleLike = useCallback((path: string) => {
    setLiked(s => {
      const next = new Set(s)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const addFolder = useCallback(async () => {
    const path = prompt('Enter folder path to add:')
    if (path && path.trim() && !folders.includes(path.trim())) {
      setFolders(f => [...f, path.trim()])
    }
  }, [folders])

  const addCurrentFolder = useCallback(() => {
    const state = useStore.getState()
    const tab = state.tabs.find(t => t.id === state.activeTabId)
    if (tab?.path && !folders.includes(tab.path)) setFolders(f => [...f, tab.path])
  }, [folders])

  const removeFolder = useCallback((p: string) => {
    setFolders(f => f.filter(x => x !== p))
  }, [])

  const createPlaylist = useCallback(() => {
    if (!newPlaylistName.trim()) return
    setPlaylists(p => [...p, { id: Date.now().toString(), name: newPlaylistName.trim(), tracks: [] }])
    setNewPlaylistName('')
  }, [newPlaylistName])

  const addToPlaylist = useCallback((plId: string, trackPath: string) => {
    setPlaylists(ps => ps.map(p => p.id === plId && !p.tracks.includes(trackPath) ? { ...p, tracks: [...p.tracks, trackPath] } : p))
  }, [])

  const removeFromPlaylist = useCallback((plId: string, trackPath: string) => {
    setPlaylists(ps => ps.map(p => p.id === plId ? { ...p, tracks: p.tracks.filter(t => t !== trackPath) } : p))
  }, [])

  const deletePlaylist = useCallback((plId: string) => {
    setPlaylists(ps => ps.filter(p => p.id !== plId))
  }, [])

  const playPlaylist = useCallback((pl: Playlist) => {
    const plTracks = pl.tracks.map(tp => tracks.find(t => t.path === tp)).filter(Boolean) as Track[]
    if (!plTracks.length) return
    setQueue(plTracks)
    setQueueIdx(0)
    loadTrack(plTracks[0], 0)
  }, [tracks, loadTrack])

  const filteredTracks = useMemo(() => {
    if (!search) return tracks
    const q = search.toLowerCase()
    return tracks.filter(t => t.name.toLowerCase().includes(q) || t.dir.toLowerCase().includes(q))
  }, [tracks, search])

  const likedTracks = useMemo(() => tracks.filter(t => liked.has(t.path)), [tracks, liked])
  const pct = dur ? (pos / dur) * 100 : 0

  // ─── Now Playing Bar (bottom) ─────────────────────────────────────────
  if (!expanded) {
    return (
      <div style={{
        background: current ? `linear-gradient(135deg, ${coverGradient}ee, #1a1a2eee)` : 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 56,
        transition: 'background 0.4s ease',
      }}>
        {/* Album art mini */}
        <div style={{
          width: 40, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
          background: coverGradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {cover ? (
            <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Disc3 size={20} style={{ color: 'rgba(255,255,255,0.5)', animation: playing ? 'spin 3s linear infinite' : 'none' }} />
          )}
        </div>

        {/* Track info */}
        <div style={{ minWidth: 0, flex: '0 0 140px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {current?.name || 'No track'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {current ? fname(current.dir) : 'PowerDesk Music'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <CtrlBtn onClick={playPrev} icon={<SkipBack size={14} />} />
          <button onClick={togglePlay} style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
          </button>
          <CtrlBtn onClick={playNext} icon={<SkipForward size={14} />} />
        </div>

        {/* Seek bar */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 34, textAlign: 'right' }}>{fmt(pos)}</span>
          <div ref={seekRef} onClick={seekTo} style={{
            flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)',
            cursor: 'pointer', position: 'relative', minWidth: 60,
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: '#1db954', borderRadius: 2, transition: 'width 0.1s linear' }} />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 34 }}>{fmt(dur)}</span>
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <CtrlBtn onClick={toggleMute} icon={muted || volume === 0 ? <VolumeX size={13} /> : volume < 0.5 ? <Volume1 size={13} /> : <Volume2 size={13} />} />
          <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
            onChange={e => { const v = +e.target.value; setVolume(v); setMuted(false); if (audioRef.current) audioRef.current.volume = v }}
            style={{ width: 70, height: 3, accentColor: '#1db954', cursor: 'pointer' }}
          />
        </div>

        {/* Expand */}
        <CtrlBtn onClick={() => setExpanded(true)} icon={<ChevronUp size={14} />} />
      </div>
    )
  }

  // ─── Full Player (sidebar panel) ──────────────────────────────────────
  return (
    <div style={{
      width: 320, minWidth: 320, background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Music size={14} /> Music Player
        </span>
        <CtrlBtn onClick={() => setExpanded(false)} icon={<ChevronDown size={14} />} />
      </div>

      {/* Now Playing Big */}
      {current && (
        <div style={{ padding: '12px 14px 8px', textAlign: 'center' }}>
          <div style={{
            width: 180, height: 180, margin: '0 auto 12px', borderRadius: 10, overflow: 'hidden',
            background: coverGradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {cover ? (
              <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Disc3 size={64} style={{ color: 'rgba(255,255,255,0.3)', animation: playing ? 'spin 3s linear infinite' : 'none' }} />
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {current.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>{fname(current.dir)}</span>
            <button onClick={() => toggleLike(current.path)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex',
            }}>
              <Heart size={12} style={{ color: liked.has(current.path) ? '#1db954' : 'var(--text-muted)', fill: liked.has(current.path) ? '#1db954' : 'none' }} />
            </button>
          </div>
        </div>
      )}

      {/* Visualizer */}
      {showVisualizer && current && (
        <div style={{ padding: '0 14px 6px' }}>
          <canvas ref={canvasRef} width={280} height={40} style={{ width: '100%', height: 40, borderRadius: 4 }} />
        </div>
      )}

      {/* Seek Bar */}
      {current && (
        <div style={{ padding: '0 14px 4px' }}>
          <div ref={seekRef} onClick={seekTo} style={{
            height: 5, borderRadius: 3, background: 'var(--border-color)', cursor: 'pointer', position: 'relative',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: '#1db954', borderRadius: 3, transition: 'width 0.1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmt(pos)}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmt(dur)}</span>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '4px 14px 8px' }}>
        <CtrlBtn2 active={shuffle} onClick={() => setShuffle(s => !s)} icon={<Shuffle size={14} />} />
        <CtrlBtn2 onClick={playPrev} icon={<SkipBack size={16} />} />
        <button onClick={togglePlay} style={{
          width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: '#1db954', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(29,185,84,0.4)', transition: 'transform 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
        </button>
        <CtrlBtn2 onClick={playNext} icon={<SkipForward size={16} />} />
        <CtrlBtn2 active={repeat !== 'off'} onClick={cycleRepeat} icon={repeat === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />} />
      </div>

      {/* Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px 8px' }}>
        <CtrlBtn onClick={toggleMute} icon={muted || volume === 0 ? <VolumeX size={13} /> : volume < 0.5 ? <Volume1 size={13} /> : <Volume2 size={13} />} />
        <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
          onChange={e => { const v = +e.target.value; setVolume(v); setMuted(false); if (audioRef.current) audioRef.current.volume = v }}
          style={{ flex: 1, height: 3, accentColor: '#1db954', cursor: 'pointer' }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
        {(['library', 'queue', 'playlists'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
            background: tab === t ? 'var(--accent-bg)' : 'transparent',
            color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
            border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'library' && (
          <div>
            {/* Search */}
            <div style={{ padding: '8px 10px 4px', display: 'flex', gap: 4 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 8px' }}>
                <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracks..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 11, minWidth: 0 }} />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>}
              </div>
            </div>

            {/* Folders */}
            <div style={{ padding: '6px 10px' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                <FolderBtn icon={<Plus size={11} />} label="Current" onClick={addCurrentFolder} />
                <FolderBtn icon={<FolderOpen size={11} />} label="Browse..." onClick={addFolder} />
              </div>
              {folders.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: 'var(--bg)', border: '1px solid var(--border-color)', borderRadius: 4, marginBottom: 3, fontSize: 10, color: 'var(--text-secondary)' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f}>{fname(f)}</span>
                  <button onClick={() => removeFolder(f)} style={{ background: 'none', border: 'none', color: '#f55', cursor: 'pointer', padding: 0, display: 'flex', fontSize: 10 }}><X size={10} /></button>
                </div>
              ))}
            </div>

            {/* Liked songs */}
            {likedTracks.length > 0 && (
              <div style={{ padding: '0 10px 6px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Liked Songs ({likedTracks.length})
                </div>
                {likedTracks.map((t, i) => (
                  <TrackRow key={t.path} track={t} active={current?.path === t.path} playing={playing && current?.path === t.path}
                    onPlay={() => playTrack(t, i)} onLike={() => toggleLike(t.path)} liked={true}
                    onAddQueue={() => addToQueue(t)} onAddPl={addToPlaylist} playlists={playlists} />
                ))}
              </div>
            )}

            {/* All tracks */}
            <div style={{ padding: '0 10px 6px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                All Tracks ({filteredTracks.length})
              </div>
              {filteredTracks.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                  {folders.length ? 'No tracks found' : 'Add folders to start'}
                </div>
              ) : (
                filteredTracks.map((t, i) => (
                  <TrackRow key={t.path} track={t} active={current?.path === t.path} playing={playing && current?.path === t.path}
                    onPlay={() => playTrack(t, tracks.indexOf(t))} onLike={() => toggleLike(t.path)} liked={liked.has(t.path)}
                    onAddQueue={() => addToQueue(t)} onAddPl={addToPlaylist} playlists={playlists} />
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'queue' && (
          <div style={{ padding: '8px 10px' }}>
            {queue.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>Queue is empty. Right-click tracks to add.</div>
            ) : (
              queue.map((t, i) => (
                <div key={i + t.path} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 4,
                  background: i === queueIdx ? 'var(--accent-bg)' : 'transparent',
                  cursor: 'pointer', marginBottom: 2,
                }}
                onClick={() => { setQueueIdx(i); loadTrack(t, i) }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = i === queueIdx ? 'var(--accent-bg)' : 'transparent'}
                >
                  <GripVertical size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: i === queueIdx ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </span>
                  <button onClick={e => { e.stopPropagation(); removeFromQueue(i) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'playlists' && (
          <div style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="New playlist..." onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                style={{ flex: 1, padding: '4px 8px', background: 'var(--bg)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text)', fontSize: 11, outline: 'none' }} />
              <button onClick={createPlaylist} style={{
                padding: '4px 10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Create</button>
            </div>
            {playlists.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>No playlists yet</div>
            ) : (
              playlists.map(pl => {
                const plTracks = pl.tracks.map(tp => tracks.find(t => t.path === tp)).filter(Boolean) as Track[]
                return (
                  <div key={pl.id} style={{ marginBottom: 8, border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--bg)' }}>
                      <ListMusic size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{pl.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pl.tracks.length} tracks</span>
                      <button onClick={() => playPlaylist(pl)} disabled={!plTracks.length} style={{
                        padding: '2px 8px', background: '#1db954', color: '#fff', border: 'none', borderRadius: 10, fontSize: 10, cursor: plTracks.length ? 'pointer' : 'default', opacity: plTracks.length ? 1 : 0.4,
                      }}><Play size={10} /></button>
                      <button onClick={() => deletePlaylist(pl.id)} style={{ background: 'none', border: 'none', color: '#f55', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                    {plTracks.length > 0 && (
                      <div style={{ maxHeight: 120, overflow: 'auto' }}>
                        {plTracks.map(t => t && (
                          <div key={t.path} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 28px', fontSize: 10, color: 'var(--text-secondary)' }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                            <button onClick={() => removeFromPlaylist(pl.id, t.path)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={9} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────

function CtrlBtn({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4,
      color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
    >{icon}</button>
  )
}

function CtrlBtn2({ onClick, icon, active }: { onClick: () => void; icon: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4,
      color: active ? '#1db954' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
    onMouseEnter={e => e.currentTarget.style.color = active ? '#1ed760' : 'var(--text)'}
    onMouseLeave={e => e.currentTarget.style.color = active ? '#1db954' : 'var(--text-muted)'}
    >{icon}</button>
  )
}

function FolderBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      padding: '4px 0', background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)',
      borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--accent)' }}
    >{icon}{label}</button>
  )
}

function TrackRow({ track, active, playing, onPlay, onLike, liked, onAddQueue, onAddPl, playlists }: {
  track: Track; active: boolean; playing: boolean; onPlay: () => void; onLike: () => void; liked: boolean
  onAddQueue: () => void; onAddPl: (plId: string, trackPath: string) => void; playlists: Playlist[]
}) {
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menu])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 4,
      background: active ? 'var(--accent-bg)' : 'transparent', cursor: 'pointer', marginBottom: 1, position: 'relative',
    }}
    onClick={onPlay}
    onContextMenu={e => { e.preventDefault(); setMenu(!menu) }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 16, textAlign: 'center', flexShrink: 0 }}>
        {playing ? (
          <span style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 12 }}>
            <span style={{ width: 2, height: 8, background: '#1db954', borderRadius: 1, animation: 'bar1 0.5s ease infinite alternate' }} />
            <span style={{ width: 2, height: 12, background: '#1db954', borderRadius: 1, animation: 'bar2 0.4s ease infinite alternate' }} />
            <span style={{ width: 2, height: 6, background: '#1db954', borderRadius: 1, animation: 'bar3 0.6s ease infinite alternate' }} />
          </span>
        ) : (
          <Music2 size={11} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      <span style={{ flex: 1, fontSize: 11, color: active ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>
        {track.name}
      </span>
      <button onClick={e => { e.stopPropagation(); onLike() }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', opacity: liked ? 1 : 0.4 }}>
        <Heart size={11} style={{ color: liked ? '#1db954' : 'var(--text-muted)', fill: liked ? '#1db954' : 'none' }} />
      </button>

      {/* Context menu */}
      {menu && (
        <div ref={menuRef} style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 200,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 6, padding: '4px 0', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <MenuBtn onClick={() => { onAddQueue(); setMenu(false) }}>Add to Queue</MenuBtn>
          <MenuBtn onClick={() => { onLike(); setMenu(false) }}>{liked ? 'Unlike' : 'Like'}</MenuBtn>
          {playlists.length > 0 && <div style={{ height: 1, background: 'var(--border-color)', margin: '3px 0' }} />}
          {playlists.map(pl => (
            <MenuBtn key={pl.id} onClick={() => { onAddPl(pl.id, track.path); setMenu(false) }}>+ {pl.name}</MenuBtn>
          ))}
        </div>
      )}
    </div>
  )
}

function MenuBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', padding: '5px 12px', fontSize: 11, color: 'var(--text)',
      background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >{children}</button>
  )
}

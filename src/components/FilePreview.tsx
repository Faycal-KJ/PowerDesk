import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { formatSize, formatDateAbsolute, imageExts } from '../lib/format'
import { X, ChevronLeft, ChevronRight, File, FileText, Image, Video, Music, FileCode, FileSpreadsheet, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

const textExts = new Set([
  '.txt', '.md', '.json', '.xml', '.yml', '.yaml', '.toml', '.ini', '.cfg',
  '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.less', '.html', '.htm',
  '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
  '.sh', '.bat', '.ps1', '.env', '.gitignore', '.dockerfile', '.sql', '.r',
  '.swift', '.kt', '.dart', '.lua', '.pl', '.php', '.vue', '.svelte',
])

const pdfExts = new Set(['.pdf'])
const markdownExts = new Set(['.md', '.markdown', '.mdx'])
const codeExts = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.rs', '.java',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.sh', '.bat', '.ps1', '.sql',
  '.swift', '.kt', '.dart', '.lua', '.pl', '.php', '.vue', '.svelte',
  '.css', '.scss', '.less', '.html', '.htm', '.xml',
])
const jsonExts = new Set(['.json', '.jsonl'])
const csvExts = new Set(['.csv', '.tsv'])
const previewableVideoExts = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv'])
const previewableAudioExts = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.wma'])

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="md-code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="file://$2" alt="$1" style="max-width:100%;border-radius:4px" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent)">$1</a>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid var(--border-subtle);margin:8px 0" />')
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
  return `<div class="md-content"><p>${html}</p></div>`
}

const JS_KEYWORDS = new Set(['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','delete','typeof','instanceof','in','of','class','extends','super','this','import','export','default','from','async','await','try','catch','finally','throw','yield','static','get','set','true','false','null','undefined','void','NaN','Infinity'])
const PY_KEYWORDS = new Set(['def','class','return','if','elif','else','for','while','break','continue','pass','import','from','as','try','except','finally','raise','with','yield','lambda','and','or','not','in','is','True','False','None','self','print','async','await','global','nonlocal','del','assert'])
const GO_KEYWORDS = new Set(['func','package','import','var','const','type','struct','interface','return','if','else','for','range','switch','case','default','break','continue','go','defer','chan','map','make','new','nil','true','false','iota','select'])

function highlightCode(code: string, ext: string): string {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let keywords = JS_KEYWORDS
  if (ext === '.py') keywords = PY_KEYWORDS
  else if (ext === '.go') keywords = GO_KEYWORDS
  let result = escaped.replace(/(&quot;|"|')(?:(?!\1).)*?\1/g, '<span class="hl-str">$&</span>')
  result = result.replace(/`[^`]*`/g, '<span class="hl-str">$&</span>')
  result = result.replace(/(\/\/.*$)/gm, '<span class="hl-cmt">$&</span>')
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-cmt">$&</span>')
  result = result.replace(/(#.*$)/gm, '<span class="hl-cmt">$&</span>')
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>')
  for (const kw of keywords) {
    const re = new RegExp(`\\b(${kw})\\b`, 'g')
    result = result.replace(re, '<span class="hl-kw">$1</span>')
  }
  return result
}

export default function FilePreview() {
  const previewFile = useStore((s) => s.previewFile)
  const setPreviewFile = useStore((s) => s.setPreviewFile)
  const previewPrev = useStore((s) => s.previewPrev)
  const previewNext = useStore((s) => s.previewNext)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [fileStat, setFileStat] = useState<{ size: number; modifiedAt: string; createdAt: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null); setTextContent(null); setFileStat(null); setImageZoom(1); setImagePan({ x: 0, y: 0 })
      return
    }
    const api = getApi()
    if (api?.trackRecent && previewFile.path) api.trackRecent(previewFile.path)
    setImageZoom(1); setImagePan({ x: 0, y: 0 })
    setLoading(true)
    setPreviewUrl(null); setTextContent(null); setFileStat(null)
    let cancelled = false
    const ext = previewFile.extension.toLowerCase()
    if (imageExts.has(ext) && api?.readImagePreview) {
      api.readImagePreview(previewFile.path).then((url: string | null) => {
        if (cancelled) return
        setPreviewUrl(url); setTextContent(null); setLoading(false)
      }).catch(() => { if (!cancelled) { setPreviewUrl(null); setLoading(false) } })
    } else if (textExts.has(ext) && api?.readFileText) {
      api.readFileText(previewFile.path).then((res: any) => {
        if (cancelled) return
        if (res?.content) setTextContent(res.content)
        else setTextContent('[Preview not available: ' + (res?.error || 'unknown') + ']')
        setPreviewUrl(null); setLoading(false)
      }).catch(() => { if (!cancelled) { setTextContent('[Preview not available]'); setLoading(false) } })
    } else {
      setPreviewUrl(null); setTextContent(null); setLoading(false)
    }
    if (api?.getFileStat) {
      api.getFileStat(previewFile.path).then((s: any) => {
        if (!cancelled && s?.size != null) setFileStat(s)
      })
    }
    return () => { cancelled = true }
  }, [previewFile])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setPreviewFile(null) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); previewPrev() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); previewNext() }
    else if (e.key === '=' || e.key === '+') { e.preventDefault(); setImageZoom((z) => Math.min(z + 0.25, 10)) }
    else if (e.key === '-') { e.preventDefault(); setImageZoom((z) => Math.max(z - 0.25, 0.1)) }
    else if (e.key === '0') { e.preventDefault(); setImageZoom(1); setImagePan({ x: 0, y: 0 }) }
  }, [setPreviewFile, previewPrev, previewNext])

  useEffect(() => {
    if (!previewFile) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, previewFile])

  const ext = previewFile?.extension?.toLowerCase() || ''
  const isImage = imageExts.has(ext)
  const isText = textExts.has(ext)
  const isVideo = previewableVideoExts.has(ext)
  const isAudio = previewableAudioExts.has(ext)
  const isPdf = pdfExts.has(ext)
  const isMarkdown = markdownExts.has(ext)
  const isCode = codeExts.has(ext)
  const isJson = jsonExts.has(ext)
  const isCsv = csvExts.has(ext)

  const highlightedContent = useMemo(() => {
    if (!textContent) return null
    if (isJson) {
      try { return JSON.stringify(JSON.parse(textContent), null, 2) }
      catch { return textContent }
    }
    if (isCode) return highlightCode(textContent, ext)
    return null
  }, [textContent, isJson, isCode, ext])

  const handleImageWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setImageZoom((z) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15
      return Math.min(Math.max(z + delta, 0.1), 10)
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || imageZoom <= 1) return
    isPanning.current = true
    panStart.current = { x: e.clientX, y: e.clientY, panX: imagePan.x, panY: imagePan.y }
  }, [imageZoom, imagePan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    setImagePan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    })
  }, [])

  const handleMouseUp = useCallback(() => { isPanning.current = false }, [])

  if (!previewFile) return null

  function getPreviewIcon() {
    if (isImage) return <Image size={16} />
    if (isText) return isCode ? <FileCode size={16} /> : <FileText size={16} />
    if (isVideo) return <Video size={16} />
    if (isAudio) return <Music size={16} />
    if (isPdf) return <FileText size={16} />
    if (isCsv) return <FileSpreadsheet size={16} />
    return <File size={16} />
  }

  // IMAGE: full-screen dark overlay with zoom/pan
  if (isImage && previewUrl) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
          cursor: imageZoom > 1 ? 'grab' : 'default',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setPreviewFile(null) }}
        onWheel={handleImageWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={previewUrl}
          alt={previewFile.name}
          draggable={false}
          style={{
            maxWidth: imageZoom <= 1 ? '90vw' : 'none',
            maxHeight: imageZoom <= 1 ? '90vh' : 'none',
            width: imageZoom <= 1 ? 'auto' : undefined,
            height: imageZoom <= 1 ? 'auto' : undefined,
            objectFit: 'contain',
            transform: `scale(${imageZoom}) translate(${imagePan.x / imageZoom}px, ${imagePan.y / imageZoom}px)`,
            transition: isPanning.current ? 'none' : 'transform 0.1s ease-out',
            userSelect: 'none',
          }}
        />
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(0,0,0,0.7)', borderRadius: 8, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }} onMouseDown={(e) => e.stopPropagation()}>
          <ZoomBtn onClick={() => setImageZoom((z) => Math.max(z - 0.25, 0.1))}><ZoomOut size={15} /></ZoomBtn>
          <span style={{ color: '#ccc', fontSize: 11, width: 44, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{Math.round(imageZoom * 100)}%</span>
          <ZoomBtn onClick={() => setImageZoom((z) => Math.min(z + 0.25, 10))}><ZoomIn size={15} /></ZoomBtn>
          {imageZoom !== 1 && <ZoomBtn onClick={() => { setImageZoom(1); setImagePan({ x: 0, y: 0 }) }}><RotateCcw size={14} /></ZoomBtn>}
        </div>
        <NavBtnFloat side="left" onClick={previewPrev}><ChevronLeft size={20} /></NavBtnFloat>
        <NavBtnFloat side="right" onClick={previewNext}><ChevronRight size={20} /></NavBtnFloat>
        <button onClick={() => setPreviewFile(null)} style={{ position: 'fixed', top: 12, right: 12, display: 'flex', padding: 8, borderRadius: 8, background: 'rgba(0,0,0,0.5)', color: '#ccc', border: 'none', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
        ><X size={18} /></button>
        <div style={{ position: 'fixed', top: 12, left: 12, fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 6, backdropFilter: 'blur(8px)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {previewFile.name}
        </div>
      </div>
    )
  }

  if (isImage && !previewUrl && !loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }} onClick={(e) => { if (e.target === e.currentTarget) setPreviewFile(null) }}>
        <div style={{ color: '#999', fontSize: 13 }}>Preview not available</div>
      </div>
    )
  }

  // NON-IMAGE: card-based preview
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) setPreviewFile(null) }}>
      <div className="floating-panel" style={{ display: 'flex', flexDirection: 'column', width: '85vw', maxWidth: 1000, height: '80vh', maxHeight: 700, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>{getPreviewIcon()}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewFile.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{previewFile.path}</div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <NavBtn onClick={previewPrev}><ChevronLeft size={16} /></NavBtn>
            <NavBtn onClick={previewNext}><ChevronRight size={16} /></NavBtn>
            <NavBtn onClick={() => setPreviewFile(null)}><X size={16} /></NavBtn>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12.5 }}>Loading preview...</div>
          ) : isPdf ? (
            <iframe src={`file:///${previewFile.path.replace(/\\/g, '/')}`} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} title="PDF Preview" />
          ) : isMarkdown && textContent ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(textContent) }} />
              <style>{`.md-content h1{font-size:1.8em;font-weight:700;margin:16px 0 8px;color:var(--text-primary)}.md-content h2{font-size:1.5em;font-weight:600;margin:14px 0 6px;color:var(--text-primary)}.md-content h3{font-size:1.25em;font-weight:600;margin:12px 0 4px;color:var(--text-primary)}.md-content p{margin:6px 0;line-height:1.6;color:var(--text-primary);font-size:13px}.md-content blockquote{border-left:3px solid var(--accent);padding:4px 12px;margin:8px 0;color:var(--text-muted);background:var(--bg-tertiary);border-radius:0 var(--radius-sm) var(--radius-sm) 0}.md-content li{margin:2px 0 2px 20px;color:var(--text-primary);font-size:13px}.md-code-block{background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:12px;overflow-x:auto;font-family:'Cascadia Code',monospace;font-size:12px;line-height:1.5}.md-inline-code{background:var(--bg-tertiary);padding:1px 5px;border-radius:3px;font-family:'Cascadia Code',monospace;font-size:0.9em}`}</style>
            </div>
          ) : isCode && textContent ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
              <pre style={{ margin: 0, padding: 16, fontSize: 12.5, lineHeight: 1.6, fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono',monospace", color: 'var(--text-primary)', background: 'var(--bg-primary)', whiteSpace: 'pre', tabSize: 2 }}>
                <code dangerouslySetInnerHTML={{ __html: highlightedContent || textContent }} />
              </pre>
              <style>{`.hl-kw{color:#c586c0;font-weight:500}.hl-str{color:#ce9178}.hl-cmt{color:#6a9955;font-style:italic}.hl-num{color:#b5cea8}`}</style>
            </div>
          ) : isJson && textContent ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
              <pre style={{ margin: 0, padding: 16, fontSize: 12.5, lineHeight: 1.6, fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono',monospace", color: 'var(--text-primary)', background: 'var(--bg-primary)', whiteSpace: 'pre', tabSize: 2 }}>
                {highlightedContent || textContent}
              </pre>
            </div>
          ) : isCsv && textContent ? (
            <CsvTable content={textContent} />
          ) : isText && textContent ? (
            <pre style={{ width: '100%', height: '100%', margin: 0, padding: 16, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-primary)', background: 'var(--bg-primary)', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono',monospace" }}>
              {textContent}
            </pre>
          ) : isVideo ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} key={previewFile.path}>
                <source src={`file://${previewFile.path}`} />
              </video>
            </div>
          ) : isAudio ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, height: '100%' }}>
              <Music size={48} style={{ color: 'var(--text-muted)' }} />
              <audio controls autoPlay key={previewFile.path}>
                <source src={`file://${previewFile.path}`} />
              </audio>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32, color: 'var(--text-muted)', height: '100%' }}>
              <File size={40} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: 12.5 }}>No preview available for this file type</span>
            </div>
          )}
        </div>
        {fileStat && (
          <div style={{ display: 'flex', gap: 20, padding: '6px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)' }}>
            {fileStat.size != null && <span>{formatSize(fileStat.size)}</span>}
            {fileStat.modifiedAt && <span>Modified: {formatDateAbsolute(fileStat.modifiedAt)}</span>}
            {fileStat.createdAt && <span>Created: {formatDateAbsolute(fileStat.createdAt)}</span>}
            <span style={{ marginLeft: 'auto' }}>&#8592; &#8594; Navigate &middot; Esc Close</span>
          </div>
        )}
      </div>
    </div>
  )
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', padding: 4, borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >{children}</button>
  )
}

function NavBtnFloat({ side, onClick, children }: { side: 'left' | 'right'; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ position: 'fixed', [side]: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.4)', color: '#ccc', border: 'none', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
    >{children}</button>
  )
}

function ZoomBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', padding: 5, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#ccc' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >{children}</button>
  )
}

function CsvTable({ content }: { content: string }) {
  const rows = content.split('\n').filter((r) => r.trim())
  if (rows.length === 0) return null
  const delimiter = rows[0].includes('\t') ? '\t' : ','
  const parseRow = (row: string) => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (inQuotes) {
        if (ch === '"' && row[i + 1] === '"') { current += '"'; i++ }
        else if (ch === '"') inQuotes = false
        else current += ch
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === delimiter) { cells.push(current); current = '' }
        else current += ch
      }
    }
    cells.push(current)
    return cells
  }
  const header = parseRow(rows[0])
  const dataRows = rows.slice(1).map(parseRow)
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
        <thead>
          <tr>{header.map((h, i) => (
            <th key={i} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: 600, position: 'sticky', top: 0 }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => (
              <td key={ci} style={{ padding: '4px 10px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>{cell}</td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

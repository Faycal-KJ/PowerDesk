import { useState, useRef, useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { X } from 'lucide-react'

export default function Terminal() {
  const openTool = useStore((s) => s.openTool)
  const setOpenTool = useStore((s) => s.setOpenTool)
  const activeTab = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const [history, setHistory] = useState<{ cmd: string; output: string; error?: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const run = async () => {
    const cmd = input.trim()
    if (!cmd || loading) return
    setInput('')
    setLoading(true)
    const api = getApi()
    const cwd = activeTab?.path || 'C:\\'
    if (!api) return
    const res = await api.terminalExec(cwd, cmd)
    setHistory((h) => [...h, { cmd, output: res.stdout, error: res.stderr || res.error || undefined }])
    setLoading(false)
  }

  if (openTool !== 'terminal') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpenTool(null)}>
      <div className="floating-panel" style={{ background: '#0d1117', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', width: 640, height: 420, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #21262d' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#c9d1d9' }}>Terminal — {activeTab?.path || 'C:\\'}</span>
          <button onClick={() => setOpenTool(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px', fontFamily: 'Consolas, monospace', fontSize: 12, lineHeight: 1.5 }}>
          {history.map((h, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ color: '#58a6ff' }}>PS&gt; {h.cmd}</div>
              {h.output && <pre style={{ color: '#c9d1d9', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{h.output}</pre>}
              {h.error && <pre style={{ color: '#f85149', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{h.error}</pre>}
            </div>
          ))}
          {loading && <div style={{ color: '#8b949e' }}>Running...</div>}
          <div ref={endRef} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', borderTop: '1px solid #21262d', gap: 8 }}>
          <span style={{ color: '#58a6ff', fontFamily: 'Consolas, monospace', fontSize: 12 }}>PS&gt;</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') run() }}
            placeholder="Type a command..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#c9d1d9', fontFamily: 'Consolas, monospace', fontSize: 12, outline: 'none' }}
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}

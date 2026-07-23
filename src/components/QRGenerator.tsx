import { useState, useEffect, useRef } from 'react'
import { useStore } from '../stores/useStore'
import { X } from 'lucide-react'
import QRCode from 'qrcode'

export default function QRGenerator() {
  const openTool = useStore((s) => s.openTool)
  const setOpenTool = useStore((s) => s.setOpenTool)
  const [text, setText] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (openTool !== 'qr' || !text.trim() || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, text, { width: 256, margin: 2, color: { dark: '#e0e0e0', light: '#1a1a2e' } })
  }, [text, openTool])

  if (openTool !== 'qr') return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setOpenTool(null)}>
      <div className="floating-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-lg)', padding: 24, width: 340, boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 16px 48px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>QR Generator</span>
          <button onClick={() => setOpenTool(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={16} /></button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL..."
          style={{ width: '100%', height: 60, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: 8, fontSize: 12, resize: 'none', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
          {text.trim() ? <canvas ref={canvasRef} /> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Type something to generate</span>}
        </div>
        {text.trim() && (
          <button
            onClick={() => {
              canvasRef.current?.toBlob((blob) => {
                if (!blob) return
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'qrcode.png'
                a.click()
                URL.revokeObjectURL(url)
              })
            }}
            style={{ width: '100%', marginTop: 8, padding: '6px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer' }}
          >
            Download PNG
          </button>
        )}
      </div>
    </div>
  )
}

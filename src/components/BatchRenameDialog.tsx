import { useState, useRef, useEffect } from 'react'

interface Props {
  files: string[]
  onClose: () => void
  onDone: () => void
  onRename: (oldPath: string, newName: string) => Promise<void>
}

export default function BatchRenameDialog({ files, onClose, onDone, onRename }: Props) {
  const [pattern, setPattern] = useState('Photo')
  const [startNum, setStartNum] = useState(1)
  const [padding, setPadding] = useState(0)
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const ext = files[0]?.split('.').pop() || ''
    const p = padding > 0 ? startNum.toString().padStart(padding, '0') : startNum.toString()
    setPreview(files.map((f, i) => {
      const num = padding > 0 ? (startNum + i).toString().padStart(padding, '0') : (startNum + i).toString()
      return `${pattern} (${num}).${ext}`
    }))
  }, [pattern, startNum, padding, files])

  const handleRun = async () => {
    setRunning(true)
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].split('.').pop() || ''
      const num = padding > 0 ? (startNum + i).toString().padStart(padding, '0') : (startNum + i).toString()
      await onRename(files[i], `${pattern} (${num}).${ext}`)
    }
    onDone()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
          minWidth: 380,
          maxWidth: 500,
          boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 16px 48px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: 'var(--text-primary)' }}>
          Batch Rename ({files.length} files)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Name pattern</label>
          <input
            ref={inputRef}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Photo, Screenshot, Document"
          />
        </div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Start number</label>
            <input
              type="number"
              min={0}
              value={startNum}
              onChange={(e) => setStartNum(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Zero padding</label>
            <input
              type="number"
              min={0}
              max={10}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              style={inputStyle}
              title='e.g. 3 = "001", "002"'
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>Preview</div>
          <div style={{
            maxHeight: 160, overflow: 'auto',
            background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
            padding: 6,
          }}>
            {files.map((f, i) => (
              <div key={i} style={{ fontSize: 11.5, padding: '2px 4px', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', marginRight: 8 }}>
                  {f.split('\\').pop() || f.split('/').pop()}
                </span>
                → {preview[i]}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={btnStyle} disabled={running}>
            Cancel
          </button>
          <button
            onClick={handleRun}
            style={{ ...btnStyle, background: 'var(--accent)', color: '#fff' }}
            disabled={running || !pattern.trim()}
          >
            {running ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 8px',
  fontSize: 12.5,
  color: 'var(--text-primary)',
  outline: 'none',
  marginTop: 2,
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 12,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
}

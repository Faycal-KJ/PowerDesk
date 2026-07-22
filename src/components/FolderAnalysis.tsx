import { useState, useCallback } from "react"
import { useStore } from "../stores/useStore"
import { getApi } from '../lib/api'
import { X, FolderSearch, FileText, Folder, Trash2, Clock, HardDrive, BarChart3, Copy, ArrowDown } from "lucide-react"

interface FolderStats {
  totalSize: number
  totalFiles: number
  totalDirs: number
  extBreakdown: { ext: string; count: number; size: number }[]
  largestFiles: { name: string; path: string; dir: string; size: number; modified: string; ext: string }[]
  largestFolders: { path: string; name: string; size: number }[]
  duplicates: { name: string; path: string; dir: string; size: number; modified: string; ext: string }[][]
  emptyFolders: string[]
  oldFilesCount: number
  recentFiles: { name: string; path: string; dir: string; size: number; modified: string; ext: string }[]
  sizeBuckets: Record<string, number>
  avgFileSize: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const BUCKET_COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6']
const BUCKET_KEYS = ['< 1 MB', '1-10 MB', '10-100 MB', '100 MB - 1 GB', '> 1 GB']

const EXT_COLORS: Record<string, string> = {
  '.txt': '#95a5a6', '.pdf': '#e74c3c', '.doc': '#2980b9', '.docx': '#2980b9',
  '.xls': '#27ae60', '.xlsx': '#27ae60', '.ppt': '#e67e22', '.pptx': '#e67e22',
  '.jpg': '#e91e63', '.jpeg': '#e91e63', '.png': '#9c27b0', '.gif': '#ff5722',
  '.mp4': '#673ab7', '.mkv': '#673ab7', '.avi': '#673ab7', '.mov': '#673ab7',
  '.mp3': '#00bcd4', '.wav': '#00bcd4', '.flac': '#00bcd4',
  '.zip': '#795548', '.rar': '#795548', '.7z': '#795548',
  '.js': '#f7df1e', '.ts': '#3178c6', '.py': '#3776ab', '.html': '#e34c26',
  '.css': '#264de4', '.json': '#5b5b5b',
}

function PieChart({ buckets, total }: { buckets: Record<string, number>; total: number }) {
  if (total === 0) return null
  let cum = 0
  const slices = BUCKET_KEYS.map((key, i) => {
    const val = buckets[key] || 0
    const pct = (val / total) * 100
    const start = cum
    cum += pct
    return { key, val, pct, start, color: BUCKET_COLORS[i] }
  })

  const radius = 70
  const cx = 90
  const cy = 90

  function describeArc(startPct: number, endPct: number) {
    if (endPct - startPct >= 99.99) {
      return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
    }
    const start = (startPct / 100) * 360 - 90
    const end = (endPct / 100) * 360 - 90
    const largeArc = end - start > 180 ? 1 : 0
    const x1 = cx + radius * Math.cos((start * Math.PI) / 180)
    const y1 = cy + radius * Math.sin((start * Math.PI) / 180)
    const x2 = cx + radius * Math.cos((end * Math.PI) / 180)
    const y2 = cy + radius * Math.sin((end * Math.PI) / 180)
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={180} height={180}>
        {slices.filter(s => s.pct > 0).map((s) => (
          <path key={s.key} d={describeArc(s.start, s.start + s.pct)} fill={s.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={35} fill="var(--bg-secondary)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize={13} fontWeight={600}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>files</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
        {slices.filter(s => s.val > 0).map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', width: 100 }}>{s.key}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FolderAnalysis() {
  const open = useStore((s) => s.folderAnalysisOpen)
  const setOpen = useStore((s) => s.setFolderAnalysisOpen)
  const analysisPath = useStore((s) => s.folderAnalysisPath)
  const [data, setData] = useState<FolderStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'overview' | 'files' | 'duplicates' | 'folders'>('overview')

  const runAnalysis = useCallback(async () => {
    if (!analysisPath) return
    setLoading(true)
    const api = getApi()
    if (api?.analyzeFolder) {
      const result = await api.analyzeFolder(analysisPath)
      setData(result)
    }
    setLoading(false)
  }, [analysisPath])

  if (!open) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(0,0,0,0.5)' }} onClick={() => { setOpen(false); setData(null) }} />
      <div
        className="floating-panel"
        style={{
          position: 'fixed', inset: 40, zIndex: 1501,
          background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderSearch size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Folder Analysis</span>
            {analysisPath && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{analysisPath}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!data && !loading && (
              <button
                onClick={runAnalysis}
                disabled={!analysisPath}
                style={{
                  padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                  background: 'var(--accent)', color: '#fff', border: 'none', cursor: analysisPath ? 'pointer' : 'default',
                  opacity: analysisPath ? 1 : 0.4,
                }}
              >
                Analyze
              </button>
            )}
            {data && !loading && (
              <button
                onClick={runAnalysis}
                style={{
                  padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer',
                }}
              >
                Re-analyze
              </button>
            )}
            <button onClick={() => { setOpen(false); setData(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div className="loading-spinner" style={{ width: 32, height: 32 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Scanning folder...</span>
            </div>
          )}

          {!loading && !data && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <FolderSearch size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Click "Analyze" to scan this folder</span>
            </div>
          )}

          {!loading && data && (
            <>
              <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
                {(['overview', 'files', 'duplicates', 'folders'] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: '6px 14px', fontSize: 12.5, fontWeight: tab === t ? 600 : 400,
                    color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                    background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}>{t}</button>
                ))}
              </div>

              {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <StatCard icon={<HardDrive size={16} />} label="Total Size" value={formatSize(data.totalSize)} color="var(--accent)" />
                    <StatCard icon={<FileText size={16} />} label="Files" value={data.totalFiles.toString()} color="#2ecc71" />
                    <StatCard icon={<Folder size={16} />} label="Folders" value={data.totalDirs.toString()} color="#f39c12" />
                    <StatCard icon={<BarChart3 size={16} />} label="Avg File Size" value={formatSize(data.avgFileSize)} color="#9b59b6" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={cardStyle}>
                      <div style={cardTitle}>File Size Distribution</div>
                      <PieChart buckets={data.sizeBuckets} total={data.totalFiles} />
                    </div>
                    <div style={cardStyle}>
                      <div style={cardTitle}>File Types</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflow: 'auto' }}>
                        {data.extBreakdown.slice(0, 12).map((e) => (
                          <div key={e.ext} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                            <span style={{
                              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                              background: EXT_COLORS[e.ext] || 'var(--text-muted)',
                            }} />
                            <span style={{ color: 'var(--text-secondary)', width: 60 }}>{e.ext || '(none)'}</span>
                            <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(e.count / data.totalFiles) * 100}%`, background: EXT_COLORS[e.ext] || 'var(--text-muted)', borderRadius: 2 }} />
                            </div>
                            <span style={{ color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{e.count}</span>
                            <span style={{ color: 'var(--text-muted)', width: 55, textAlign: 'right' }}>{formatSize(e.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <StatCard icon={<Trash2 size={16} />} label="Empty Folders" value={data.emptyFolders.length.toString()} color="#e74c3c" />
                    <StatCard icon={<Clock size={16} />} label="Old Files (90+ days)" value={data.oldFilesCount.toString()} color="#e67e22" />
                    <StatCard icon={<Copy size={16} />} label="Duplicate Groups" value={data.duplicates.length.toString()} color="#3498db" />
                  </div>
                </div>
              )}

              {tab === 'files' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={cardStyle}>
                    <div style={cardTitle}><ArrowDown size={14} style={{ color: '#e74c3c' }} /> Largest Files</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflow: 'auto' }}>
                      {data.largestFiles.map((f) => (
                        <div key={f.path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11.5, borderBottom: '1px solid var(--border-subtle)' }}>
                          <FileText size={13} style={{ color: EXT_COLORS[f.path.split('.').pop() ? '.' + f.path.split('.').pop()!.toLowerCase() : ''] || 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={f.path}>{f.name}</span>
                          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(f.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={cardTitle}><Clock size={14} style={{ color: '#f39c12' }} /> Recently Modified</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflow: 'auto' }}>
                      {data.recentFiles.map((f) => (
                        <div key={f.path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11.5, borderBottom: '1px solid var(--border-subtle)' }}>
                          <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={f.path}>{f.name}</span>
                          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(f.modified).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'duplicates' && (
                <div style={cardStyle}>
                  <div style={cardTitle}><Copy size={14} style={{ color: '#3498db' }} /> Duplicate Files ({data.duplicates.length} groups)</div>
                  {data.duplicates.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No duplicates found</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflow: 'auto' }}>
                      {data.duplicates.map((group, gi) => (
                        <div key={gi} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                            {group.length} copies &mdash; {formatSize(group[0].size)} each &mdash; {formatSize(group[0].size * group.length)} wasted
                          </div>
                          {group.map((f) => (
                            <div key={f.path} style={{ fontSize: 11.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '1px 0' }} title={f.path}>
                              {f.path}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'folders' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={cardStyle}>
                    <div style={cardTitle}><ArrowDown size={14} style={{ color: '#e74c3c' }} /> Largest Folders</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 450, overflow: 'auto' }}>
                      {data.largestFolders.map((f) => (
                        <div key={f.path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11.5, borderBottom: '1px solid var(--border-subtle)' }}>
                          <Folder size={13} style={{ color: '#f39c12', flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={f.path}>{f.name}</span>
                          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(f.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={cardTitle}><Trash2 size={14} style={{ color: '#e74c3c' }} /> Empty Folders ({data.emptyFolders.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 450, overflow: 'auto' }}>
                      {data.emptyFolders.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No empty folders</div>
                      ) : data.emptyFolders.map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11.5, borderBottom: '1px solid var(--border-subtle)' }}>
                          <Folder size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={f}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: 14,
}

const cardTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
  marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
}

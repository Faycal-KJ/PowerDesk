import { useStore } from '../stores/useStore'
import { formatSize, formatSpeed, formatEta } from '../lib/format'
import { X, Pause, Play, XCircle, RotateCcw, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, CheckCircle, Clock, HardDrive } from 'lucide-react'

function statusColor(status: string) {
  switch (status) {
    case 'running': return 'var(--accent)'
    case 'paused': return 'var(--warning)'
    case 'completed': return 'var(--success)'
    case 'cancelled': return 'var(--text-muted)'
    default: return 'var(--text-secondary)'
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'running': return <ArrowDownToLine size={14} style={{ color: 'var(--accent)' }} />
    case 'paused': return <Clock size={14} style={{ color: 'var(--warning)' }} />
    case 'completed': return <CheckCircle size={14} style={{ color: 'var(--success)' }} />
    case 'cancelled': return <XCircle size={14} style={{ color: 'var(--text-muted)' }} />
    default: return null
  }
}

export default function TransferCenter() {
  const transferOpen = useStore((s) => s.transferOpen)
  const setTransferOpen = useStore((s) => s.setTransferOpen)
  const transfers = useStore((s) => s.transfers)
  const pauseTransfer = useStore((s) => s.pauseTransfer)
  const resumeTransfer = useStore((s) => s.resumeTransfer)
  const cancelTransfer = useStore((s) => s.cancelTransfer)
  const retryTransfer = useStore((s) => s.retryTransfer)

  if (!transferOpen) return null

  const activeCount = transfers.filter((t) => t.status === 'running' || t.status === 'paused').length
  const completedCount = transfers.filter((t) => t.status === 'completed').length

  return (
    <div className="floating-panel" style={{ position: 'fixed', bottom: 32, right: 12, width: 420, maxHeight: 480, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', zIndex: 1500, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HardDrive size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Transfer Center</span>
          {activeCount > 0 && <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>{activeCount}</span>}
        </div>
        <button onClick={() => setTransferOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
      </div>

      {/* Transfer list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {transfers.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No transfers yet
          </div>
        ) : (
          transfers.map((t) => {
            const pct = t.totalBytes > 0 ? Math.round((t.transferredBytes / t.totalBytes) * 100) : 0
            return (
              <div key={t.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Top row: icon, name, status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <StatusIcon status={t.status} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                      <span>{t.operation === 'copy' ? 'Copying' : 'Moving'}</span>
                      <span>{t.completedFiles}/{t.totalFiles} files</span>
                      <span>{formatSize(t.transferredBytes)} / {formatSize(t.totalBytes)}</span>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    {t.status === 'running' && (
                      <button onClick={() => pauseTransfer(t.id)} title="Pause" style={actionBtnStyle}>
                        <Pause size={12} />
                      </button>
                    )}
                    {t.status === 'paused' && (
                      <button onClick={() => resumeTransfer(t.id)} title="Resume" style={actionBtnStyle}>
                        <Play size={12} />
                      </button>
                    )}
                    {(t.status === 'running' || t.status === 'paused') && (
                      <button onClick={() => cancelTransfer(t.id)} title="Cancel" style={{ ...actionBtnStyle, color: 'var(--danger)' }}>
                        <XCircle size={12} />
                      </button>
                    )}
                    {t.status === 'completed' && t.errors.length === 0 && (
                      <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                    )}
                    {t.status === 'completed' && t.errors.length > 0 && (
                      <button onClick={() => retryTransfer(t.id)} title="Retry failed" style={actionBtnStyle}>
                        <RotateCcw size={12} />
                      </button>
                    )}
                    {t.status === 'cancelled' && (
                      <button onClick={() => retryTransfer(t.id)} title="Retry" style={actionBtnStyle}>
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 2, transition: 'width 200ms ease',
                    width: `${pct}%`,
                    background: t.status === 'completed'
                      ? t.errors.length > 0 ? 'var(--warning)' : 'var(--success)'
                      : t.status === 'paused' ? 'var(--warning)' : 'var(--accent)',
                  }} />
                </div>

                {/* Speed + ETA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>{formatSpeed(t.speed)}</span>
                  <span>{t.status === 'running' ? `ETA ${formatEta(t.transferredBytes, t.totalBytes, t.speed)}` : t.status === 'completed' ? (t.errors.length > 0 ? `${t.errors.length} failed` : 'Done') : t.status === 'paused' ? 'Paused' : 'Cancelled'}</span>
                </div>

                {/* Errors */}
                {t.errors.length > 0 && t.status !== 'cancelled' && (
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--danger)' }}>
                    <AlertTriangle size={10} />
                    <span>{t.errors.length} error{t.errors.length > 1 ? 's' : ''}: {t.errors[0].error}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const actionBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 4, background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
}

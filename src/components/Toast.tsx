import React, { useState, useEffect, useCallback } from 'react'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface Toast {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
}

let toastId = 0
const listeners: Array<(toast: Toast) => void> = []

export function showToast(type: Toast['type'], message: string) {
  const toast: Toast = { id: `toast-${++toastId}`, type, message }
  listeners.forEach((l) => l(toast))
}

let timeout: ReturnType<typeof setTimeout> | null = null

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev.slice(-4), toast])
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => setToasts([]), 4000)
    }
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  const iconMap = {
    error: <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />,
    warning: <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />,
    info: <Info size={14} style={{ color: 'var(--accent)' }} />,
    success: <CheckCircle size={14} style={{ color: 'var(--success)' }} />,
  }

  const bgMap = {
    error: 'var(--danger-bg)',
    warning: 'var(--warning-bg, var(--bg-secondary))',
    info: 'var(--accent-bg)',
    success: 'var(--success-bg, var(--bg-secondary))',
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 48,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 10000,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: bgMap[t.type],
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: 12,
            color: 'var(--text-primary)',
            pointerEvents: 'auto',
            animation: 'toastIn 0.2s ease-out',
            maxWidth: 360,
          }}
        >
          {iconMap[t.type]}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

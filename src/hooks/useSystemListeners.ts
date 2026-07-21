import { useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'

export function useTransferListener() {
  useEffect(() => {
    const api = getApi()
    if (!api?.onTransferProgress) return
    const off = api.onTransferProgress((data: any) => {
      useStore.getState().updateTransfer(data)
    })
    return () => { off?.() }
  }, [])
}

export function useClipboardMonitor() {
  useEffect(() => {
    const api = getApi()
    if (!api?.readClipboardText) return
    let lastText = ''
    let stopped = false
    const interval = setInterval(async () => {
      if (stopped) return
      try {
        const text = await api.readClipboardText()
        if (text && text !== lastText && text.length > 0 && text.length < 10000) {
          lastText = text
          useStore.getState().addClipboardEntry({
            type: 'text',
            content: text,
          })
        }
      } catch {}
    }, 2000)
    return () => { stopped = true; clearInterval(interval) }
  }, [])
}

export function useMultiWindowSync() {
  const handleSyncMessage = useStore((s) => s.handleSyncMessage)
  const broadcastSync = useStore((s) => s.broadcastSync)
  const syncEnabled = useStore((s) => s.syncEnabled)
  const activeTabPath = useStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.path)
  const selectedPaths = useStore((s) => s.selectedPathsForContext)

  useEffect(() => {
    const api = getApi()
    if (!api?.onSyncMessage) return
    const off = api.onSyncMessage((_channel: string, data: any) => {
      handleSyncMessage(data)
    })
    return () => { off?.() }
  }, [handleSyncMessage])

  useEffect(() => {
    if (!syncEnabled || !activeTabPath) return
    broadcastSync({ type: 'navigate', path: activeTabPath })
  }, [activeTabPath, syncEnabled, broadcastSync])

  useEffect(() => {
    if (!syncEnabled) return
    broadcastSync({ type: 'select', paths: selectedPaths })
  }, [selectedPaths, syncEnabled, broadcastSync])
}

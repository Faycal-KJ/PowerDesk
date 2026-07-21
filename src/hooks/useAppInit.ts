import { useEffect, useRef } from 'react'
import { useStore } from '../stores/useStore'
import { getApi } from '../lib/api'
import { pluginManager } from '../plugins/pluginManager'
import { discoverExternalPlugins, loadExternalPlugin } from '../plugins/loader'
import { applyPluginThemes } from './applyPluginThemes'

export function useAppInit() {
  const loadedRef = useRef(false)
  const navigateTo = useStore((s) => s.navigateTo)
  const setInitialDirs = useStore((s) => s.setInitialDirs)
  const appendWorkspaceTabs = useStore((s) => s.appendWorkspaceTabs)
  const persistWorkspace = useStore((s) => s.persistWorkspace)

  useEffect(() => {
    const api = getApi()
    if (!api) return

    // Delay indexer by 3s to not block launch
    setTimeout(() => {
      if (api.searchBuildIndex) {
        api.searchBuildIndex([])
      }
    }, 3000)

    api.getInitialDirs().then((dirs) => {
      setInitialDirs(dirs as unknown as Record<string, string>)
      api.loadWorkspace().then((savedTabs: any) => {
        if (savedTabs && savedTabs.length > 0) {
          appendWorkspaceTabs(savedTabs)
          const first = savedTabs[0]
          if (first?.path) {
            navigateTo(first.path, first.id)
          } else if (dirs.home) {
            navigateTo(dirs.home)
          }
        } else if (dirs.home) {
          navigateTo(dirs.home)
        }
        loadedRef.current = true
      })
    })

    let offSave: (() => void) | undefined
    if (api.onSaveWorkspaceRequest) {
      offSave = api.onSaveWorkspaceRequest(() => {
        persistWorkspace()
      })
    }

    discoverExternalPlugins().then((manifests) => {
      for (const manifest of manifests) {
        loadExternalPlugin(manifest.id).catch(() => {})
      }
      applyPluginThemes()
      pluginManager.emit('appReady')
    }).catch(() => {})

    return () => { offSave?.() }
  }, [])

  return loadedRef
}

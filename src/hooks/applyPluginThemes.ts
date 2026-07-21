import { pluginManager } from '../plugins/pluginManager'

export function applyPluginThemes() {
  const themes = pluginManager.getThemes()
  for (const theme of themes) {
    for (const [key, value] of Object.entries(theme.colors)) {
      document.documentElement.style.setProperty(`--${key}`, value)
    }
  }
}

import { create } from 'zustand'
import type { AppSettings, AppPreferences, BrandKit } from '@shared/types'
import { DEFAULT_PREFERENCES } from '@shared/types'
import { api } from '@/services/api'
import { useCanvasStore } from '@/stores/canvasStore'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  load: () => Promise<void>
  setApiKey: (field: string, value: string) => void
  setBaseUrl: (field: string, value: string) => void
  setBrandKit: (patch: Partial<BrandKit>) => void
  setPreferences: (patch: Partial<AppPreferences>) => void
  save: () => Promise<void>
}

const EMPTY: AppSettings = {
  apiKeys: {},
  baseUrls: {},
  brandKit: { enabled: false, name: '', colors: [], fonts: [], styleNotes: '' },
  preferences: { ...DEFAULT_PREFERENCES },
}

/** Push canvas-related prefs into the live canvas store. */
function syncCanvas(p: AppPreferences) {
  useCanvasStore.getState().applyPreferences({
    showGrid: p.showGrid,
    snapEnabled: p.snapEnabled,
    canvasBg: p.canvasBg,
    exportFormat: p.exportFormat,
    exportQuality: p.exportQuality,
    exportScale: p.exportScale,
    longImageGap: p.longImageGap,
  })
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: EMPTY,
  loaded: false,
  async load() {
    const loaded = await api.getSettings()
    const settings: AppSettings = {
      ...loaded,
      preferences: { ...DEFAULT_PREFERENCES, ...(loaded.preferences ?? {}) },
    }
    set({ settings, loaded: true })
    syncCanvas(settings.preferences!)
  },
  setApiKey(field, value) {
    set((s) => ({ settings: { ...s.settings, apiKeys: { ...s.settings.apiKeys, [field]: value } } }))
  },
  setBaseUrl(field, value) {
    set((s) => ({ settings: { ...s.settings, baseUrls: { ...s.settings.baseUrls, [field]: value } } }))
  },
  setBrandKit(patch) {
    set((s) => ({ settings: { ...s.settings, brandKit: { ...s.settings.brandKit, ...patch } } }))
  },
  setPreferences(patch) {
    set((s) => ({
      settings: {
        ...s.settings,
        preferences: { ...(s.settings.preferences ?? DEFAULT_PREFERENCES), ...patch },
      },
    }))
    syncCanvas(get().settings.preferences!)
  },
  async save() {
    await api.saveSettings(get().settings)
  },
}))

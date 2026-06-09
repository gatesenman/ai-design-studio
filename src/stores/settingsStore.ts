import { create } from 'zustand'
import type { AppSettings, BrandKit } from '@shared/types'
import { api } from '@/services/api'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  load: () => Promise<void>
  setApiKey: (field: string, value: string) => void
  setBaseUrl: (field: string, value: string) => void
  setBrandKit: (patch: Partial<BrandKit>) => void
  save: () => Promise<void>
}

const EMPTY: AppSettings = {
  apiKeys: {},
  baseUrls: {},
  brandKit: { enabled: false, name: '', colors: [], fonts: [], styleNotes: '' },
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: EMPTY,
  loaded: false,
  async load() {
    const settings = await api.getSettings()
    set({ settings, loaded: true })
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
  async save() {
    await api.saveSettings(get().settings)
  },
}))

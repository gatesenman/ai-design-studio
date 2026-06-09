import type {
  AppSettings,
  GenerateRequest,
  GenerateResult,
  ApiError,
  ProviderInfo,
  Skill,
} from '@shared/types'
import { PROVIDERS } from '@shared/providers'
import { BUILTIN_SKILLS } from '@shared/builtinSkills'
import { demoGenerate } from './demo'

const isElectron = typeof window !== 'undefined' && !!window.api

const LS_SETTINGS = 'ads.settings'
const LS_SKILLS = 'ads.skills'

const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {},
  baseUrls: {},
  brandKit: { enabled: false, name: '', colors: [], fonts: [], styleNotes: '' },
}

export function isApiError(r: GenerateResult | ApiError): r is ApiError {
  return (r as ApiError).error !== undefined
}

export const api = {
  async getProviders(): Promise<ProviderInfo[]> {
    if (isElectron) return window.api.getProviders()
    return PROVIDERS
  },

  async generate(req: GenerateRequest): Promise<GenerateResult | ApiError> {
    if (isElectron) {
      const settings = await this.getSettings()
      const provider = PROVIDERS.find((p) => p.id === req.providerId)
      const hasKey = provider && settings.apiKeys[provider.apiKeyField]?.trim()
      // Fall back to demo if no key configured, so the app is always usable.
      if (hasKey) return window.api.generate(req)
      const images = await demoGenerate(req)
      return { images, providerId: req.providerId, model: req.model }
    }
    const images = await demoGenerate(req)
    return { images, providerId: req.providerId, model: req.model }
  },

  async getSettings(): Promise<AppSettings> {
    if (isElectron) return window.api.getSettings()
    try {
      const raw = localStorage.getItem(LS_SETTINGS)
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  async saveSettings(s: AppSettings): Promise<AppSettings> {
    if (isElectron) return window.api.saveSettings(s)
    localStorage.setItem(LS_SETTINGS, JSON.stringify(s))
    return s
  },

  async getSkills(): Promise<Skill[]> {
    if (isElectron) return window.api.getSkills()
    try {
      const raw = localStorage.getItem(LS_SKILLS)
      const custom: Skill[] = raw ? JSON.parse(raw) : []
      return [...BUILTIN_SKILLS, ...custom.filter((s) => !s.builtin)]
    } catch {
      return BUILTIN_SKILLS
    }
  },

  async saveSkills(skills: Skill[]): Promise<Skill[]> {
    if (isElectron) return window.api.saveSkills(skills)
    const custom = skills.filter((s) => !s.builtin)
    localStorage.setItem(LS_SKILLS, JSON.stringify(custom))
    return [...BUILTIN_SKILLS, ...custom]
  },

  async exportImage(dataUrl: string, name: string): Promise<string | null> {
    if (isElectron) return window.api.exportImage(dataUrl, name)
    downloadInBrowser(dataUrl, name)
    return name
  },

  async exportLongImage(dataUrl: string): Promise<string | null> {
    if (isElectron) return window.api.exportLongImage(dataUrl)
    downloadInBrowser(dataUrl, `详情页长图_${Date.now()}.png`)
    return 'ok'
  },
}

function downloadInBrowser(dataUrl: string, name: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

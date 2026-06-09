import type {
  AppSettings,
  GenerateRequest,
  GenerateResult,
  ApiError,
  ProviderInfo,
  Skill,
} from '@shared/types'

export interface DesktopApi {
  getProviders: () => Promise<ProviderInfo[]>
  generate: (req: GenerateRequest) => Promise<GenerateResult | ApiError>
  getSettings: () => Promise<AppSettings>
  saveSettings: (s: AppSettings) => Promise<AppSettings>
  getSkills: () => Promise<Skill[]>
  saveSkills: (s: Skill[]) => Promise<Skill[]>
  exportImage: (dataUrl: string, name: string) => Promise<string | null>
  exportLongImage: (dataUrl: string) => Promise<string | null>
}

declare global {
  interface Window {
    api: DesktopApi
  }
}

import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type {
  AppSettings,
  GenerateRequest,
  GenerateResult,
  ApiError,
  ProviderInfo,
  Skill,
} from '../shared/types'

const api = {
  getProviders: (): Promise<ProviderInfo[]> => ipcRenderer.invoke(IPC.GET_PROVIDERS),
  generate: (req: GenerateRequest): Promise<GenerateResult | ApiError> =>
    ipcRenderer.invoke(IPC.GENERATE, req),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.GET_SETTINGS),
  saveSettings: (s: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SAVE_SETTINGS, s),
  getSkills: (): Promise<Skill[]> => ipcRenderer.invoke(IPC.GET_SKILLS),
  saveSkills: (s: Skill[]): Promise<Skill[]> => ipcRenderer.invoke(IPC.SAVE_SKILLS, s),
  exportImage: (dataUrl: string, name: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.EXPORT_IMAGE, dataUrl, name),
  exportLongImage: (dataUrl: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.EXPORT_LONG_IMAGE, dataUrl),
}

contextBridge.exposeInMainWorld('api', api)

export type DesktopApi = typeof api

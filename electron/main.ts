import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { IPC } from '../shared/types'
import type { AppSettings, GenerateRequest, Skill } from '../shared/types'
import { PROVIDERS } from '../shared/providers'
import { runGenerate } from './services/providers/index'
import { getSettings, saveSettings, getSkills, saveSkills } from './services/store'
import { exportImage, exportLongImage } from './services/files'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    title: 'AI Design Studio',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#1a1a1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function registerIpc() {
  ipcMain.handle(IPC.GET_PROVIDERS, () => PROVIDERS)

  ipcMain.handle(IPC.GENERATE, async (_e, req: GenerateRequest) => {
    try {
      const settings = await getSettings()
      return await runGenerate(req, settings)
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings())
  ipcMain.handle(IPC.SAVE_SETTINGS, (_e, s: AppSettings) => saveSettings(s))
  ipcMain.handle(IPC.GET_SKILLS, () => getSkills())
  ipcMain.handle(IPC.SAVE_SKILLS, (_e, s: Skill[]) => saveSkills(s))
  ipcMain.handle(IPC.EXPORT_IMAGE, (_e, dataUrl: string, name: string) =>
    exportImage(dataUrl, name),
  )
  ipcMain.handle(IPC.EXPORT_LONG_IMAGE, (_e, dataUrl: string) => exportLongImage(dataUrl))
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

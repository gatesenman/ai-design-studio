import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { AppSettings, Skill } from '../../shared/types'
import { BUILTIN_SKILLS } from '../../shared/builtinSkills'

const userDir = () => app.getPath('userData')
const settingsPath = () => path.join(userDir(), 'settings.json')
const skillsPath = () => path.join(userDir(), 'skills.json')

const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {},
  baseUrls: {},
  brandKit: {
    enabled: false,
    name: '',
    colors: [],
    fonts: [],
    styleNotes: '',
  },
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf-8')
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getSettings(): Promise<AppSettings> {
  return readJson<AppSettings>(settingsPath(), DEFAULT_SETTINGS)
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  await writeJson(settingsPath(), settings)
  return settings
}

export async function getSkills(): Promise<Skill[]> {
  const custom = await readJson<{ skills: Skill[] }>(skillsPath(), { skills: [] })
  // Built-in skills are always present and come first; custom skills are appended.
  const customOnly = custom.skills.filter((s) => !s.builtin)
  return [...BUILTIN_SKILLS, ...customOnly]
}

export async function saveSkills(skills: Skill[]): Promise<Skill[]> {
  // Only persist non-builtin (custom) skills.
  const customOnly = skills.filter((s) => !s.builtin)
  await writeJson(skillsPath(), { skills: customOnly })
  return getSkills()
}

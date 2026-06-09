import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Skill } from '@shared/types'
import { api } from '@/services/api'

interface SkillState {
  skills: Skill[]
  loaded: boolean
  load: () => Promise<void>
  upsert: (skill: Skill) => Promise<void>
  create: (partial?: Partial<Skill>) => Promise<Skill>
  remove: (id: string) => Promise<void>
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: [],
  loaded: false,
  async load() {
    const skills = await api.getSkills()
    set({ skills, loaded: true })
  },
  async upsert(skill) {
    const exists = get().skills.some((s) => s.id === skill.id)
    const next = exists
      ? get().skills.map((s) => (s.id === skill.id ? skill : s))
      : [...get().skills, skill]
    const saved = await api.saveSkills(next)
    set({ skills: saved })
  },
  async create(partial) {
    const skill: Skill = {
      id: nanoid(8),
      name: partial?.name || '新建 Skill',
      description: partial?.description || '',
      category: partial?.category || 'custom',
      promptTemplate: partial?.promptTemplate || '{{subject}}',
      defaultProviderId: partial?.defaultProviderId || 'openai-gpt-image',
      defaultModel: partial?.defaultModel || 'gpt-image-1',
      size: partial?.size || '1024x1024',
      count: partial?.count ?? 2,
      variables: partial?.variables || ['subject'],
      sections: partial?.sections,
      builtin: false,
    }
    await get().upsert(skill)
    return skill
  },
  async remove(id) {
    const next = get().skills.filter((s) => s.id !== id)
    const saved = await api.saveSkills(next)
    set({ skills: saved })
  },
}))

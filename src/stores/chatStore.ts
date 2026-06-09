import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { GenerateRequest, GenerationMode, ProviderId, Skill } from '@shared/types'
import { api, isApiError } from '@/services/api'
import { useCanvasStore } from './canvasStore'
import { useSettingsStore } from './settingsStore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  images?: string[]
  /** Agent "thinking" steps (MCoT-style). */
  steps?: string[]
  pending?: boolean
}

interface GenParams {
  providerId: ProviderId
  model: string
  mode: GenerationMode
  size: string
  count: number
  referenceImage?: string
}

interface ChatState {
  messages: ChatMessage[]
  busy: boolean
  params: GenParams
  setParams: (p: Partial<GenParams>) => void
  send: (prompt: string) => Promise<void>
  runSkill: (skill: Skill, vars: Record<string, string>) => Promise<void>
  clear: () => void
}

function applyBrandKit(prompt: string): string {
  const bk = useSettingsStore.getState().settings.brandKit
  if (!bk.enabled) return prompt
  const parts: string[] = [prompt]
  if (bk.colors.length) parts.push(`品牌主色：${bk.colors.join('、')}`)
  if (bk.fonts.length) parts.push(`字体风格：${bk.fonts.join('、')}`)
  if (bk.styleNotes) parts.push(bk.styleNotes)
  return parts.join('，')
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || '')
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      text:
        '你好！我是你的 AI 设计助手。在下方输入需求即可生成图片，或点击上方「Skill」使用电商主图 / 海报 / 详情页等预设工作流。右侧画布可自由缩放、拖拽、排版。',
    },
  ],
  busy: false,
  params: {
    providerId: 'openai-gpt-image',
    model: 'gpt-image-1',
    mode: 'text-to-image',
    size: '1024x1024',
    count: 4,
  },

  setParams(p) {
    set((s) => ({ params: { ...s.params, ...p } }))
  },

  async send(prompt) {
    if (!prompt.trim() || get().busy) return
    const { params } = get()
    const userMsg: ChatMessage = { id: nanoid(6), role: 'user', text: prompt }
    const steps = [
      '解析需求意图…',
      `选择模型：${params.model}（${params.mode === 'image-to-image' ? '图生图' : '文生图'}）`,
      useSettingsStore.getState().settings.brandKit.enabled ? '应用品牌套件约束…' : '组织生成参数…',
      `批量生成 ${params.count} 张（${params.size}）…`,
    ]
    const pendingMsg: ChatMessage = {
      id: nanoid(6),
      role: 'assistant',
      text: '正在生成…',
      steps,
      pending: true,
    }
    set((s) => ({ messages: [...s.messages, userMsg, pendingMsg], busy: true }))

    const req: GenerateRequest = {
      providerId: params.providerId,
      model: params.model,
      mode: params.mode,
      prompt: applyBrandKit(prompt),
      size: params.size,
      count: params.count,
      referenceImage: params.mode === 'image-to-image' ? params.referenceImage : undefined,
    }

    const res = await api.generate(req)
    if (isApiError(res)) {
      set((s) => ({
        busy: false,
        messages: s.messages.map((m) =>
          m.id === pendingMsg.id ? { ...m, pending: false, text: `生成失败：${res.error}` } : m,
        ),
      }))
      return
    }

    const urls = res.images.map((i) => i.dataUrl)
    await useCanvasStore.getState().addImagesGrid(urls, Math.min(urls.length, 2))
    set((s) => ({
      busy: false,
      messages: s.messages.map((m) =>
        m.id === pendingMsg.id
          ? {
              ...m,
              pending: false,
              text: `已生成 ${urls.length} 张图片，已放置到画布。`,
              images: urls,
            }
          : m,
      ),
    }))
  },

  async runSkill(skill, vars) {
    if (get().busy) return
    const summary = `运行 Skill：${skill.name}`
    const isLong = !!skill.sections?.length

    const steps = [
      `加载 Skill「${skill.name}」`,
      '解析变量与品牌约束…',
      isLong ? `规划 ${skill.sections!.length} 个分节，保持风格连贯…` : `准备批量生成 ${skill.count} 张…`,
      `模型：${skill.defaultModel}（${skill.size}）`,
    ]
    const userMsg: ChatMessage = { id: nanoid(6), role: 'user', text: summary }
    const pendingMsg: ChatMessage = {
      id: nanoid(6),
      role: 'assistant',
      text: '正在生成…',
      steps,
      pending: true,
    }
    set((s) => ({ messages: [...s.messages, userMsg, pendingMsg], busy: true }))

    const base = fillTemplate(skill.promptTemplate, vars)
    // Shared seed keeps a long image's sections visually coherent.
    const seed = Math.floor(Math.random() * 1_000_000)

    try {
      if (isLong) {
        const urls: string[] = []
        const titles: string[] = []
        for (const section of skill.sections!) {
          const sectionPrompt = `${base}。${fillTemplate(section.prompt, vars)}。保持与整体一致的风格、色调、光线与构图，画面上下可无缝衔接`
          const res = await api.generate({
            providerId: skill.defaultProviderId,
            model: skill.defaultModel,
            mode: 'text-to-image',
            prompt: applyBrandKit(sectionPrompt),
            size: skill.size,
            count: 1,
            seed,
          })
          if (isApiError(res)) throw new Error(res.error)
          if (res.images[0]) {
            urls.push(res.images[0].dataUrl)
            titles.push(section.title)
          }
        }
        await useCanvasStore.getState().addLongImageColumn(urls, titles)
        set((s) => ({
          busy: false,
          messages: s.messages.map((m) =>
            m.id === pendingMsg.id
              ? {
                  ...m,
                  pending: false,
                  text: `详情页长图已生成 ${urls.length} 个分节并垂直拼接到画布（可框选后「导出长图」合并为一张）。`,
                  images: urls,
                }
              : m,
          ),
        }))
      } else {
        const res = await api.generate({
          providerId: skill.defaultProviderId,
          model: skill.defaultModel,
          mode: 'text-to-image',
          prompt: applyBrandKit(base),
          size: skill.size,
          count: skill.count,
          seed,
        })
        if (isApiError(res)) throw new Error(res.error)
        const urls = res.images.map((i) => i.dataUrl)
        await useCanvasStore.getState().addImagesGrid(urls, Math.min(urls.length, 2))
        set((s) => ({
          busy: false,
          messages: s.messages.map((m) =>
            m.id === pendingMsg.id
              ? { ...m, pending: false, text: `「${skill.name}」已生成 ${urls.length} 张并放置到画布。`, images: urls }
              : m,
          ),
        }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      set((s) => ({
        busy: false,
        messages: s.messages.map((m) =>
          m.id === pendingMsg.id ? { ...m, pending: false, text: `生成失败：${msg}` } : m,
        ),
      }))
    }
  },

  clear() {
    set({ messages: get().messages.slice(0, 1) })
  },
}))

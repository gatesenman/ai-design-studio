import { useEffect, useState } from 'react'
import { Play, ChevronDown } from 'lucide-react'
import type { ProviderId, ProviderInfo, Skill } from '@shared/types'
import { useChatStore } from '@/stores/chatStore'
import { api } from '@/services/api'
import Modal from '@/components/common/Modal'

const VAR_LABELS: Record<string, string> = {
  product_name: '商品名称',
  style: '风格',
  background: '背景',
  theme: '主题',
  selling_point: '卖点',
  mood: '氛围',
  color: '主色调',
  subject: '主体',
}

export default function SkillRunModal({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const [vars, setVars] = useState<Record<string, string>>(
    Object.fromEntries(skill.variables.map((v) => [v, ''])),
  )
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [showModels, setShowModels] = useState(false)
  const [providerId, setProviderId] = useState<ProviderId>(skill.defaultProviderId)
  const [model, setModel] = useState<string>(skill.defaultModel)
  const runSkill = useChatStore((s) => s.runSkill)
  const busy = useChatStore((s) => s.busy)

  useEffect(() => {
    api.getProviders().then(setProviders)
  }, [])

  const currentProvider = providers.find((p) => p.id === providerId)
  const currentModel = currentProvider?.models.find((m) => m.id === model)

  const selectModel = (pid: string, mid: string) => {
    setProviderId(pid as ProviderId)
    setModel(mid)
    setShowModels(false)
  }

  const run = () => {
    runSkill(skill, vars, { providerId, model })
    onClose()
  }

  const globalProviders = providers.filter((p) => p.region === 'global')
  const chinaProviders = providers.filter((p) => p.region === 'china')

  return (
    <Modal title={`运行 Skill · ${skill.name}`} onClose={onClose}>
      <p className="mb-4 text-sm text-gray-400">{skill.description}</p>

      <div className="mb-4 space-y-3">
        {skill.variables.map((v) => (
          <div key={v}>
            <label className="mb-1 block text-xs text-gray-400">{VAR_LABELS[v] || v}</label>
            <input
              value={vars[v] || ''}
              onChange={(e) => setVars({ ...vars, [v]: e.target.value })}
              placeholder={`请输入${VAR_LABELS[v] || v}`}
              className="w-full rounded-lg border border-border bg-panel-light px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
            />
          </div>
        ))}
        {skill.variables.length === 0 && (
          <p className="text-sm text-gray-500">该 Skill 无需额外参数，可直接运行。</p>
        )}
      </div>

      {/* model selector */}
      <div className="mb-4">
        <label className="mb-1 block text-xs text-gray-400">生图模型</label>
        <div className="relative">
          <button
            onClick={() => setShowModels((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-panel-light px-3 py-2 text-sm text-gray-100 hover:border-accent"
          >
            <span className="truncate">
              {currentProvider?.name ?? '选择模型'}
              {currentModel && <span className="ml-1 text-gray-500">· {currentModel.label}</span>}
            </span>
            <ChevronDown size={15} />
          </button>
          {showModels && (
            <div className="absolute left-0 top-11 z-30 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-panel p-2 shadow-2xl">
              <ModelGroup title="🌍 国外模型" providers={globalProviders} onSelect={selectModel} />
              <ModelGroup title="🇨🇳 国内模型" providers={chinaProviders} onSelect={selectModel} />
            </div>
          )}
        </div>
      </div>

      {skill.sections && skill.sections.length > 0 && (
        <div className="mb-4 rounded-lg bg-panel-light p-3">
          <div className="mb-1.5 text-xs font-medium text-gray-300">
            将连贯生成 {skill.sections.length} 个分节：
          </div>
          <ol className="list-inside list-decimal space-y-0.5 text-xs text-gray-400">
            {skill.sections.map((s, i) => (
              <li key={i}>{s.title}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {model} · {skill.size} · {skill.sections?.length ? '分节长图' : `${skill.count} 张`}
        </span>
        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
        >
          <Play size={15} /> 开始生成
        </button>
      </div>
    </Modal>
  )
}

function ModelGroup({
  title,
  providers,
  onSelect,
}: {
  title: string
  providers: ProviderInfo[]
  onSelect: (providerId: string, modelId: string) => void
}) {
  if (providers.length === 0) return null
  return (
    <div className="mb-1">
      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      {providers.map((p) => (
        <div key={p.id}>
          {p.models.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(p.id, m.id)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-gray-200 hover:bg-panel-light"
            >
              <span>
                {p.name}
                <span className="ml-1 text-gray-500">· {m.label}</span>
              </span>
              {m.supportsImageToImage && (
                <span className="rounded bg-accent/20 px-1 text-[10px] text-accent">图生图</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

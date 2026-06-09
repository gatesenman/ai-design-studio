import { useState } from 'react'
import { Play } from 'lucide-react'
import type { Skill } from '@shared/types'
import { useChatStore } from '@/stores/chatStore'
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
  const runSkill = useChatStore((s) => s.runSkill)
  const busy = useChatStore((s) => s.busy)

  const run = () => {
    runSkill(skill, vars)
    onClose()
  }

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
          {skill.defaultModel} · {skill.size} · {skill.sections?.length ? '分节长图' : `${skill.count} 张`}
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

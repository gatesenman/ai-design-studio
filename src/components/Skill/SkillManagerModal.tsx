import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, Lock } from 'lucide-react'
import type { ProviderInfo, Skill } from '@shared/types'
import { useSkillStore } from '@/stores/skillStore'
import { api } from '@/services/api'
import Modal from '@/components/common/Modal'

export default function SkillManagerModal({ onClose }: { onClose: () => void }) {
  const skills = useSkillStore((s) => s.skills)
  const create = useSkillStore((s) => s.create)
  const upsert = useSkillStore((s) => s.upsert)
  const remove = useSkillStore((s) => s.remove)
  const [selected, setSelected] = useState<Skill | null>(skills[0] ?? null)
  const [providers, setProviders] = useState<ProviderInfo[]>([])

  useEffect(() => {
    api.getProviders().then(setProviders)
  }, [])

  const onCreate = async () => {
    const s = await create()
    setSelected(s)
  }

  return (
    <Modal title="Skill 管理" onClose={onClose} width="max-w-3xl">
      <div className="flex h-[60vh] gap-4">
        {/* list */}
        <div className="w-52 shrink-0 overflow-y-auto border-r border-border pr-3">
          <button
            onClick={onCreate}
            className="mb-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-sm text-gray-300 hover:border-accent hover:text-white"
          >
            <Plus size={15} /> 新建 Skill
          </button>
          {skills.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm ${
                selected?.id === s.id ? 'bg-accent text-white' : 'text-gray-300 hover:bg-panel-light'
              }`}
            >
              <span className="truncate">{s.name}</span>
              {s.builtin && <Lock size={12} className="shrink-0 opacity-60" />}
            </button>
          ))}
        </div>

        {/* editor */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <SkillEditor
              key={selected.id}
              skill={selected}
              providers={providers}
              onSave={(s) => {
                upsert(s)
                setSelected(s)
              }}
              onDelete={() => {
                remove(selected.id)
                setSelected(skills.find((s) => s.id !== selected.id) ?? null)
              }}
            />
          ) : (
            <p className="text-sm text-gray-500">请选择或新建一个 Skill</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

function SkillEditor({
  skill,
  providers,
  onSave,
  onDelete,
}: {
  skill: Skill
  providers: ProviderInfo[]
  onSave: (s: Skill) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<Skill>(skill)
  const readOnly = skill.builtin
  const provider = providers.find((p) => p.id === draft.defaultProviderId)

  const set = (patch: Partial<Skill>) => setDraft({ ...draft, ...patch })

  return (
    <div className="space-y-3 text-sm">
      {readOnly && (
        <div className="rounded-lg bg-panel-light px-3 py-2 text-xs text-gray-400">
          内置 Skill 为只读，可「另存为自定义」后修改。
        </div>
      )}
      <Field label="名称">
        <input
          value={draft.name}
          disabled={readOnly}
          onChange={(e) => set({ name: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="描述">
        <textarea
          value={draft.description}
          disabled={readOnly}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          className="input resize-none"
        />
      </Field>
      <Field label="Prompt 模板（用 {{变量}} 占位）">
        <textarea
          value={draft.promptTemplate}
          disabled={readOnly}
          onChange={(e) => set({ promptTemplate: e.target.value })}
          rows={3}
          className="input resize-none font-mono text-xs"
        />
      </Field>
      <Field label="变量（英文逗号分隔）">
        <input
          value={draft.variables.join(',')}
          disabled={readOnly}
          onChange={(e) => set({ variables: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
          className="input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="默认模型">
          <select
            value={`${draft.defaultProviderId}|${draft.defaultModel}`}
            disabled={readOnly}
            onChange={(e) => {
              const [pid, mid] = e.target.value.split('|')
              set({ defaultProviderId: pid as Skill['defaultProviderId'], defaultModel: mid })
            }}
            className="input"
          >
            {providers.map((p) =>
              p.models.map((m) => (
                <option key={`${p.id}|${m.id}`} value={`${p.id}|${m.id}`}>
                  {p.name} · {m.label}
                </option>
              )),
            )}
          </select>
        </Field>
        <Field label="输出尺寸">
          <select
            value={draft.size}
            disabled={readOnly}
            onChange={(e) => set({ size: e.target.value })}
            className="input"
          >
            {(provider?.models.find((m) => m.id === draft.defaultModel)?.sizes ?? [draft.size]).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </Field>
      </div>
      <Field label="批量数量">
        <input
          type="number"
          min={1}
          max={20}
          value={draft.count}
          disabled={readOnly}
          onChange={(e) => set({ count: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          className="input"
        />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        {!readOnly && (
          <button
            onClick={() => onSave(draft)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Save size={15} /> 保存
          </button>
        )}
        {readOnly ? (
          <button
            onClick={() =>
              onSave({ ...draft, id: Math.random().toString(36).slice(2, 10), name: `${draft.name} 副本`, builtin: false })
            }
            className="rounded-lg border border-border px-4 py-2 text-sm text-gray-200 hover:border-accent"
          >
            另存为自定义
          </button>
        ) : (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-red-400 hover:border-red-400"
          >
            <Trash2 size={15} /> 删除
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      {children}
    </div>
  )
}

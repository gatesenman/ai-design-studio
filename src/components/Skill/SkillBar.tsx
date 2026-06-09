import { useEffect, useState } from 'react'
import { Wand2, Settings2 } from 'lucide-react'
import type { Skill } from '@shared/types'
import { useSkillStore } from '@/stores/skillStore'
import SkillRunModal from './SkillRunModal'
import SkillManagerModal from './SkillManagerModal'

export default function SkillBar() {
  const skills = useSkillStore((s) => s.skills)
  const load = useSkillStore((s) => s.load)
  const [running, setRunning] = useState<Skill | null>(null)
  const [managing, setManaging] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="border-t border-border bg-panel px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
          <Wand2 size={13} /> Skill 工作流
        </span>
        <button
          onClick={() => setManaging(true)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent"
        >
          <Settings2 size={13} /> 管理
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <button
            key={s.id}
            onClick={() => setRunning(s)}
            title={s.description}
            className="rounded-full border border-border bg-panel-light px-3 py-1 text-xs text-gray-200 hover:border-accent hover:text-white"
          >
            {s.name}
            {s.sections?.length ? <span className="ml-1 text-accent">长图</span> : null}
          </button>
        ))}
      </div>

      {running && <SkillRunModal skill={running} onClose={() => setRunning(null)} />}
      {managing && <SkillManagerModal onClose={() => setManaging(false)} />}
    </div>
  )
}

import { Trash2 } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import MessageList from './MessageList'
import Composer from './Composer'
import SkillBar from '@/components/Skill/SkillBar'

export default function ChatPanel() {
  const clear = useChatStore((s) => s.clear)
  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-white">AI 设计助手</h1>
          <p className="text-xs text-gray-500">对话生成 · 批量 · 长图分节</p>
        </div>
        <button
          onClick={clear}
          title="清空对话"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-panel-light hover:text-white"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <MessageList />
      <SkillBar />
      <Composer />
    </div>
  )
}

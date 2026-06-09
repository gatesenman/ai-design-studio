import { useEffect, useRef } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useCanvasStore } from '@/stores/canvasStore'

export default function MessageList() {
  const messages = useChatStore((s) => s.messages)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((m) => (
        <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
          <div
            className={
              m.role === 'user'
                ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2.5 text-sm text-white'
                : 'max-w-[90%] rounded-2xl rounded-bl-sm bg-panel-light px-3.5 py-2.5 text-sm text-gray-100'
            }
          >
            {m.role === 'assistant' && (
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
                <Sparkles size={13} /> AI 设计助手
              </div>
            )}

            {m.steps && m.steps.length > 0 && (
              <div className="mb-2 space-y-1 rounded-lg bg-black/20 p-2">
                {m.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                    {m.pending && i === m.steps!.length - 1 ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <span className="text-accent">✓</span>
                    )}
                    {s}
                  </div>
                ))}
              </div>
            )}

            <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

            {m.images && m.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {m.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    onClick={() => useCanvasStore.getState().addImageFromUrl(src)}
                    title="点击再次放置到画布"
                    className="aspect-square w-full cursor-pointer rounded-md object-cover ring-1 ring-border hover:ring-accent"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Send, ImagePlus, X, ChevronDown } from 'lucide-react'
import type { ProviderInfo } from '@shared/types'
import { useChatStore } from '@/stores/chatStore'
import { api } from '@/services/api'

export default function Composer() {
  const [text, setText] = useState('')
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [showModels, setShowModels] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const params = useChatStore((s) => s.params)
  const setParams = useChatStore((s) => s.setParams)
  const send = useChatStore((s) => s.send)
  const busy = useChatStore((s) => s.busy)

  useEffect(() => {
    api.getProviders().then(setProviders)
  }, [])

  const currentProvider = providers.find((p) => p.id === params.providerId)
  const currentModel = currentProvider?.models.find((m) => m.id === params.model)
  const sizes = currentModel?.sizes ?? ['1024x1024']

  const onSelectModel = (providerId: string, modelId: string) => {
    const p = providers.find((x) => x.id === providerId)
    const m = p?.models.find((x) => x.id === modelId)
    setParams({
      providerId: providerId as ProviderInfo['id'],
      model: modelId,
      size: m?.sizes[0] ?? '1024x1024',
      mode: m?.supportsImageToImage ? params.mode : 'text-to-image',
    })
    setShowModels(false)
  }

  const onFile = (f: File | undefined) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setParams({ referenceImage: reader.result as string, mode: 'image-to-image' })
    }
    reader.readAsDataURL(f)
  }

  const submit = () => {
    if (!text.trim() || busy) return
    send(text)
    setText('')
  }

  const globalProviders = providers.filter((p) => p.region === 'global')
  const chinaProviders = providers.filter((p) => p.region === 'china')

  return (
    <div className="border-t border-border bg-panel px-3 py-3">
      {/* params row */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {/* model selector */}
        <div className="relative">
          <button
            onClick={() => setShowModels((v) => !v)}
            className="flex items-center gap-1 rounded-md border border-border bg-panel-light px-2.5 py-1.5 text-xs text-gray-200 hover:border-accent"
          >
            <span className="max-w-[150px] truncate">{currentProvider?.name ?? '选择模型'}</span>
            <ChevronDown size={13} />
          </button>
          {showModels && (
            <div className="absolute bottom-10 left-0 z-30 max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-panel p-2 shadow-2xl">
              <ModelGroup title="🌍 国外模型" providers={globalProviders} onSelect={onSelectModel} />
              <ModelGroup title="🇨🇳 国内模型" providers={chinaProviders} onSelect={onSelectModel} />
            </div>
          )}
        </div>

        {/* mode toggle */}
        <div className="flex overflow-hidden rounded-md border border-border text-xs">
          <button
            onClick={() => setParams({ mode: 'text-to-image' })}
            className={`px-2.5 py-1.5 ${params.mode === 'text-to-image' ? 'bg-accent text-white' : 'bg-panel-light text-gray-300'}`}
          >
            文生图
          </button>
          <button
            onClick={() => currentModel?.supportsImageToImage && setParams({ mode: 'image-to-image' })}
            disabled={!currentModel?.supportsImageToImage}
            title={currentModel?.supportsImageToImage ? '' : '该模型不支持图生图'}
            className={`px-2.5 py-1.5 ${params.mode === 'image-to-image' ? 'bg-accent text-white' : 'bg-panel-light text-gray-300'} disabled:opacity-40`}
          >
            图生图
          </button>
        </div>

        {/* size */}
        <select
          value={params.size}
          onChange={(e) => setParams({ size: e.target.value })}
          className="rounded-md border border-border bg-panel-light px-2 py-1.5 text-xs text-gray-200"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* count */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-panel-light px-2 py-1.5 text-xs text-gray-200">
          <span className="text-gray-400">数量</span>
          <input
            type="number"
            min={1}
            max={20}
            value={params.count}
            onChange={(e) => setParams({ count: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
            className="w-10 bg-transparent text-center outline-none"
          />
        </div>
      </div>

      {/* reference image preview */}
      {params.mode === 'image-to-image' && params.referenceImage && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative">
            <img src={params.referenceImage} className="h-12 w-12 rounded object-cover ring-1 ring-border" />
            <button
              onClick={() => setParams({ referenceImage: undefined })}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-panel p-0.5 text-gray-300 ring-1 ring-border hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
          <span className="text-xs text-gray-400">参考图（图生图）</span>
        </div>
      )}

      {/* input */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          title="上传参考图（图生图）"
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-gray-300 hover:border-accent hover:text-white"
        >
          <ImagePlus size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={2}
          placeholder="描述你想要的图片，Enter 发送 / Shift+Enter 换行"
          className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-panel-light px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-accent"
        />
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
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

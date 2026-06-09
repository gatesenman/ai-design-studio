import { useEffect, useState } from 'react'
import { Save, ExternalLink } from 'lucide-react'
import type { ProviderInfo } from '@shared/types'
import { useSettingsStore } from '@/stores/settingsStore'
import { api } from '@/services/api'
import Modal from '@/components/common/Modal'

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettingsStore((s) => s.settings)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const setBaseUrl = useSettingsStore((s) => s.setBaseUrl)
  const setBrandKit = useSettingsStore((s) => s.setBrandKit)
  const save = useSettingsStore((s) => s.save)
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [tab, setTab] = useState<'keys' | 'brand'>('keys')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getProviders().then(setProviders)
  }, [])

  // Unique api key fields (some providers share a key, e.g. OpenAI).
  const fields = Array.from(
    new Map(providers.map((p) => [p.apiKeyField, p])).values(),
  )

  const onSave = async () => {
    await save()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Modal title="设置" onClose={onClose} width="max-w-2xl">
      <div className="mb-4 flex gap-2">
        <Tab active={tab === 'keys'} onClick={() => setTab('keys')}>
          API Keys
        </Tab>
        <Tab active={tab === 'brand'} onClick={() => setTab('brand')}>
          品牌套件 (Brand Kit)
        </Tab>
      </div>

      {tab === 'keys' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            填写对应平台的 API Key 后即调用真实模型；未填写则使用内置 Demo 占位生成，方便先体验完整流程。
          </p>
          {fields.map((p) => (
            <div key={p.apiKeyField}>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm text-gray-200">
                  {p.name}
                  <span className="ml-1 text-xs text-gray-500">({p.apiKeyField})</span>
                </label>
                <a
                  href={p.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-0.5 text-xs text-accent hover:underline"
                >
                  获取 Key <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                value={settings.apiKeys[p.apiKeyField] || ''}
                onChange={(e) => setApiKey(p.apiKeyField, e.target.value)}
                placeholder={p.id === 'tencent-hunyuan' ? 'SecretId:SecretKey' : 'sk-...'}
                className="input"
              />
              {p.apiKeyField === 'openai' && (
                <input
                  value={settings.baseUrls[p.apiKeyField] || ''}
                  onChange={(e) => setBaseUrl(p.apiKeyField, e.target.value)}
                  placeholder="自定义 Base URL（可选，用于代理/中转）"
                  className="input mt-1.5 text-xs"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'brand' && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={settings.brandKit.enabled}
              onChange={(e) => setBrandKit({ enabled: e.target.checked })}
            />
            启用品牌套件（生成时自动约束色彩 / 字体 / 风格）
          </label>
          <div>
            <label className="mb-1 block text-xs text-gray-400">品牌名称</label>
            <input
              value={settings.brandKit.name}
              onChange={(e) => setBrandKit({ name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">品牌色（英文逗号分隔，如 #6d5efc,#000）</label>
            <input
              value={settings.brandKit.colors.join(',')}
              onChange={(e) =>
                setBrandKit({ colors: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) })
              }
              className="input"
            />
            <div className="mt-1.5 flex gap-1.5">
              {settings.brandKit.colors.map((c) => (
                <span key={c} className="h-5 w-5 rounded ring-1 ring-border" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">字体（英文逗号分隔）</label>
            <input
              value={settings.brandKit.fonts.join(',')}
              onChange={(e) =>
                setBrandKit({ fonts: e.target.value.split(',').map((f) => f.trim()).filter(Boolean) })
              }
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">风格说明</label>
            <textarea
              value={settings.brandKit.styleNotes}
              onChange={(e) => setBrandKit({ styleNotes: e.target.value })}
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Save size={15} /> {saved ? '已保存' : '保存设置'}
        </button>
      </div>
    </Modal>
  )
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm ${
        active ? 'bg-accent text-white' : 'bg-panel-light text-gray-300 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

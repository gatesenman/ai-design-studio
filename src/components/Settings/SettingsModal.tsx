import { useEffect, useState } from 'react'
import { Save, ExternalLink } from 'lucide-react'
import type { ProviderInfo, ProviderId } from '@shared/types'
import { DEFAULT_PREFERENCES } from '@shared/types'
import { useSettingsStore } from '@/stores/settingsStore'
import { api } from '@/services/api'
import Modal from '@/components/common/Modal'

type TabId = 'general' | 'canvas' | 'export' | 'keys' | 'brand' | 'shortcuts' | 'about'

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: 'Ctrl + Z', desc: '撤销' },
  { keys: 'Ctrl + Shift + Z / Ctrl + Y', desc: '重做' },
  { keys: 'Ctrl + C / V / X', desc: '复制 / 粘贴 / 剪切' },
  { keys: 'Ctrl + D', desc: '创建副本' },
  { keys: 'Ctrl + A', desc: '全选' },
  { keys: 'Delete / Backspace', desc: '删除选中' },
  { keys: '方向键', desc: '微移 1px（按住 Shift 为 10px）' },
  { keys: '[ / ]', desc: '下移 / 上移一层' },
  { keys: 'Ctrl + 0', desc: '重置缩放为 100%' },
  { keys: 'Ctrl + 1', desc: '适应内容' },
  { keys: 'Ctrl + = / Ctrl + -', desc: '放大 / 缩小' },
  { keys: 'F', desc: '缩放到选区' },
  { keys: '空格 + 拖拽', desc: '平移画布' },
  { keys: 'Esc', desc: '取消选择 / 关闭菜单' },
]

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettingsStore((s) => s.settings)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const setBaseUrl = useSettingsStore((s) => s.setBaseUrl)
  const setBrandKit = useSettingsStore((s) => s.setBrandKit)
  const setPreferences = useSettingsStore((s) => s.setPreferences)
  const save = useSettingsStore((s) => s.save)
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [tab, setTab] = useState<TabId>('general')
  const [saved, setSaved] = useState(false)

  const prefs = settings.preferences ?? DEFAULT_PREFERENCES

  useEffect(() => {
    api.getProviders().then(setProviders)
  }, [])

  const fields = Array.from(new Map(providers.map((p) => [p.apiKeyField, p])).values())

  const defaultProvider = providers.find((p) => p.id === prefs.defaultProviderId)
  const defaultModel = defaultProvider?.models.find((m) => m.id === prefs.defaultModel)
  const defaultSizes = defaultModel?.sizes ?? ['1024x1024']

  const onSave = async () => {
    await save()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Modal title="设置" onClose={onClose} width="max-w-2xl">
      <div className="mb-4 flex flex-wrap gap-2">
        <Tab active={tab === 'general'} onClick={() => setTab('general')}>通用</Tab>
        <Tab active={tab === 'canvas'} onClick={() => setTab('canvas')}>画布</Tab>
        <Tab active={tab === 'export'} onClick={() => setTab('export')}>导出</Tab>
        <Tab active={tab === 'keys'} onClick={() => setTab('keys')}>API Keys</Tab>
        <Tab active={tab === 'brand'} onClick={() => setTab('brand')}>品牌套件</Tab>
        <Tab active={tab === 'shortcuts'} onClick={() => setTab('shortcuts')}>快捷键</Tab>
        <Tab active={tab === 'about'} onClick={() => setTab('about')}>关于</Tab>
      </div>

      {tab === 'general' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">应用启动时的默认生成参数与界面主题。</p>
          <div>
            <label className="mb-1 block text-xs text-gray-400">默认模型</label>
            <select
              value={`${prefs.defaultProviderId}|${prefs.defaultModel}`}
              onChange={(e) => {
                const [pid, mid] = e.target.value.split('|')
                const p = providers.find((x) => x.id === pid)
                const m = p?.models.find((x) => x.id === mid)
                setPreferences({
                  defaultProviderId: pid as ProviderId,
                  defaultModel: mid,
                  defaultSize: m?.sizes[0] ?? prefs.defaultSize,
                })
              }}
              className="input"
            >
              {providers.map((p) => (
                <optgroup key={p.id} label={`${p.region === 'china' ? '🇨🇳' : '🌍'} ${p.name}`}>
                  {p.models.map((m) => (
                    <option key={m.id} value={`${p.id}|${m.id}`}>
                      {p.name} · {m.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-400">默认尺寸</label>
              <select
                value={prefs.defaultSize}
                onChange={(e) => setPreferences({ defaultSize: e.target.value })}
                className="input"
              >
                {defaultSizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs text-gray-400">默认数量</label>
              <input
                type="number"
                min={1}
                max={20}
                value={prefs.defaultCount}
                onChange={(e) =>
                  setPreferences({ defaultCount: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })
                }
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">主题</label>
            <div className="flex overflow-hidden rounded-md border border-border text-sm">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPreferences({ theme: t })}
                  className={`flex-1 px-3 py-1.5 ${prefs.theme === t ? 'bg-accent text-white' : 'bg-panel-light text-gray-300'}`}
                >
                  {t === 'dark' ? '深色' : '浅色'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'canvas' && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={prefs.showGrid}
              onChange={(e) => setPreferences({ showGrid: e.target.checked })}
            />
            显示网格背景
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={prefs.snapEnabled}
              onChange={(e) => setPreferences({ snapEnabled: e.target.checked })}
            />
            拖拽时自动吸附对齐（对象边缘 / 中心）
          </label>
          <div>
            <label className="mb-1 block text-xs text-gray-400">画布背景色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={prefs.canvasBg}
                onChange={(e) => setPreferences({ canvasBg: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent"
              />
              <input
                value={prefs.canvasBg}
                onChange={(e) => setPreferences({ canvasBg: e.target.value })}
                className="input flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">默认导出格式</label>
            <div className="flex overflow-hidden rounded-md border border-border text-sm">
              {(['png', 'jpeg'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPreferences({ exportFormat: f })}
                  className={`flex-1 px-3 py-1.5 uppercase ${prefs.exportFormat === f ? 'bg-accent text-white' : 'bg-panel-light text-gray-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {prefs.exportFormat === 'jpeg' && (
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                JPEG 质量：{Math.round(prefs.exportQuality * 100)}%
              </label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.01}
                value={prefs.exportQuality}
                onChange={(e) => setPreferences({ exportQuality: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-gray-400">导出分辨率倍数</label>
            <div className="flex overflow-hidden rounded-md border border-border text-sm">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setPreferences({ exportScale: s })}
                  className={`flex-1 px-3 py-1.5 ${prefs.exportScale === s ? 'bg-accent text-white' : 'bg-panel-light text-gray-300'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">
              长图拼接间距（px，0 = 无缝衔接）
            </label>
            <input
              type="number"
              min={0}
              max={200}
              value={prefs.longImageGap}
              onChange={(e) => setPreferences({ longImageGap: Math.max(0, Number(e.target.value) || 0) })}
              className="input"
            />
          </div>
        </div>
      )}

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

      {tab === 'shortcuts' && (
        <div className="space-y-1.5">
          <p className="mb-2 text-xs text-gray-500">画布支持以下键盘快捷键（编辑文字时自动禁用）。</p>
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between rounded-md bg-panel-light px-3 py-1.5 text-sm"
            >
              <span className="text-gray-300">{s.desc}</span>
              <kbd className="rounded border border-border bg-panel px-2 py-0.5 text-xs text-gray-200">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      )}

      {tab === 'about' && (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="text-lg font-semibold text-white">AI Design Studio</div>
          <p className="text-gray-400">版本 0.1.0 · 跨端 AI 驱动设计桌面程序</p>
          <p className="text-gray-400">
            类似 lovart.ai 的「左聊天 / 右自由画布」工作流：支持文生图 / 图生图、批量生成、长图分节连贯生成、Skill 工作流、品牌套件与多家国内外生图模型。
          </p>
          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">已接入模型</div>
            <p className="text-gray-400">
              OpenAI gpt-image-1 / DALL·E 3、Google Imagen、阿里通义万相、字节即梦 Seedream、百度文心一格、智谱 CogView、腾讯混元、MiniMax、硅基流动 SiliconFlow。
            </p>
          </div>
          <a
            href="https://github.com/gaosichun888/ai-design-studio"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            项目仓库 <ExternalLink size={12} />
          </a>
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

import { useEffect, useState } from 'react'
import { Settings, Palette } from 'lucide-react'
import ChatPanel from '@/components/Chat/ChatPanel'
import CanvasBoard from '@/components/Canvas/CanvasBoard'
import CanvasToolbar from '@/components/Canvas/CanvasToolbar'
import SettingsModal from '@/components/Settings/SettingsModal'
import { useSettingsStore } from '@/stores/settingsStore'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [chatWidth, setChatWidth] = useState(380)
  const loadSettings = useSettingsStore((s) => s.load)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Drag to resize the chat panel.
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = chatWidth
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(640, Math.max(300, startW + (ev.clientX - startX)))
      setChatWidth(next)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left: chat */}
      <div style={{ width: chatWidth }} className="h-full shrink-0">
        <ChatPanel />
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        className="h-full w-1 shrink-0 cursor-col-resize bg-border hover:bg-accent"
      />

      {/* Right: canvas */}
      <div className="relative h-full flex-1">
        {/* top bar */}
        <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-panel/95 px-3 py-2 text-sm text-gray-200 shadow-lg backdrop-blur hover:border-accent hover:text-white"
          >
            <Settings size={16} /> 设置
          </button>
        </div>
        <div className="absolute left-4 top-4 z-30 flex items-center gap-1.5 rounded-lg border border-border bg-panel/95 px-3 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur">
          <Palette size={16} className="text-accent" /> AI Design Studio
        </div>

        <CanvasToolbar />
        <CanvasBoard />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Type,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  LayoutGrid,
  Frame,
  Undo2,
  Redo2,
  ImagePlus,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useCanvasStore } from '@/stores/canvasStore'

const ARTBOARDS: { label: string; w: number; h: number }[] = [
  { label: '电商主图', w: 800, h: 800 },
  { label: '详情页', w: 750, h: 1000 },
  { label: '竖版海报', w: 1080, h: 1920 },
  { label: '横版 Banner', w: 1920, h: 1080 },
  { label: '方形', w: 1024, h: 1024 },
]

function TBtn({
  onClick,
  title,
  children,
  disabled,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-md text-gray-300 hover:bg-panel-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export default function CanvasToolbar() {
  const zoom = useCanvasStore((s) => s.zoom)
  const hasSelection = useCanvasStore((s) => s.hasSelection)
  const selectionCount = useCanvasStore((s) => s.selectionCount)
  const canUndo = useCanvasStore((s) => s.canUndo)
  const canRedo = useCanvasStore((s) => s.canRedo)
  const store = useCanvasStore()
  const [showArtboards, setShowArtboards] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const multi = selectionCount >= 2

  return (
    <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border bg-panel/95 px-2 py-1.5 shadow-2xl backdrop-blur">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) store.importImageFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="relative">
        <TBtn title="添加画板" onClick={() => setShowArtboards((v) => !v)}>
          <Frame size={18} />
        </TBtn>
        {showArtboards && (
          <div className="absolute left-0 top-11 w-40 rounded-lg border border-border bg-panel p-1 shadow-xl">
            {ARTBOARDS.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  store.addArtboard(a.w, a.h, a.label)
                  setShowArtboards(false)
                }}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-panel-light"
              >
                <span>{a.label}</span>
                <span className="text-xs text-gray-500">
                  {a.w}×{a.h}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <TBtn title="导入本地图片" onClick={() => fileRef.current?.click()}>
        <ImagePlus size={18} />
      </TBtn>
      <TBtn title="添加文字" onClick={() => store.addText('双击编辑文字')}>
        <Type size={18} />
      </TBtn>

      <div className="mx-1 h-6 w-px bg-border" />

      <TBtn title="撤销 (Ctrl+Z)" onClick={() => store.undo()} disabled={!canUndo}>
        <Undo2 size={18} />
      </TBtn>
      <TBtn title="重做 (Ctrl+Shift+Z)" onClick={() => store.redo()} disabled={!canRedo}>
        <Redo2 size={18} />
      </TBtn>

      <div className="mx-1 h-6 w-px bg-border" />

      <TBtn title="复制" onClick={() => store.duplicateSelected()} disabled={!hasSelection}>
        <Copy size={18} />
      </TBtn>
      <TBtn title="上移一层 (])" onClick={() => store.bringForward()} disabled={!hasSelection}>
        <ArrowUp size={18} />
      </TBtn>
      <TBtn title="下移一层 ([)" onClick={() => store.sendBackward()} disabled={!hasSelection}>
        <ArrowDown size={18} />
      </TBtn>
      <TBtn title="删除" onClick={() => store.deleteSelected()} disabled={!hasSelection}>
        <Trash2 size={18} />
      </TBtn>

      {multi && (
        <>
          <div className="mx-1 h-6 w-px bg-border" />
          <TBtn title="左对齐" onClick={() => store.alignSelected('left')}>
            <AlignHorizontalJustifyStart size={18} />
          </TBtn>
          <TBtn title="水平居中" onClick={() => store.alignSelected('hcenter')}>
            <AlignHorizontalJustifyCenter size={18} />
          </TBtn>
          <TBtn title="右对齐" onClick={() => store.alignSelected('right')}>
            <AlignHorizontalJustifyEnd size={18} />
          </TBtn>
          <TBtn title="顶对齐" onClick={() => store.alignSelected('top')}>
            <AlignVerticalJustifyStart size={18} />
          </TBtn>
          <TBtn title="垂直居中" onClick={() => store.alignSelected('vcenter')}>
            <AlignVerticalJustifyCenter size={18} />
          </TBtn>
          <TBtn title="底对齐" onClick={() => store.alignSelected('bottom')}>
            <AlignVerticalJustifyEnd size={18} />
          </TBtn>
          <TBtn title="水平均分" onClick={() => store.distributeSelected('h')} disabled={selectionCount < 3}>
            <AlignHorizontalSpaceAround size={18} />
          </TBtn>
          <TBtn title="垂直均分" onClick={() => store.distributeSelected('v')} disabled={selectionCount < 3}>
            <AlignVerticalSpaceAround size={18} />
          </TBtn>
        </>
      )}

      <div className="mx-1 h-6 w-px bg-border" />

      <TBtn title="缩小 (Ctrl+-)" onClick={() => store.zoomBy(0.9)}>
        <ZoomOut size={18} />
      </TBtn>
      <button
        onClick={() => store.resetView()}
        title="重置缩放 (Ctrl+0)"
        className="min-w-[52px] rounded-md px-2 py-1 text-center text-sm text-gray-300 hover:bg-panel-light"
      >
        {Math.round(zoom * 100)}%
      </button>
      <TBtn title="放大 (Ctrl+=)" onClick={() => store.zoomBy(1.1)}>
        <ZoomIn size={18} />
      </TBtn>
      <TBtn title="适应内容 (Ctrl+1)" onClick={() => store.fitToContent()}>
        <Maximize size={18} />
      </TBtn>

      <div className="mx-1 h-6 w-px bg-border" />

      <TBtn title="导出选中/全部" onClick={() => store.exportSelected()}>
        <Download size={18} />
      </TBtn>
      <TBtn title="拼接导出长图" onClick={() => store.exportLongFromSelection()}>
        <LayoutGrid size={18} />
      </TBtn>
    </div>
  )
}

import { useEffect } from 'react'
import {
  Copy,
  ClipboardPaste,
  Trash2,
  CopyPlus,
  Sparkles,
  ArrowUpToLine,
  ArrowDownToLine,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Download,
} from 'lucide-react'
import { useCanvasStore, type AlignType, type DistributeAxis } from '@/stores/canvasStore'

export interface MenuState {
  x: number
  y: number
  hasSelection: boolean
  multi: boolean
  singleImage: boolean
  canPaste: boolean
}

export default function ContextMenu({
  menu,
  onClose,
}: {
  menu: MenuState
  onClose: () => void
}) {
  const store = useCanvasStore()

  useEffect(() => {
    const close = () => onClose()
    window.addEventListener('click', close)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('resize', close)
    }
  }, [onClose])

  const run = (fn: () => void) => {
    fn()
    onClose()
  }

  const align = (t: AlignType) => run(() => store.alignSelected(t))
  const distribute = (a: DistributeAxis) => run(() => store.distributeSelected(a))

  return (
    <div
      className="absolute z-50 w-52 rounded-lg border border-border bg-panel/98 py-1 text-sm text-gray-200 shadow-2xl backdrop-blur"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.singleImage && (
        <>
          <Item icon={<Sparkles size={15} />} onClick={() => run(() => store.editSelectedWithAI())}>
            用 AI 改这张图
          </Item>
          <Divider />
        </>
      )}

      <Item
        icon={<Copy size={15} />}
        disabled={!menu.hasSelection}
        onClick={() => run(() => store.copySelected())}
      >
        复制 <Shortcut>Ctrl+C</Shortcut>
      </Item>
      <Item icon={<ClipboardPaste size={15} />} disabled={!menu.canPaste} onClick={() => run(() => store.paste())}>
        粘贴 <Shortcut>Ctrl+V</Shortcut>
      </Item>
      <Item
        icon={<CopyPlus size={15} />}
        disabled={!menu.hasSelection}
        onClick={() => run(() => store.duplicateSelected())}
      >
        创建副本 <Shortcut>Ctrl+D</Shortcut>
      </Item>
      <Item
        icon={<Trash2 size={15} />}
        disabled={!menu.hasSelection}
        onClick={() => run(() => store.deleteSelected())}
      >
        删除 <Shortcut>Del</Shortcut>
      </Item>

      <Divider />
      <Item
        icon={<ArrowUpToLine size={15} />}
        disabled={!menu.hasSelection}
        onClick={() => run(() => store.bringToFront())}
      >
        置于顶层
      </Item>
      <Item
        icon={<ArrowDownToLine size={15} />}
        disabled={!menu.hasSelection}
        onClick={() => run(() => store.sendToBack())}
      >
        置于底层
      </Item>

      {menu.multi && (
        <>
          <Divider />
          <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-500">对齐</div>
          <div className="flex flex-wrap gap-1 px-2 pb-1.5">
            <IconBtn title="左对齐" onClick={() => align('left')}>
              <AlignHorizontalJustifyStart size={15} />
            </IconBtn>
            <IconBtn title="水平居中" onClick={() => align('hcenter')}>
              <AlignHorizontalJustifyCenter size={15} />
            </IconBtn>
            <IconBtn title="右对齐" onClick={() => align('right')}>
              <AlignHorizontalJustifyEnd size={15} />
            </IconBtn>
            <IconBtn title="顶对齐" onClick={() => align('top')}>
              <AlignVerticalJustifyStart size={15} />
            </IconBtn>
            <IconBtn title="垂直居中" onClick={() => align('vcenter')}>
              <AlignVerticalJustifyCenter size={15} />
            </IconBtn>
            <IconBtn title="底对齐" onClick={() => align('bottom')}>
              <AlignVerticalJustifyEnd size={15} />
            </IconBtn>
            <IconBtn title="水平均分" onClick={() => distribute('h')}>
              <AlignHorizontalSpaceAround size={15} />
            </IconBtn>
            <IconBtn title="垂直均分" onClick={() => distribute('v')}>
              <AlignVerticalSpaceAround size={15} />
            </IconBtn>
          </div>
        </>
      )}

      <Divider />
      <Item icon={<Download size={15} />} onClick={() => run(() => store.exportSelected())}>
        导出选中/全部
      </Item>
    </div>
  )
}

function Item({
  icon,
  children,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-panel-light disabled:cursor-not-allowed disabled:opacity-30"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="flex flex-1 items-center justify-between">{children}</span>
    </button>
  )
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return <span className="ml-3 text-[11px] text-gray-500">{children}</span>
}

function Divider() {
  return <div className="my-1 h-px bg-border" />
}

function IconBtn({
  title,
  children,
  onClick,
}: {
  title: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-gray-300 hover:bg-accent hover:text-white"
    >
      {children}
    </button>
  )
}

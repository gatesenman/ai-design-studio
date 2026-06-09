import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/stores/canvasStore'
import ContextMenu, { type MenuState } from './ContextMenu'

type Guide = { o: 'v' | 'h'; pos: number }

export default function CanvasBoard() {
  const elRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const guidesRef = useRef<Guide[]>([])
  const setCanvas = useCanvasStore((s) => s.setCanvas)
  const refreshSelection = useCanvasStore((s) => s.refreshSelection)
  const showGrid = useCanvasStore((s) => s.showGrid)
  const canvasBg = useCanvasStore((s) => s.canvasBg)
  const [menu, setMenu] = useState<MenuState | null>(null)

  useEffect(() => {
    if (!elRef.current || !wrapRef.current) return
    const wrap = wrapRef.current
    const canvas = new fabric.Canvas(elRef.current, {
      width: wrap.clientWidth,
      height: wrap.clientHeight,
      backgroundColor: useCanvasStore.getState().canvasBg,
      preserveObjectStacking: true,
      selection: true,
    })

    let isPanning = false
    let lastPos = { x: 0, y: 0 }
    let spaceDown = false

    const store = () => useCanvasStore.getState()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown = true
      if (isTyping(canvas)) return
      const mod = e.ctrlKey || e.metaKey

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        store().deleteSelected()
        return
      }
      if (e.key === 'Escape') {
        store().deselect()
        return
      }
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) store().redo()
        else store().undo()
        return
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        store().redo()
        return
      }
      if (mod && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        store().copySelected()
        return
      }
      if (mod && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault()
        store().paste()
        return
      }
      if (mod && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault()
        store().copySelected().then(() => store().deleteSelected())
        return
      }
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        store().duplicateSelected()
        return
      }
      if (mod && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        store().selectAll()
        return
      }
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        store().zoomBy(1.1)
        return
      }
      if (mod && e.key === '-') {
        e.preventDefault()
        store().zoomBy(0.9)
        return
      }
      if (mod && e.key === '0') {
        e.preventDefault()
        store().resetView()
        return
      }
      if (mod && e.key === '1') {
        e.preventDefault()
        store().fitToContent()
        return
      }
      if (!mod && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        store().zoomToSelection()
        return
      }
      if (!mod && e.key === '[') {
        store().sendBackward()
        return
      }
      if (!mod && e.key === ']') {
        store().bringForward()
        return
      }
      if (e.key.startsWith('Arrow')) {
        const step = e.shiftKey ? 10 : 1
        e.preventDefault()
        if (e.key === 'ArrowLeft') store().nudge(-step, 0)
        else if (e.key === 'ArrowRight') store().nudge(step, 0)
        else if (e.key === 'ArrowUp') store().nudge(0, -step)
        else if (e.key === 'ArrowDown') store().nudge(0, step)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent
      if (spaceDown || evt.button === 1) {
        isPanning = true
        canvas.selection = false
        lastPos = { x: evt.clientX, y: evt.clientY }
        canvas.setCursor('grabbing')
      }
    })
    canvas.on('mouse:move', (opt) => {
      if (!isPanning) return
      const evt = opt.e as MouseEvent
      const vpt = canvas.viewportTransform!
      vpt[4] += evt.clientX - lastPos.x
      vpt[5] += evt.clientY - lastPos.y
      canvas.requestRenderAll()
      lastPos = { x: evt.clientX, y: evt.clientY }
    })
    canvas.on('mouse:up', () => {
      isPanning = false
      canvas.selection = true
      if (guidesRef.current.length) {
        guidesRef.current = []
        canvas.requestRenderAll()
      }
    })

    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent
      e.preventDefault()
      e.stopPropagation()
      let zoom = canvas.getZoom()
      zoom *= 0.999 ** e.deltaY
      zoom = Math.min(5, Math.max(0.1, zoom))
      canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom)
      useCanvasStore.setState({ zoom })
    })

    // ---- snapping to other objects' edges/centers ----
    canvas.on('object:moving', (e) => {
      if (!store().snapEnabled) {
        guidesRef.current = []
        return
      }
      const obj = e.target
      if (!obj) return
      const z = canvas.getZoom()
      const thr = 6 / z
      const r = obj.getBoundingRect()
      const xs = [r.left, r.left + r.width / 2, r.left + r.width]
      const ys = [r.top, r.top + r.height / 2, r.top + r.height]
      let snapXDelta = Infinity
      let snapXLine = 0
      let snapYDelta = Infinity
      let snapYLine = 0
      canvas.getObjects().forEach((other) => {
        if (other === obj) return
        const o = other.getBoundingRect()
        const ox = [o.left, o.left + o.width / 2, o.left + o.width]
        const oy = [o.top, o.top + o.height / 2, o.top + o.height]
        xs.forEach((ex) =>
          ox.forEach((t) => {
            const d = t - ex
            if (Math.abs(d) < thr && Math.abs(d) < Math.abs(snapXDelta)) {
              snapXDelta = d
              snapXLine = t
            }
          }),
        )
        ys.forEach((ey) =>
          oy.forEach((t) => {
            const d = t - ey
            if (Math.abs(d) < thr && Math.abs(d) < Math.abs(snapYDelta)) {
              snapYDelta = d
              snapYLine = t
            }
          }),
        )
      })
      const guides: Guide[] = []
      if (Number.isFinite(snapXDelta)) {
        obj.set({ left: (obj.left || 0) + snapXDelta })
        guides.push({ o: 'v', pos: snapXLine })
      }
      if (Number.isFinite(snapYDelta)) {
        obj.set({ top: (obj.top || 0) + snapYDelta })
        guides.push({ o: 'h', pos: snapYLine })
      }
      obj.setCoords()
      guidesRef.current = guides
    })

    canvas.on('after:render', () => {
      const guides = guidesRef.current
      if (!guides.length) return
      const ctx = canvas.getContext()
      const vpt = canvas.viewportTransform!
      const z = canvas.getZoom()
      ctx.save()
      ctx.strokeStyle = '#6d5efc'
      ctx.lineWidth = 1
      guides.forEach((g) => {
        ctx.beginPath()
        if (g.o === 'v') {
          const x = g.pos * z + vpt[4]
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvas.getHeight())
        } else {
          const y = g.pos * z + vpt[5]
          ctx.moveTo(0, y)
          ctx.lineTo(canvas.getWidth(), y)
        }
        ctx.stroke()
      })
      ctx.restore()
    })

    // ---- history ----
    const onChange = () => store().pushHistory()
    canvas.on('object:added', onChange)
    canvas.on('object:modified', () => {
      guidesRef.current = []
      onChange()
    })
    canvas.on('object:removed', onChange)

    canvas.on('selection:created', refreshSelection)
    canvas.on('selection:updated', refreshSelection)
    canvas.on('selection:cleared', refreshSelection)

    setCanvas(canvas)
    store().pushHistory() // baseline snapshot

    const onResize = () => {
      canvas.setDimensions({ width: wrap.clientWidth, height: wrap.clientHeight })
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(wrap)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      ro.disconnect()
      canvas.dispose()
      setCanvas(null)
    }
  }, [setCanvas, refreshSelection])

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const canvas = useCanvasStore.getState().canvas
    const active = canvas?.getActiveObject()
    const count = canvas?.getActiveObjects().length ?? 0
    const rect = wrapRef.current?.getBoundingClientRect()
    setMenu({
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
      hasSelection: count > 0,
      multi: count >= 2,
      singleImage: count === 1 && active?.type === 'image',
      canPaste: !!useCanvasStore.getState()._clipboard?.length,
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) {
      useCanvasStore.getState().importImageFiles(e.dataTransfer.files)
    }
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden bg-canvas"
      onContextMenu={onContextMenu}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {showGrid && <DotGrid bg={canvasBg} />}
      <canvas ref={elRef} className="relative z-10" />
      {menu && <ContextMenu menu={menu} onClose={() => setMenu(null)} />}
    </div>
  )
}

function isTyping(canvas: fabric.Canvas): boolean {
  const el = document.activeElement
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return true
  const a = canvas.getActiveObject()
  return !!a && a.type === 'i-text' && (a as fabric.IText).isEditing
}

function DotGrid({ bg }: { bg: string }) {
  // pick dot color that contrasts with the background
  const dot = isLight(bg) ? '#c9c9d2' : '#3a3a42'
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-40"
      style={{
        backgroundImage: `radial-gradient(${dot} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    />
  )
}

function isLight(hex: string): boolean {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return false
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

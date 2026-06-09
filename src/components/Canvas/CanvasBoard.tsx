import { useEffect, useRef } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/stores/canvasStore'

export default function CanvasBoard() {
  const elRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const setCanvas = useCanvasStore((s) => s.setCanvas)
  const refreshSelection = useCanvasStore((s) => s.refreshSelection)

  useEffect(() => {
    if (!elRef.current || !wrapRef.current) return
    const wrap = wrapRef.current
    const canvas = new fabric.Canvas(elRef.current, {
      width: wrap.clientWidth,
      height: wrap.clientHeight,
      backgroundColor: '#1a1a1e',
      preserveObjectStacking: true,
      selection: true,
    })

    // Pan with space-drag or middle mouse; zoom with wheel.
    let isPanning = false
    let lastPos = { x: 0, y: 0 }
    let spaceDown = false

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown = true
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText(canvas)) {
        useCanvasStore.getState().deleteSelected()
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

    canvas.on('selection:created', refreshSelection)
    canvas.on('selection:updated', refreshSelection)
    canvas.on('selection:cleared', refreshSelection)

    setCanvas(canvas)

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

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-canvas">
      <DotGrid />
      <canvas ref={elRef} className="relative z-10" />
    </div>
  )
}

function isEditingText(canvas: fabric.Canvas): boolean {
  const a = canvas.getActiveObject()
  return !!a && a.type === 'i-text' && (a as fabric.IText).isEditing
}

function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-40"
      style={{
        backgroundImage: 'radial-gradient(#3a3a42 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  )
}

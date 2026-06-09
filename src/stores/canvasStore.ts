import { create } from 'zustand'
import * as fabric from 'fabric'
import { api } from '@/services/api'

interface PlaceOptions {
  left?: number
  top?: number
  label?: string
}

export type AlignType = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'
export type DistributeAxis = 'h' | 'v'

interface ExportPrefs {
  showGrid: boolean
  snapEnabled: boolean
  canvasBg: string
  exportFormat: 'png' | 'jpeg'
  exportQuality: number
  exportScale: number
  longImageGap: number
}

interface CanvasState {
  canvas: fabric.Canvas | null
  zoom: number
  hasSelection: boolean
  selectionCount: number
  cursor: { x: number; y: number }
  // live preferences (mirrored from settings)
  showGrid: boolean
  snapEnabled: boolean
  canvasBg: string
  exportFormat: 'png' | 'jpeg'
  exportQuality: number
  exportScale: number
  longImageGap: number
  // history
  canUndo: boolean
  canRedo: boolean
  _undo: string[]
  _redo: string[]
  _histLock: boolean
  _clipboard: fabric.FabricObject[] | null
  setCanvas: (c: fabric.Canvas | null) => void
  refreshSelection: () => void
  applyPreferences: (p: Partial<ExportPrefs>) => void
  setShowGrid: (v: boolean) => void
  setSnapEnabled: (v: boolean) => void
  setCanvasBg: (c: string) => void
  addImageFromUrl: (url: string, opts?: PlaceOptions) => Promise<fabric.FabricImage | null>
  addImagesGrid: (urls: string[], cols?: number) => Promise<void>
  addLongImageColumn: (urls: string[], titles?: string[]) => Promise<void>
  addImageFromFile: (file: File) => Promise<void>
  importImageFiles: (files: FileList | File[]) => Promise<void>
  addArtboard: (w: number, h: number, label: string) => void
  addText: (text: string) => void
  deleteSelected: () => void
  duplicateSelected: () => Promise<void>
  copySelected: () => Promise<void>
  paste: () => Promise<void>
  nudge: (dx: number, dy: number) => void
  selectAll: () => void
  deselect: () => void
  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void
  alignSelected: (type: AlignType) => void
  distributeSelected: (axis: DistributeAxis) => void
  editSelectedWithAI: () => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  zoomBy: (factor: number) => void
  setZoom: (z: number) => void
  resetView: () => void
  fitToContent: () => void
  zoomToSelection: () => void
  exportSelected: () => Promise<void>
  exportLongFromSelection: () => Promise<void>
}

const GRID_GAP = 24

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvas: null,
  zoom: 1,
  hasSelection: false,
  selectionCount: 0,
  cursor: { x: 80, y: 80 },
  showGrid: true,
  snapEnabled: true,
  canvasBg: '#1a1a1e',
  exportFormat: 'png',
  exportQuality: 0.92,
  exportScale: 2,
  longImageGap: 0,
  canUndo: false,
  canRedo: false,
  _undo: [],
  _redo: [],
  _histLock: false,
  _clipboard: null,

  setCanvas(c) {
    set({ canvas: c, _undo: [], _redo: [], canUndo: false, canRedo: false })
    if (c) {
      c.backgroundColor = get().canvasBg
      c.requestRenderAll()
    }
  },

  refreshSelection() {
    const c = get().canvas
    const count = c ? c.getActiveObjects().length : 0
    set({ hasSelection: count > 0, selectionCount: count })
  },

  applyPreferences(p) {
    const patch: Partial<ExportPrefs> = {}
    if (p.showGrid !== undefined) patch.showGrid = p.showGrid
    if (p.snapEnabled !== undefined) patch.snapEnabled = p.snapEnabled
    if (p.canvasBg !== undefined) patch.canvasBg = p.canvasBg
    if (p.exportFormat !== undefined) patch.exportFormat = p.exportFormat
    if (p.exportQuality !== undefined) patch.exportQuality = p.exportQuality
    if (p.exportScale !== undefined) patch.exportScale = p.exportScale
    if (p.longImageGap !== undefined) patch.longImageGap = p.longImageGap
    set(patch)
    const c = get().canvas
    if (c && patch.canvasBg) {
      c.backgroundColor = patch.canvasBg
      c.requestRenderAll()
    }
  },

  setShowGrid(v) {
    set({ showGrid: v })
  },

  setSnapEnabled(v) {
    set({ snapEnabled: v })
  },

  setCanvasBg(color) {
    set({ canvasBg: color })
    const c = get().canvas
    if (c) {
      c.backgroundColor = color
      c.requestRenderAll()
    }
  },

  async addImageFromUrl(url, opts) {
    const c = get().canvas
    if (!c) return null
    const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
    const maxDim = 360
    const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim))
    img.scale(scale)
    const { x, y } = opts?.left != null && opts?.top != null
      ? { x: opts.left, y: opts.top }
      : get().cursor
    img.set({ left: x, top: y })
    ;(img as any).adsLabel = opts?.label
    c.add(img)
    c.setActiveObject(img)
    c.requestRenderAll()
    // advance cursor
    set({ cursor: { x: x + (img.getScaledWidth() + GRID_GAP), y } })
    return img
  },

  async addImagesGrid(urls, cols = 2) {
    const c = get().canvas
    if (!c || urls.length === 0) return
    const start = { ...get().cursor }
    let col = 0
    let row = 0
    let rowHeight = 0
    let colX = start.x
    for (const url of urls) {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
      const maxDim = 320
      const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim))
      img.scale(scale)
      img.set({ left: colX, top: start.y + row * (rowHeight + GRID_GAP) })
      c.add(img)
      rowHeight = Math.max(rowHeight, img.getScaledHeight())
      colX += img.getScaledWidth() + GRID_GAP
      col++
      if (col >= cols) {
        col = 0
        row++
        colX = start.x
      }
    }
    c.requestRenderAll()
    set({ cursor: { x: start.x, y: start.y + (row + 1) * (rowHeight + GRID_GAP) } })
  },

  async addLongImageColumn(urls, titles) {
    const c = get().canvas
    if (!c || urls.length === 0) return
    const start = { ...get().cursor }
    const targetWidth = 300
    let y = start.y
    const group: fabric.FabricObject[] = []
    for (let i = 0; i < urls.length; i++) {
      const img = await fabric.FabricImage.fromURL(urls[i], { crossOrigin: 'anonymous' })
      const scale = targetWidth / (img.width || targetWidth)
      img.scale(scale)
      img.set({ left: start.x, top: y })
      c.add(img)
      group.push(img)
      if (titles?.[i]) {
        const label = new fabric.FabricText(`${i + 1}. ${titles[i]}`, {
          left: start.x + targetWidth + 12,
          top: y,
          fontSize: 14,
          fill: '#9a9aa5',
          fontFamily: 'sans-serif',
        })
        c.add(label)
      }
      // sections touch edge-to-edge for a seamless long image (gap configurable)
      y += img.getScaledHeight() + get().longImageGap
    }
    c.requestRenderAll()
    set({ cursor: { x: start.x + targetWidth + 220, y: start.y } })
  },

  async addImageFromFile(file) {
    if (!file.type.startsWith('image/')) return
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    await get().addImageFromUrl(dataUrl, { label: file.name })
  },

  async importImageFiles(files) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    for (const f of list) {
      await get().addImageFromFile(f)
    }
  },

  addArtboard(w, h, label) {
    const c = get().canvas
    if (!c) return
    const { x, y } = get().cursor
    const maxDim = 360
    const scale = Math.min(1, maxDim / Math.max(w, h))
    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: w * scale,
      height: h * scale,
      fill: '#ffffff',
      stroke: '#6d5efc',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
    })
    const text = new fabric.FabricText(`${label}  ${w}×${h}`, {
      left: x,
      top: y - 22,
      fontSize: 13,
      fill: '#9a9aa5',
      fontFamily: 'sans-serif',
    })
    c.add(rect)
    c.add(text)
    c.requestRenderAll()
    set({ cursor: { x: x + w * scale + GRID_GAP, y } })
  },

  addText(text) {
    const c = get().canvas
    if (!c) return
    const { x, y } = get().cursor
    const t = new fabric.IText(text || '双击编辑文字', {
      left: x,
      top: y,
      fontSize: 28,
      fill: '#1a1a1e',
      fontFamily: 'sans-serif',
      backgroundColor: '#ffffff',
    })
    c.add(t)
    c.setActiveObject(t)
    c.requestRenderAll()
  },

  deleteSelected() {
    const c = get().canvas
    if (!c) return
    c.getActiveObjects().forEach((o) => c.remove(o))
    c.discardActiveObject()
    c.requestRenderAll()
    get().refreshSelection()
  },

  async duplicateSelected() {
    const c = get().canvas
    if (!c) return
    const objs = c.getActiveObjects()
    if (!objs.length) return
    const clones = await Promise.all(objs.map((o) => o.clone()))
    c.discardActiveObject()
    clones.forEach((o) => {
      o.set({ left: (o.left || 0) + 24, top: (o.top || 0) + 24 })
      c.add(o)
    })
    if (clones.length === 1) c.setActiveObject(clones[0])
    else c.setActiveObject(new fabric.ActiveSelection(clones, { canvas: c }))
    c.requestRenderAll()
    get().refreshSelection()
  },

  async copySelected() {
    const c = get().canvas
    if (!c) return
    const objs = c.getActiveObjects()
    if (!objs.length) return
    const clones = await Promise.all(objs.map((o) => o.clone()))
    set({ _clipboard: clones })
  },

  async paste() {
    const c = get().canvas
    const clip = get()._clipboard
    if (!c || !clip || !clip.length) return
    const clones = await Promise.all(clip.map((o) => o.clone()))
    c.discardActiveObject()
    clones.forEach((o) => {
      o.set({ left: (o.left || 0) + 24, top: (o.top || 0) + 24 })
      c.add(o)
    })
    if (clones.length === 1) c.setActiveObject(clones[0])
    else c.setActiveObject(new fabric.ActiveSelection(clones, { canvas: c }))
    c.requestRenderAll()
    get().refreshSelection()
  },

  nudge(dx, dy) {
    const c = get().canvas
    if (!c) return
    const objs = c.getActiveObjects()
    if (!objs.length) return
    const active = c.getActiveObject()
    if (active) {
      active.set({ left: (active.left || 0) + dx, top: (active.top || 0) + dy })
      active.setCoords()
    }
    c.requestRenderAll()
    get().pushHistory()
  },

  selectAll() {
    const c = get().canvas
    if (!c) return
    c.discardActiveObject()
    const objs = c.getObjects()
    if (!objs.length) return
    if (objs.length === 1) c.setActiveObject(objs[0])
    else c.setActiveObject(new fabric.ActiveSelection(objs, { canvas: c }))
    c.requestRenderAll()
    get().refreshSelection()
  },

  deselect() {
    const c = get().canvas
    if (!c) return
    c.discardActiveObject()
    c.requestRenderAll()
    get().refreshSelection()
  },

  bringForward() {
    const c = get().canvas
    if (!c) return
    c.getActiveObjects().forEach((o) => c.bringObjectForward(o))
    c.requestRenderAll()
    get().pushHistory()
  },

  sendBackward() {
    const c = get().canvas
    if (!c) return
    c.getActiveObjects().forEach((o) => c.sendObjectBackwards(o))
    c.requestRenderAll()
    get().pushHistory()
  },

  bringToFront() {
    const c = get().canvas
    if (!c) return
    c.getActiveObjects().forEach((o) => c.bringObjectToFront(o))
    c.requestRenderAll()
    get().pushHistory()
  },

  sendToBack() {
    const c = get().canvas
    if (!c) return
    c.getActiveObjects().forEach((o) => c.sendObjectToBack(o))
    c.requestRenderAll()
    get().pushHistory()
  },

  alignSelected(type) {
    const c = get().canvas
    if (!c) return
    const objs = [...c.getActiveObjects()]
    if (objs.length < 2) return
    c.discardActiveObject()
    const rects = objs.map((o) => ({ o, r: o.getBoundingRect() }))
    const minLeft = Math.min(...rects.map((x) => x.r.left))
    const maxRight = Math.max(...rects.map((x) => x.r.left + x.r.width))
    const minTop = Math.min(...rects.map((x) => x.r.top))
    const maxBottom = Math.max(...rects.map((x) => x.r.top + x.r.height))
    const cx = (minLeft + maxRight) / 2
    const cy = (minTop + maxBottom) / 2
    rects.forEach(({ o, r }) => {
      let dx = 0
      let dy = 0
      if (type === 'left') dx = minLeft - r.left
      else if (type === 'hcenter') dx = cx - (r.left + r.width / 2)
      else if (type === 'right') dx = maxRight - (r.left + r.width)
      else if (type === 'top') dy = minTop - r.top
      else if (type === 'vcenter') dy = cy - (r.top + r.height / 2)
      else if (type === 'bottom') dy = maxBottom - (r.top + r.height)
      o.set({ left: (o.left || 0) + dx, top: (o.top || 0) + dy })
      o.setCoords()
    })
    c.setActiveObject(new fabric.ActiveSelection(objs, { canvas: c }))
    c.requestRenderAll()
    get().pushHistory()
  },

  distributeSelected(axis) {
    const c = get().canvas
    if (!c) return
    const objs = [...c.getActiveObjects()]
    if (objs.length < 3) return
    c.discardActiveObject()
    const items = objs.map((o) => ({ o, r: o.getBoundingRect() }))
    if (axis === 'h') {
      items.sort((a, b) => a.r.left + a.r.width / 2 - (b.r.left + b.r.width / 2))
      const first = items[0].r.left + items[0].r.width / 2
      const last = items[items.length - 1].r.left + items[items.length - 1].r.width / 2
      const step = (last - first) / (items.length - 1)
      items.forEach((it, i) => {
        const target = first + step * i
        const cur = it.r.left + it.r.width / 2
        it.o.set({ left: (it.o.left || 0) + (target - cur) })
        it.o.setCoords()
      })
    } else {
      items.sort((a, b) => a.r.top + a.r.height / 2 - (b.r.top + b.r.height / 2))
      const first = items[0].r.top + items[0].r.height / 2
      const last = items[items.length - 1].r.top + items[items.length - 1].r.height / 2
      const step = (last - first) / (items.length - 1)
      items.forEach((it, i) => {
        const target = first + step * i
        const cur = it.r.top + it.r.height / 2
        it.o.set({ top: (it.o.top || 0) + (target - cur) })
        it.o.setCoords()
      })
    }
    c.setActiveObject(new fabric.ActiveSelection(objs, { canvas: c }))
    c.requestRenderAll()
    get().pushHistory()
  },

  editSelectedWithAI() {
    const c = get().canvas
    if (!c) return
    const active = c.getActiveObject()
    if (!active || active.type !== 'image') return
    const dataUrl = (active as fabric.FabricImage).toDataURL({ format: 'png', multiplier: 1 })
    window.dispatchEvent(new CustomEvent('ads:edit-with-ai', { detail: { dataUrl } }))
  },

  pushHistory() {
    const c = get().canvas
    if (!c || get()._histLock) return
    const json = JSON.stringify(c.toJSON())
    const undo = get()._undo
    if (undo[undo.length - 1] === json) return
    const next = [...undo, json].slice(-50)
    set({ _undo: next, _redo: [], canUndo: next.length > 1, canRedo: false })
  },

  undo() {
    const c = get().canvas
    if (!c) return
    const undo = [...get()._undo]
    if (undo.length < 2) return
    const current = undo.pop()!
    const prev = undo[undo.length - 1]
    const redo = [...get()._redo, current]
    set({ _histLock: true, _undo: undo, _redo: redo, canUndo: undo.length > 1, canRedo: true })
    c.loadFromJSON(JSON.parse(prev)).then(() => {
      c.requestRenderAll()
      set({ _histLock: false })
      get().refreshSelection()
    })
  },

  redo() {
    const c = get().canvas
    if (!c) return
    const redo = [...get()._redo]
    const next = redo.pop()
    if (!next) return
    const undo = [...get()._undo, next]
    set({ _histLock: true, _undo: undo, _redo: redo, canUndo: undo.length > 1, canRedo: redo.length > 0 })
    c.loadFromJSON(JSON.parse(next)).then(() => {
      c.requestRenderAll()
      set({ _histLock: false })
      get().refreshSelection()
    })
  },

  zoomBy(factor) {
    const c = get().canvas
    if (!c) return
    let zoom = c.getZoom() * factor
    zoom = Math.min(5, Math.max(0.1, zoom))
    const center = c.getCenterPoint()
    c.zoomToPoint(center, zoom)
    set({ zoom })
  },

  setZoom(z) {
    const c = get().canvas
    if (!c) return
    const center = c.getCenterPoint()
    c.zoomToPoint(center, z)
    set({ zoom: z })
  },

  resetView() {
    const c = get().canvas
    if (!c) return
    c.setViewportTransform([1, 0, 0, 1, 0, 0])
    set({ zoom: 1 })
  },

  fitToContent() {
    const c = get().canvas
    if (!c) return
    const objects = c.getObjects()
    if (objects.length === 0) {
      get().resetView()
      return
    }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    objects.forEach((o) => {
      const r = o.getBoundingRect()
      minX = Math.min(minX, r.left)
      minY = Math.min(minY, r.top)
      maxX = Math.max(maxX, r.left + r.width)
      maxY = Math.max(maxY, r.top + r.height)
    })
    const pad = 60
    const cw = c.getWidth()
    const ch = c.getHeight()
    const contentW = maxX - minX + pad * 2
    const contentH = maxY - minY + pad * 2
    const zoom = Math.min(cw / contentW, ch / contentH, 2)
    c.setViewportTransform([
      zoom,
      0,
      0,
      zoom,
      -minX * zoom + pad * zoom,
      -minY * zoom + pad * zoom,
    ])
    set({ zoom })
  },

  zoomToSelection() {
    const c = get().canvas
    if (!c) return
    const objs = c.getActiveObjects()
    if (!objs.length) {
      get().fitToContent()
      return
    }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    objs.forEach((o) => {
      const r = o.getBoundingRect()
      minX = Math.min(minX, r.left)
      minY = Math.min(minY, r.top)
      maxX = Math.max(maxX, r.left + r.width)
      maxY = Math.max(maxY, r.top + r.height)
    })
    const pad = 80
    const cw = c.getWidth()
    const ch = c.getHeight()
    const zoom = Math.min(cw / (maxX - minX + pad * 2), ch / (maxY - minY + pad * 2), 3)
    c.setViewportTransform([zoom, 0, 0, zoom, -minX * zoom + pad * zoom, -minY * zoom + pad * zoom])
    set({ zoom })
  },

  async exportSelected() {
    const c = get().canvas
    if (!c) return
    const { exportFormat, exportQuality, exportScale } = get()
    const active = c.getActiveObject()
    const fmt: 'png' | 'jpeg' = exportFormat === 'jpeg' ? 'jpeg' : 'png'
    const opts = { format: fmt, multiplier: exportScale, quality: exportQuality }
    const dataUrl = active ? active.toDataURL(opts) : c.toDataURL(opts)
    await api.exportImage(dataUrl, `设计图_${Date.now()}.${fmt === 'jpeg' ? 'jpg' : 'png'}`)
  },

  async exportLongFromSelection() {
    const c = get().canvas
    if (!c) return
    const { exportFormat, exportQuality, exportScale, longImageGap } = get()
    const objects = c.getActiveObjects().length ? c.getActiveObjects() : c.getObjects()
    const images = objects.filter((o) => o.type === 'image')
    if (images.length === 0) return
    // Stitch selected images vertically into a single long image (configurable gap + scale).
    images.sort((a, b) => (a.top || 0) - (b.top || 0))
    const s = exportScale
    const gap = longImageGap * s
    const width = Math.max(...images.map((i) => i.getScaledWidth())) * s
    const height =
      images.reduce((sum, i) => sum + i.getScaledHeight() * s, 0) + gap * (images.length - 1)
    const out = document.createElement('canvas')
    out.width = Math.round(width)
    out.height = Math.round(height)
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    let y = 0
    for (const obj of images) {
      const el = (obj as fabric.FabricImage).getElement() as HTMLImageElement
      const w = obj.getScaledWidth() * s
      const h = obj.getScaledHeight() * s
      ctx.drawImage(el, 0, y, w, h)
      y += h + gap
    }
    const fmt = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
    await api.exportLongImage(out.toDataURL(fmt, exportQuality))
  },
}))

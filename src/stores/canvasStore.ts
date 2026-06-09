import { create } from 'zustand'
import * as fabric from 'fabric'
import { api } from '@/services/api'

interface PlaceOptions {
  left?: number
  top?: number
  label?: string
}

interface CanvasState {
  canvas: fabric.Canvas | null
  zoom: number
  hasSelection: boolean
  cursor: { x: number; y: number }
  setCanvas: (c: fabric.Canvas | null) => void
  refreshSelection: () => void
  addImageFromUrl: (url: string, opts?: PlaceOptions) => Promise<fabric.FabricImage | null>
  addImagesGrid: (urls: string[], cols?: number) => Promise<void>
  addLongImageColumn: (urls: string[], titles?: string[]) => Promise<void>
  addArtboard: (w: number, h: number, label: string) => void
  addText: (text: string) => void
  deleteSelected: () => void
  duplicateSelected: () => Promise<void>
  bringForward: () => void
  sendBackward: () => void
  zoomBy: (factor: number) => void
  setZoom: (z: number) => void
  resetView: () => void
  fitToContent: () => void
  exportSelected: () => Promise<void>
  exportLongFromSelection: () => Promise<void>
}

const GRID_GAP = 24

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvas: null,
  zoom: 1,
  hasSelection: false,
  cursor: { x: 80, y: 80 },

  setCanvas(c) {
    set({ canvas: c })
  },

  refreshSelection() {
    const c = get().canvas
    set({ hasSelection: !!c && c.getActiveObjects().length > 0 })
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
      y += img.getScaledHeight() // sections touch edge-to-edge for a seamless long image
    }
    c.requestRenderAll()
    set({ cursor: { x: start.x + targetWidth + 220, y: start.y } })
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
    const active = c.getActiveObject()
    if (!active) return
    const cloned = await active.clone()
    cloned.set({ left: (active.left || 0) + 24, top: (active.top || 0) + 24 })
    c.add(cloned)
    c.setActiveObject(cloned)
    c.requestRenderAll()
  },

  bringForward() {
    const c = get().canvas
    if (!c) return
    c.getActiveObjects().forEach((o) => c.bringObjectForward(o))
    c.requestRenderAll()
  },

  sendBackward() {
    const c = get().canvas
    if (!c) return
    c.getActiveObjects().forEach((o) => c.sendObjectBackwards(o))
    c.requestRenderAll()
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

  async exportSelected() {
    const c = get().canvas
    if (!c) return
    const active = c.getActiveObject()
    const target = active || c
    const dataUrl = (target as any).toDataURL({ format: 'png', multiplier: 2 })
    await api.exportImage(dataUrl, `设计图_${Date.now()}.png`)
  },

  async exportLongFromSelection() {
    const c = get().canvas
    if (!c) return
    const objects = c.getActiveObjects().length ? c.getActiveObjects() : c.getObjects()
    const images = objects.filter((o) => o.type === 'image')
    if (images.length === 0) return
    // Stitch selected images vertically into a single long PNG.
    images.sort((a, b) => (a.top || 0) - (b.top || 0))
    const width = Math.max(...images.map((i) => i.getScaledWidth()))
    const height = images.reduce((sum, i) => sum + i.getScaledHeight(), 0)
    const out = document.createElement('canvas')
    out.width = width
    out.height = height
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    let y = 0
    for (const obj of images) {
      const el = (obj as fabric.FabricImage).getElement() as HTMLImageElement
      const w = obj.getScaledWidth()
      const h = obj.getScaledHeight()
      ctx.drawImage(el, 0, y, w, h)
      y += h
    }
    await api.exportLongImage(out.toDataURL('image/png'))
  },
}))

import type { GenerateRequest, GeneratedImage } from '@shared/types'

// Renders attractive placeholder images entirely on the client so the full
// app flow (chat → generate → canvas → export) can be exercised without any
// real API keys. Used as the web fallback and when no key is configured.
const PALETTES: [string, string][] = [
  ['#6d5efc', '#b16cea'],
  ['#ff6b6b', '#ffa36c'],
  ['#11998e', '#38ef7d'],
  ['#2193b0', '#6dd5ed'],
  ['#f7971e', '#ffd200'],
  ['#c94b4b', '#4b134f'],
]

function parseSize(size: string): [number, number] {
  const [w, h] = size.split(/[x*]/).map((n) => parseInt(n, 10))
  return [w || 1024, h || 1024]
}

export async function demoGenerate(req: GenerateRequest): Promise<GeneratedImage[]> {
  const [w, h] = parseSize(req.size)
  const out: GeneratedImage[] = []
  for (let i = 0; i < req.count; i++) {
    out.push({ dataUrl: drawPlaceholder(req, w, h, i), seed: (req.seed ?? 1000) + i })
    // Small delay to simulate generation latency.
    await new Promise((r) => setTimeout(r, 250))
  }
  return out
}

function drawPlaceholder(req: GenerateRequest, w: number, h: number, idx: number): string {
  const scale = Math.min(1, 768 / Math.max(w, h))
  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!
  const [c1, c2] = PALETTES[idx % PALETTES.length]

  const grad = ctx.createLinearGradient(0, 0, cw, ch)
  grad.addColorStop(0, c1)
  grad.addColorStop(1, c2)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, cw, ch)

  // Decorative circles
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#ffffff'
  for (let k = 0; k < 6; k++) {
    ctx.beginPath()
    ctx.arc((k * 137) % cw, (k * 211) % ch, 40 + ((k * 53) % 80), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Prompt text
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, ch - 110, cw, 110)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(cw / 26)}px sans-serif`
  wrapText(ctx, req.prompt, 16, ch - 75, cw - 32, Math.round(cw / 22))

  ctx.font = `${Math.round(cw / 38)}px sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText(`${req.model} · ${w}×${h} · #${idx + 1}`, 16, ch - 20)

  // Watermark
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `bold ${Math.round(cw / 16)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('DEMO', cw / 2, ch / 2)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const chars = text.split('')
  let line = ''
  let lines = 0
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight)
      line = ch
      lines++
      if (lines >= 2) {
        ctx.fillText(line.slice(0, 18) + '…', x, y + lines * lineHeight)
        return
      }
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, y + lines * lineHeight)
}

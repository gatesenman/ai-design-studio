import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, urlToDataUrl, toDataUrl } from './helpers'

// MiniMax 海螺 image generation.
const URL = 'https://api.minimaxi.com/v1/image_generation'

export async function generateMinimax(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const key = requireKey(apiKey, 'MiniMax')
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: req.model,
      prompt: req.prompt,
      aspect_ratio: sizeToAspect(req.size),
      n: Math.min(req.count, 9),
      response_format: 'url',
    }),
  })
  if (!res.ok) throw new Error(`MiniMax 调用失败: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as {
    data?: { image_urls?: string[]; image_base64?: string[] }
    base_resp?: { status_code?: number; status_msg?: string }
  }
  if (json.base_resp && json.base_resp.status_code !== 0) {
    throw new Error(`MiniMax 错误: ${json.base_resp.status_msg}`)
  }
  const out: GeneratedImage[] = []
  for (const u of json.data?.image_urls ?? []) out.push({ dataUrl: await urlToDataUrl(u) })
  for (const b of json.data?.image_base64 ?? []) out.push({ dataUrl: toDataUrl(b) })
  return out
}

function sizeToAspect(size: string): string {
  const [w, h] = size.split(/[x*]/).map(Number)
  if (!w || !h) return '1:1'
  if (w === h) return '1:1'
  return w > h ? '4:3' : '3:4'
}

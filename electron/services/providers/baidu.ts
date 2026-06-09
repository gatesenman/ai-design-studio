import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, urlToDataUrl, toDataUrl } from './helpers'

// Baidu 文心一格 (ERNIE iRAG) via Qianfan v2 images/generations.
// The API key should be a Qianfan bearer token (starts with "bce-v3/...").
const URL = 'https://qianfan.baidubce.com/v2/images/generations'

export async function generateYige(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const key = requireKey(apiKey, '百度 文心一格')
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: req.model,
      prompt: req.prompt,
      size: req.size,
      n: Math.min(req.count, 4),
    }),
  })
  if (!res.ok) throw new Error(`文心一格 调用失败: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { data?: { url?: string; b64_image?: string }[] }
  const out: GeneratedImage[] = []
  for (const d of json.data ?? []) {
    if (d.b64_image) out.push({ dataUrl: toDataUrl(d.b64_image) })
    else if (d.url) out.push({ dataUrl: await urlToDataUrl(d.url) })
  }
  return out
}

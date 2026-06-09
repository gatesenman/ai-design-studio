import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, toDataUrl, urlToDataUrl } from './helpers'

// ByteDance Volcengine Ark 即梦 Seedream: OpenAI-compatible images/generations.
const URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'

export async function generateSeedream(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const key = requireKey(apiKey, '火山引擎 (即梦 Seedream)')
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: req.model,
      prompt: req.prompt,
      size: req.size,
      response_format: 'url',
      seed: req.seed,
    }),
  })
  if (!res.ok) throw new Error(`即梦 Seedream 调用失败: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] }
  const out: GeneratedImage[] = []
  for (const d of json.data ?? []) {
    if (d.b64_json) out.push({ dataUrl: toDataUrl(d.b64_json) })
    else if (d.url) out.push({ dataUrl: await urlToDataUrl(d.url) })
  }
  return out
}

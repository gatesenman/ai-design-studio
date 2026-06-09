import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, urlToDataUrl } from './helpers'

// Zhipu CogView: synchronous images/generations endpoint (one image per call).
const URL = 'https://open.bigmodel.cn/api/paas/v4/images/generations'

export async function generateCogView(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const key = requireKey(apiKey, '智谱 Zhipu')
  const out: GeneratedImage[] = []
  for (let i = 0; i < req.count; i++) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: req.model, prompt: req.prompt, size: req.size }),
    })
    if (!res.ok) throw new Error(`智谱 CogView 调用失败: ${res.status} ${await res.text()}`)
    const json = (await res.json()) as { data?: { url?: string }[] }
    const url = json.data?.[0]?.url
    if (url) out.push({ dataUrl: await urlToDataUrl(url) })
  }
  return out
}

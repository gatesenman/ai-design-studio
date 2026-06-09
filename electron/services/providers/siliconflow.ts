import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, urlToDataUrl } from './helpers'

// SiliconFlow: OpenAI-compatible aggregator. Synchronous images/generations
// endpoint returning one image URL per call (Kolors / FLUX models).
const URL = 'https://api.siliconflow.cn/v1/images/generations'

interface SfBody {
  model: string
  prompt: string
  image_size: string
  batch_size: number
  num_inference_steps?: number
  guidance_scale?: number
  negative_prompt?: string
  seed?: number
  image?: string
}

interface SfResponse {
  images?: { url?: string }[]
  data?: { url?: string }[]
  seed?: number
}

export async function generateSiliconflow(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const key = requireKey(apiKey, '硅基流动 SiliconFlow')
  // SiliconFlow expects sizes like "1024x1024".
  const imageSize = req.size.replace('*', 'x')
  const out: GeneratedImage[] = []
  for (let i = 0; i < req.count; i++) {
    const body: SfBody = {
      model: req.model,
      prompt: req.prompt,
      image_size: imageSize,
      batch_size: 1,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    }
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt
    // Keep the same seed across a batch so long-image sections stay coherent.
    if (req.seed !== undefined) body.seed = req.seed
    if (req.mode === 'image-to-image' && req.referenceImage) {
      body.image = req.referenceImage
    }
    const res = await fetch(URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      throw new Error(`硅基流动 SiliconFlow 调用失败: ${res.status} ${await res.text()}`)
    }
    const json = (await res.json()) as SfResponse
    const url = json.images?.[0]?.url ?? json.data?.[0]?.url
    if (url) out.push({ dataUrl: await urlToDataUrl(url), seed: json.seed })
  }
  return out
}

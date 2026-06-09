import OpenAI, { toFile } from 'openai'
import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, toDataUrl, urlToDataUrl, stripDataUrl } from './helpers'

function client(apiKey: string, baseURL?: string) {
  return new OpenAI({ apiKey, baseURL: baseURL || undefined })
}

// gpt-image-1: supports text-to-image (generate) and image-to-image (edit).
export async function generateGptImage(
  req: GenerateRequest,
  apiKey: string | undefined,
  baseURL?: string,
): Promise<GeneratedImage[]> {
  const openai = client(requireKey(apiKey, 'OpenAI'), baseURL)

  if (req.mode === 'image-to-image' && req.referenceImage) {
    const raw = stripDataUrl(req.referenceImage)
    const buf = Buffer.from(raw, 'base64')
    const file = await toFile(buf, 'reference.png', { type: 'image/png' })
    const res = await openai.images.edit({
      model: 'gpt-image-1',
      image: file,
      prompt: req.prompt,
      n: req.count,
      size: req.size as never,
    })
    return (res.data ?? []).map((d) => ({ dataUrl: toDataUrl(d.b64_json as string) }))
  }

  const res = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: req.prompt,
    n: req.count,
    size: req.size as never,
  })
  return (res.data ?? []).map((d) => ({ dataUrl: toDataUrl(d.b64_json as string) }))
}

// DALL·E 3: text-to-image only, n must be 1 (we loop for batches).
export async function generateDalle3(
  req: GenerateRequest,
  apiKey: string | undefined,
  baseURL?: string,
): Promise<GeneratedImage[]> {
  const openai = client(requireKey(apiKey, 'OpenAI'), baseURL)
  const out: GeneratedImage[] = []
  for (let i = 0; i < req.count; i++) {
    const res = await openai.images.generate({
      model: 'dall-e-3',
      prompt: req.prompt,
      n: 1,
      size: req.size as never,
      response_format: 'b64_json',
    })
    const d = res.data?.[0]
    if (d?.b64_json) out.push({ dataUrl: toDataUrl(d.b64_json) })
    else if (d?.url) out.push({ dataUrl: await urlToDataUrl(d.url) })
  }
  return out
}

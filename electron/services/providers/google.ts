import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, toDataUrl } from './helpers'

// Google Imagen via the Generative Language REST API (:predict endpoint).
export async function generateImagen(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const key = requireKey(apiKey, 'Google')
  const model = req.model || 'imagen-3.0-generate-002'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${key}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: req.prompt }],
      parameters: { sampleCount: Math.min(req.count, 4) },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Imagen 调用失败: ${res.status} ${text}`)
  }

  const json = (await res.json()) as {
    predictions?: { bytesBase64Encoded?: string; mimeType?: string }[]
  }
  return (json.predictions ?? [])
    .filter((p) => p.bytesBase64Encoded)
    .map((p) => ({ dataUrl: toDataUrl(p.bytesBase64Encoded as string, p.mimeType || 'image/png') }))
}

import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, urlToDataUrl, poll } from './helpers'

// Aliyun DashScope 通义万相: async task — create then poll.
const CREATE_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
const TASK_URL = (id: string) => `https://dashscope.aliyuncs.com/api/v1/tasks/${id}`

export async function generateWanx(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const key = requireKey(apiKey, '阿里云 DashScope')

  const createRes = await fetch(CREATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: req.model,
      input: {
        prompt: req.prompt,
        negative_prompt: req.negativePrompt || undefined,
      },
      parameters: {
        size: req.size, // e.g. "1024*1024"
        n: Math.min(req.count, 4),
        seed: req.seed,
      },
    }),
  })

  if (!createRes.ok) {
    throw new Error(`通义万相任务创建失败: ${createRes.status} ${await createRes.text()}`)
  }
  const created = (await createRes.json()) as { output?: { task_id?: string } }
  const taskId = created.output?.task_id
  if (!taskId) throw new Error('通义万相未返回 task_id')

  const results = await poll<{ results?: { url?: string }[] }>(async () => {
    const res = await fetch(TASK_URL(taskId), {
      headers: { Authorization: `Bearer ${key}` },
    })
    const json = (await res.json()) as {
      output?: { task_status?: string; results?: { url?: string }[] }
    }
    const status = json.output?.task_status
    if (status === 'SUCCEEDED') return { done: true, result: { results: json.output?.results } }
    if (status === 'FAILED') throw new Error('通义万相任务失败')
    return { done: false }
  })

  const urls = (results.results ?? []).map((r) => r.url).filter(Boolean) as string[]
  return Promise.all(urls.map(async (u) => ({ dataUrl: await urlToDataUrl(u) })))
}

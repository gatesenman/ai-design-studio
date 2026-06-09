// Shared helpers for provider implementations.

/** Convert a remote image URL to a base64 data URL. */
export async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载图片失败: ${res.status}`)
  const contentType = res.headers.get('content-type') || 'image/png'
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:${contentType};base64,${buf.toString('base64')}`
}

/** Ensure a base64 string is a full data URL. */
export function toDataUrl(b64: string, mime = 'image/png'): string {
  if (b64.startsWith('data:')) return b64
  return `data:${mime};base64,${b64}`
}

/** Strip the data URL prefix, returning raw base64. */
export function stripDataUrl(dataUrl: string): string {
  const idx = dataUrl.indexOf(',')
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl
}

/** Poll an async task until done or timeout. */
export async function poll<T>(
  fn: () => Promise<{ done: boolean; result?: T }>,
  { intervalMs = 2000, timeoutMs = 120000 } = {},
): Promise<T> {
  const start = Date.now()
  for (;;) {
    const { done, result } = await fn()
    if (done && result !== undefined) return result
    if (Date.now() - start > timeoutMs) throw new Error('生成超时，请稍后重试')
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

export class ProviderError extends Error {}

export function requireKey(key: string | undefined, name: string): string {
  if (!key || !key.trim()) {
    throw new ProviderError(`未配置 ${name} 的 API Key，请在「设置」中填写`)
  }
  return key.trim()
}

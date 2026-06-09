import crypto from 'node:crypto'
import type { GenerateRequest, GeneratedImage } from '../../../shared/types'
import { requireKey, toDataUrl, urlToDataUrl } from './helpers'

// Tencent Cloud Hunyuan / AIArt text-to-image with TC3-HMAC-SHA256 signing.
// The API key should be "SecretId:SecretKey".
const HOST = 'aiart.tencentcloudapi.com'
const SERVICE = 'aiart'
const VERSION = '2022-12-29'
const ACTION = 'TextToImageLite'
const REGION = 'ap-guangzhou'

function sha256hex(msg: string): string {
  return crypto.createHash('sha256').update(msg, 'utf8').digest('hex')
}
function hmac(key: Buffer | string, msg: string): Buffer {
  return crypto.createHmac('sha256', key).update(msg, 'utf8').digest()
}

export async function generateHunyuan(
  req: GenerateRequest,
  apiKey: string | undefined,
): Promise<GeneratedImage[]> {
  const raw = requireKey(apiKey, '腾讯云 (混元生图)')
  const [secretId, secretKey] = raw.split(':')
  if (!secretId || !secretKey) {
    throw new Error('腾讯混元的 API Key 格式应为 "SecretId:SecretKey"')
  }

  const out: GeneratedImage[] = []
  // The Lite endpoint returns a single image per call; loop for batches.
  for (let i = 0; i < req.count; i++) {
    const payload = JSON.stringify({
      Prompt: req.prompt,
      NegativePrompt: req.negativePrompt || undefined,
      Resolution: req.size,
      RspImgType: 'base64',
      LogoAdd: 0,
    })

    const timestamp = Math.floor(Date.now() / 1000)
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10)

    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${HOST}\nx-tc-action:${ACTION.toLowerCase()}\n`
    const signedHeaders = 'content-type;host;x-tc-action'
    const hashedPayload = sha256hex(payload)
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`

    const credentialScope = `${date}/${SERVICE}/tc3_request`
    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256hex(
      canonicalRequest,
    )}`

    const secretDate = hmac(`TC3${secretKey}`, date)
    const secretService = hmac(secretDate, SERVICE)
    const secretSigning = hmac(secretService, 'tc3_request')
    const signature = crypto
      .createHmac('sha256', secretSigning)
      .update(stringToSign, 'utf8')
      .digest('hex')

    const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const res = await fetch(`https://${HOST}`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json; charset=utf-8',
        Host: HOST,
        'X-TC-Action': ACTION,
        'X-TC-Version': VERSION,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Region': REGION,
      },
      body: payload,
    })

    const json = (await res.json()) as {
      Response?: {
        ResultImage?: string
        Error?: { Code?: string; Message?: string }
      }
    }
    if (json.Response?.Error) {
      throw new Error(`腾讯混元错误: ${json.Response.Error.Message}`)
    }
    const img = json.Response?.ResultImage
    if (img) {
      out.push({ dataUrl: img.startsWith('http') ? await urlToDataUrl(img) : toDataUrl(img) })
    }
  }
  return out
}

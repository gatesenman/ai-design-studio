import type { GenerateRequest, GenerateResult, AppSettings } from '../../../shared/types'
import { getProvider } from '../../../shared/providers'
import { generateGptImage, generateDalle3 } from './openai'
import { generateImagen } from './google'
import { generateWanx } from './aliyun'
import { generateCogView } from './zhipu'
import { generateSeedream } from './volcengine'
import { generateMinimax } from './minimax'
import { generateYige } from './baidu'
import { generateHunyuan } from './tencent'

export async function runGenerate(
  req: GenerateRequest,
  settings: AppSettings,
): Promise<GenerateResult> {
  const provider = getProvider(req.providerId)
  if (!provider) throw new Error(`未知的生图服务: ${req.providerId}`)

  const key = settings.apiKeys[provider.apiKeyField]
  const baseUrl = settings.baseUrls[provider.apiKeyField]

  let images
  switch (req.providerId) {
    case 'openai-gpt-image':
      images = await generateGptImage(req, key, baseUrl)
      break
    case 'openai-dalle3':
      images = await generateDalle3(req, key, baseUrl)
      break
    case 'google-imagen':
      images = await generateImagen(req, key)
      break
    case 'aliyun-wanx':
      images = await generateWanx(req, key)
      break
    case 'zhipu-cogview':
      images = await generateCogView(req, key)
      break
    case 'volcengine-seedream':
      images = await generateSeedream(req, key)
      break
    case 'minimax':
      images = await generateMinimax(req, key)
      break
    case 'baidu-yige':
      images = await generateYige(req, key)
      break
    case 'tencent-hunyuan':
      images = await generateHunyuan(req, key)
      break
    default:
      throw new Error(`暂不支持的生图服务: ${req.providerId}`)
  }

  return { images, providerId: req.providerId, model: req.model }
}

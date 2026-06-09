import type { ProviderInfo } from './types'

// Static metadata describing every supported image-generation provider.
// Actual generation logic lives in electron/services/providers/.
export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai-gpt-image',
    name: 'ChatGPT 生图 (gpt-image-1)',
    region: 'global',
    apiKeyField: 'openai',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'gpt-image-1',
        label: 'gpt-image-1',
        sizes: ['1024x1024', '1024x1536', '1536x1024'],
        supportsImageToImage: true,
      },
    ],
  },
  {
    id: 'openai-dalle3',
    name: 'OpenAI DALL·E 3',
    region: 'global',
    apiKeyField: 'openai',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'dall-e-3',
        label: 'dall-e-3',
        sizes: ['1024x1024', '1024x1792', '1792x1024'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'google-imagen',
    name: 'Google Imagen (Gemini)',
    region: 'global',
    apiKeyField: 'google',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      {
        id: 'imagen-3.0-generate-002',
        label: 'Imagen 3',
        sizes: ['1024x1024'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'aliyun-wanx',
    name: '阿里 通义万相',
    region: 'china',
    apiKeyField: 'dashscope',
    docsUrl: 'https://help.aliyun.com/zh/dashscope/',
    models: [
      {
        id: 'wanx2.1-t2i-turbo',
        label: '万相 2.1 Turbo',
        sizes: ['1024*1024', '720*1280', '1280*720'],
        supportsImageToImage: false,
      },
      {
        id: 'wanx2.1-t2i-plus',
        label: '万相 2.1 Plus',
        sizes: ['1024*1024', '720*1280', '1280*720'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'volcengine-seedream',
    name: '字节 即梦 Seedream (豆包)',
    region: 'china',
    apiKeyField: 'volcengine',
    docsUrl: 'https://www.volcengine.com/docs/82379',
    models: [
      {
        id: 'doubao-seedream-3-0-t2i-250415',
        label: 'Seedream 3.0',
        sizes: ['1024x1024', '864x1152', '1152x864'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'baidu-yige',
    name: '百度 文心一格 (ERNIE)',
    region: 'china',
    apiKeyField: 'baidu',
    docsUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/',
    models: [
      {
        id: 'irag-1.0',
        label: 'iRAG 1.0',
        sizes: ['1024x1024', '768x1024', '1024x768'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'zhipu-cogview',
    name: '智谱 CogView',
    region: 'china',
    apiKeyField: 'zhipu',
    docsUrl: 'https://open.bigmodel.cn/',
    models: [
      {
        id: 'cogview-3-plus',
        label: 'CogView-3 Plus',
        sizes: ['1024x1024', '768x1344', '1344x768'],
        supportsImageToImage: false,
      },
      {
        id: 'cogview-4',
        label: 'CogView-4',
        sizes: ['1024x1024', '768x1344', '1344x768'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'tencent-hunyuan',
    name: '腾讯 混元生图',
    region: 'china',
    apiKeyField: 'tencent',
    docsUrl: 'https://cloud.tencent.com/document/product/1729',
    models: [
      {
        id: 'hunyuan-image',
        label: '混元生图',
        sizes: ['1024x1024', '768x1024', '1024x768'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax 海螺图片',
    region: 'china',
    apiKeyField: 'minimax',
    docsUrl: 'https://platform.minimaxi.com/',
    models: [
      {
        id: 'image-01',
        label: 'image-01',
        sizes: ['1024x1024', '768x1024', '1024x768'],
        supportsImageToImage: false,
      },
    ],
  },
  {
    id: 'siliconflow',
    name: '硅基流动 SiliconFlow',
    region: 'china',
    apiKeyField: 'siliconflow',
    docsUrl: 'https://cloud.siliconflow.cn/account/ak',
    models: [
      {
        id: 'Kwai-Kolors/Kolors',
        label: 'Kolors (可图)',
        sizes: ['1024x1024', '768x1024', '1024x768', '720x1280', '1280x720'],
        supportsImageToImage: true,
      },
      {
        id: 'black-forest-labs/FLUX.1-schnell',
        label: 'FLUX.1 schnell',
        sizes: ['1024x1024', '768x1024', '1024x768', '720x1280', '1280x720'],
        supportsImageToImage: false,
      },
      {
        id: 'black-forest-labs/FLUX.1-dev',
        label: 'FLUX.1 dev',
        sizes: ['1024x1024', '768x1024', '1024x768', '720x1280', '1280x720'],
        supportsImageToImage: false,
      },
    ],
  },
]

export function getProvider(id: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

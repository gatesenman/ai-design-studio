import type { Skill } from './types'

// Built-in, e-commerce focused skills shipped with the app.
export const BUILTIN_SKILLS: Skill[] = [
  {
    id: 'ecommerce-main',
    name: '电商主图',
    description: '生成 800×800 电商主图，突出商品主体，干净背景，适合作为列表/详情首图。',
    category: 'ecommerce',
    promptTemplate:
      '电商商品主图，{{product_name}}，{{style}}，居中构图，主体清晰突出，干净简洁的{{background}}背景，柔和均匀的商业摄影打光，高分辨率，产品细节锐利，专业电商风格',
    defaultProviderId: 'openai-gpt-image',
    defaultModel: 'gpt-image-1',
    size: '1024x1024',
    count: 4,
    variables: ['product_name', 'style', 'background'],
    builtin: true,
  },
  {
    id: 'ecommerce-poster',
    name: '电商海报',
    description: '生成 1080×1920 竖版促销海报，适合社媒投放，支持文字卖点与场景氛围。',
    category: 'poster',
    promptTemplate:
      '电商促销海报，竖版构图，主题：{{theme}}，商品：{{product_name}}，突出卖点"{{selling_point}}"，{{mood}}氛围，富有冲击力的视觉层次，留出文字排版空间，鲜明的色彩对比，专业广告设计',
    defaultProviderId: 'openai-gpt-image',
    defaultModel: 'gpt-image-1',
    size: '1024x1536',
    count: 2,
    variables: ['theme', 'product_name', 'selling_point', 'mood'],
    builtin: true,
  },
  {
    id: 'ecommerce-detail',
    name: '电商详情页',
    description:
      '生成完整详情页长图，分多个段落连贯生成（标题图 → 卖点 → 细节 → 场景 → 售后），各段保持统一风格与色调。',
    category: 'ecommerce',
    promptTemplate:
      '电商详情页，商品：{{product_name}}，品牌风格：{{style}}，统一的{{color}}主色调，专业商业摄影，连贯的视觉风格',
    defaultProviderId: 'openai-gpt-image',
    defaultModel: 'gpt-image-1',
    size: '1024x1024',
    count: 1,
    variables: ['product_name', 'style', 'color'],
    sections: [
      { title: '标题主图', prompt: '详情页头图，{{product_name}}主体大图展示，{{style}}，强烈的第一视觉冲击，品牌氛围' },
      { title: '核心卖点', prompt: '展示核心卖点的特写场景，{{product_name}}的功能与优势可视化呈现' },
      { title: '细节特写', prompt: '{{product_name}}材质与工艺的微距细节特写，质感突出' },
      { title: '使用场景', prompt: '{{product_name}}在真实生活场景中的使用画面，营造代入感' },
      { title: '规格/售后', prompt: '简洁的规格展示与品牌售后保障视觉，与整体风格统一' },
    ],
    builtin: true,
  },
]

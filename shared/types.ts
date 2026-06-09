// Shared types used by both the Electron main process and the React renderer.

export type ProviderId =
  | 'openai-gpt-image'
  | 'openai-dalle3'
  | 'google-imagen'
  | 'aliyun-wanx'
  | 'volcengine-seedream'
  | 'baidu-yige'
  | 'zhipu-cogview'
  | 'tencent-hunyuan'
  | 'minimax'
  | 'siliconflow'

export type GenerationMode = 'text-to-image' | 'image-to-image'

export interface ModelInfo {
  id: string
  label: string
  /** Supported output sizes, e.g. "1024x1024". Empty = free/any size. */
  sizes: string[]
  supportsImageToImage: boolean
}

export interface ProviderInfo {
  id: ProviderId
  name: string
  /** Region grouping for UI. */
  region: 'global' | 'china'
  models: ModelInfo[]
  /** Name of the settings key that stores this provider's API key. */
  apiKeyField: string
  /** Help text / where to obtain an API key. */
  docsUrl: string
}

export interface GenerateRequest {
  providerId: ProviderId
  model: string
  mode: GenerationMode
  prompt: string
  /** Negative prompt (supported by some Chinese providers). */
  negativePrompt?: string
  size: string
  /** Number of images to generate (batch). */
  count: number
  /** Base64 data URL of the reference image for image-to-image. */
  referenceImage?: string
  /** Optional seed for reproducibility / coherence across sections. */
  seed?: number
  /** Style strength for image-to-image (0-1). */
  strength?: number
}

export interface GeneratedImage {
  /** Base64 data URL. */
  dataUrl: string
  seed?: number
}

export interface GenerateResult {
  images: GeneratedImage[]
  /** Provider/model echoed back. */
  providerId: ProviderId
  model: string
}

export interface ApiError {
  error: string
}

// ---------------- Skills ----------------

export interface SkillSection {
  /** Section title, e.g. "标题图" / "卖点展示". */
  title: string
  /** Prompt fragment for this section (supports {{variables}}). */
  prompt: string
}

export interface Skill {
  id: string
  name: string
  description: string
  /** Category for grouping. */
  category: 'ecommerce' | 'poster' | 'social' | 'branding' | 'custom'
  /** Base prompt template, supports {{variables}}. */
  promptTemplate: string
  /** Default provider + model. */
  defaultProviderId: ProviderId
  defaultModel: string
  /** Output size. */
  size: string
  /** Default batch count. */
  count: number
  /** Variables the user can fill, e.g. ["product_name", "selling_point"]. */
  variables: string[]
  /** For long-image skills: ordered sections generated coherently. */
  sections?: SkillSection[]
  /** Whether this is a built-in (non-deletable) skill. */
  builtin: boolean
}

// ---------------- Brand Kit ----------------

export interface BrandKit {
  enabled: boolean
  name: string
  colors: string[]
  fonts: string[]
  /** Base64 logo. */
  logo?: string
  styleNotes: string
}

// ---------------- Settings ----------------

/** System-level preferences that tune default generation, canvas, and export behavior. */
export interface AppPreferences {
  /** Default provider/model/size/count used to seed the composer on launch. */
  defaultProviderId: ProviderId
  defaultModel: string
  defaultSize: string
  defaultCount: number
  /** UI theme. */
  theme: 'dark' | 'light'
  /** Show the dotted background grid on the canvas. */
  showGrid: boolean
  /** Snap objects to other objects' edges/centers while dragging. */
  snapEnabled: boolean
  /** Canvas background color. */
  canvasBg: string
  /** Default export image format. */
  exportFormat: 'png' | 'jpeg'
  /** JPEG quality (0-1), ignored for PNG. */
  exportQuality: number
  /** Export resolution multiplier (1 / 2 / 4). */
  exportScale: number
  /** Gap in px between sections when stitching a long image (0 = seamless). */
  longImageGap: number
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  defaultProviderId: 'siliconflow',
  defaultModel: 'Kwai-Kolors/Kolors',
  defaultSize: '1024x1024',
  defaultCount: 4,
  theme: 'dark',
  showGrid: true,
  snapEnabled: true,
  canvasBg: '#1a1a1e',
  exportFormat: 'png',
  exportQuality: 0.92,
  exportScale: 2,
  longImageGap: 0,
}

export interface AppSettings {
  apiKeys: Record<string, string>
  /** Extra base URLs for providers that support custom endpoints (proxies). */
  baseUrls: Record<string, string>
  brandKit: BrandKit
  /** System-level preferences (optional for backward compat with old settings files). */
  preferences?: AppPreferences
}

// ---------------- IPC channel names ----------------

export const IPC = {
  GENERATE: 'ai:generate',
  GET_PROVIDERS: 'ai:getProviders',
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  GET_SKILLS: 'skills:get',
  SAVE_SKILLS: 'skills:save',
  EXPORT_IMAGE: 'file:exportImage',
  EXPORT_LONG_IMAGE: 'file:exportLongImage',
} as const

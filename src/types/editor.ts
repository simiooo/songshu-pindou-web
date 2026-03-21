// ========== 画布相关类型 ==========

/** 画布尺寸选项 (单位: 颗粒数) */
export type CanvasSize = 29 | 36 | 52 | 72 | 104 | 156 | 200;

/** 单个像素颜色数据 */
export interface PixelData {
  color: string | null;
  filled: boolean;
}

/** 画布数据 - 二维数组 [y][x] */
export type CanvasData = PixelData[][];

// ========== 工具相关类型 ==========

/** 编辑工具类型 */
export type EditorTool = 'brush' | 'eraser' | 'selection' | 'fill';

/** 编辑操作类型 */
export type OperationType = 'fill' | 'erase' | 'fillArea';

/** 单次编辑操作记录 */
export interface EditorOperation {
  type: OperationType;
  x: number;
  y: number;
  previousColor: string | null;
  newColor: string | null;
}

/** 区域选择数据 */
export interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ========== 颜色相关类型 ==========

/** 颜色分类 */
export type ColorCategory =
  | 'solid'
  | 'pearl'
  | 'neon'
  | 'glow'
  | 'glitter'
  | 'translucent';

/** 色号组 - 一组相关的颜色集合 */
export interface ColorGroup {
  id: string;
  name: string;
  brand: 'Perler' | 'Artkal' | 'Hama' | 'Custom';
  beadSize: '5mm' | '3mm' | '2.6mm';
  category: ColorCategory;
  colors: ColorItem[];
}

export interface ColorItem {
  code: string;
  hex: string;
  name?: string;
}

// ========== 图片相关类型 ==========

/** 像素化配置 */
export interface PixelationConfig {
  targetSize: CanvasSize;
  colorGroupId: string;
  enableDithering: boolean;
}

/** 导入的图片原始数据 */
export interface ImportedImage {
  dataUrl: string;
  width: number;
  height: number;
}

// ========== LLM Provider 相关类型 ==========

export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'volces'
  | 'ollama'
  | 'glm'
  | 'minimax'
  | 'custom';

export interface ProviderModel {
  value: string;
  label: string;
}

export interface ProviderConfig {
  value: ProviderType;
  label: string;
  models: ProviderModel[];
  defaultBaseUrl?: string;
  supportsCustomBaseUrl: boolean;
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4.1', label: 'GPT-4.1' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
      { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-5', label: 'GPT-5' },
      { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
      { value: 'o1', label: 'o1' },
      { value: 'o3', label: 'o3' },
      { value: 'o3-mini', label: 'o3 Mini' },
      { value: 'o3-pro', label: 'o3 Pro' },
    ],
    defaultBaseUrl: 'https://api.openai.com/v1',
    supportsCustomBaseUrl: true,
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: [
      { value: 'claude-opus-4.6', label: 'Claude Opus 4.6' },
      { value: 'claude-opus-4.5', label: 'Claude Opus 4.5' },
      { value: 'claude-opus-4.1', label: 'Claude Opus 4.1' },
      { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
      { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
      { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
      { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5' },
      { value: 'claude-3.7-sonnet', label: 'Claude 3.7 Sonnet' },
      { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus', label: 'Claude 3 Opus' },
      { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    ],
    supportsCustomBaseUrl: false,
  },
  {
    value: 'google',
    label: 'Google',
    models: [
      { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
      { value: 'gemini-3-flash', label: 'Gemini 3 Flash' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    ],
    supportsCustomBaseUrl: false,
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
      { value: 'deepseek-v3.2-thinking', label: 'DeepSeek V3.2 Thinking' },
      { value: 'deepseek-v3.1', label: 'DeepSeek V3.1' },
      { value: 'deepseek-v3', label: 'DeepSeek V3' },
      { value: 'deepseek-r1', label: 'DeepSeek R1' },
    ],
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    supportsCustomBaseUrl: true,
  },
  {
    value: 'moonshot',
    label: 'Kimi (Moonshot)',
    models: [
      { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
      { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
      { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' },
    ],
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    supportsCustomBaseUrl: true,
  },
  {
    value: 'qwen',
    label: 'Qwen (通义千问)',
    models: [
      { value: 'qwen-turbo', label: 'Qwen Turbo' },
      { value: 'qwen-plus', label: 'Qwen Plus' },
      { value: 'qwen-max', label: 'Qwen Max' },
    ],
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    supportsCustomBaseUrl: true,
  },
  {
    value: 'glm',
    label: 'GLM (智谱)',
    models: [
      { value: 'glm-4', label: 'GLM-4' },
      { value: 'glm-4v', label: 'GLM-4V' },
      { value: 'glm-3-turbo', label: 'GLM-3 Turbo' },
    ],
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    supportsCustomBaseUrl: true,
  },
  {
    value: 'minimax',
    label: 'MiniMax',
    models: [
      { value: 'minimax-m2.7', label: 'MiniMax M2.7' },
      { value: 'minimax-m2.5', label: 'MiniMax M2.5' },
      { value: 'minimax-m2.1', label: 'MiniMax M2.1' },
      { value: 'minimax-m2', label: 'MiniMax M2' },
    ],
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    supportsCustomBaseUrl: true,
  },
  {
    value: 'volces',
    label: 'Seedream (字节跳动)',
    models: [
      { value: 'doubao-seedream-5-0-260128', label: 'Seedream 5.0 (推荐)' },
      { value: 'doubao-seedream-5-0-lite-260128', label: 'Seedream 5.0 Lite' },
      { value: 'doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
      { value: 'doubao-seedream-4-0-250828', label: 'Seedream 4.0' },
    ],
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    supportsCustomBaseUrl: false,
  },
  {
    value: 'ollama',
    label: 'Ollama (本地)',
    models: [
      { value: 'llama3', label: 'Llama 3' },
      { value: 'llama3.1', label: 'Llama 3.1' },
      { value: 'mistral', label: 'Mistral' },
      { value: 'codellama', label: 'Code Llama' },
      { value: 'qwen2.5', label: 'Qwen 2.5' },
      { value: 'deepseek-v2', label: 'DeepSeek V2' },
    ],
    defaultBaseUrl: 'http://localhost:11434/v1',
    supportsCustomBaseUrl: true,
  },
  {
    value: 'custom',
    label: 'Custom (自定义)',
    models: [],
    supportsCustomBaseUrl: true,
  },
];

export function getProviderConfig(providerType: ProviderType): ProviderConfig | undefined {
  return PROVIDER_CONFIGS.find((p) => p.value === providerType);
}

export function getModelsByProvider(providerType: ProviderType): ProviderModel[] {
  const config = getProviderConfig(providerType);
  return config?.models ?? [];
}

/** LLM Provider 配置 */
export interface LLMProvider {
  id: string;
  name: string;
  provider: ProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  isDefault: boolean;
  isImageProcessor: boolean;
  reasoningLevel?: string;
  maxTokens?: number;
  maxContextWindow?: number;
  temperature?: number;
  topP?: number;
  createdAt: number;
  updatedAt: number;
}

// ========== 保存相关类型 ==========

/** 项目保存数据 */
export interface ProjectData {
  id: string;
  name: string;
  canvasSize: CanvasSize;
  canvas: CanvasData;
  activeColorGroupId: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

// ========== 上传相关类型 ==========

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

// ========== 工具选项 ==========

export interface ToolOption {
  key: EditorTool;
  icon: string;
  label: string;
  shortcut: string;
}

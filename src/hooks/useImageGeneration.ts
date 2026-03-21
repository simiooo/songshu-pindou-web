import { useState, useCallback } from 'react';
import type { LLMProvider } from '@/types/editor';

export interface ImageGenerationParams {
  prompt: string;
  imageUrl?: string;
  size?: string;
  responseFormat?: 'url' | 'b64_json';
  useBase64InPrompt?: boolean; // 优先使用 base64 方式
  additionalParams?: Record<string, unknown>; // 额外参数如 watermark, stream, sequential_image_generation 等
}

export interface ImageGenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
}

export class ImageGenerationError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ImageGenerationError';
    this.code = code;
    this.status = status;
  }
}

// 拼豆应用专用 Prompt 模板
export const PERLER_BEAD_PROMPT_TEMPLATE = `请将参考图片转换为拼豆（Perler Beads）像素艺术风格。

转换要求：
1. 使用拼豆艺术风格：将图像转换为明显的像素/颗粒效果，每个"像素"应该像一颗5mm的塑料拼豆
2. 颜色处理：使用鲜艳、饱和度高的颜色，避免过于柔和的色调。颜色数量控制在20-30种以内，适合用实体拼豆制作
3. 细节简化：去除细小复杂的纹理，保留主要轮廓和特征。线条要清晰，边界分明
4. 对比度增强：提高明暗对比，确保不同颜色区域有明显区分，方便制作时识别
5. 保留原图核心特征：确保转换后的图案能清晰辨认出原图的主体内容
6. 适合网格化：图像应该是方块像素化的，适合映射到方形网格画布上

输出要求：
- 生成适合拼豆制作的图案
- 确保主体居中且完整
- 背景尽量简化或使用纯色
- 整体风格活泼、卡通化但可辨认`;

// 将图片 URL 转换为 base64
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // 移除 data:image/xxx;base64, 前缀
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new ImageGenerationError(
      `Failed to convert image to base64: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 使用 XML 格式在 prompt 中嵌入 base64 图片（字节跳动格式）
function buildPromptWithBase64Image(prompt: string, base64Image: string, mimeType = 'image/png'): string {
  return `${prompt}

<image>
<mime_type>${mimeType}</mime_type>
<data>${base64Image}</data>
</image>`;
}

// 检测是否是字节跳动/火山引擎 API
export function isVolcesAPI(baseUrl: string): boolean {
  return baseUrl.includes('volces.com') || baseUrl.includes('ark.cn-beijing');
}

// 字节跳动推荐尺寸（2K 分辨率）
const VOLCES_2K_SIZES = {
  '1:1': '2048x2048',
  '3:4': '1728x2304',
  '4:3': '2304x1728',
  '16:9': '2848x1600',
  '9:16': '1600x2848',
  '3:2': '2496x1664',
  '2:3': '1664x2496',
} as const;

// OpenAI 兼容尺寸
const OPENAI_SIZES = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
  '4:3': '1024x1536',
  '3:4': '1024x1536',
  '3:2': '1024x1536',
  '2:3': '1024x1536',
} as const;

// 计算最接近的宽高比
function getClosestAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  const ratios = [
    { key: '1:1', value: 1 },
    { key: '3:4', value: 0.75 },
    { key: '4:3', value: 1.333 },
    { key: '16:9', value: 1.778 },
    { key: '9:16', value: 0.5625 },
    { key: '3:2', value: 1.5 },
    { key: '2:3', value: 0.667 },
  ];
  
  let closest = ratios[0];
  let minDiff = Math.abs(ratio - closest.value);
  
  for (const r of ratios) {
    const diff = Math.abs(ratio - r.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = r;
    }
  }
  
  return closest.key;
}

// 根据原图比例计算 AI 生成尺寸
export function calculateImageSize(
  originalWidth: number,
  originalHeight: number,
  isVolces: boolean
): string {
  const aspectRatio = getClosestAspectRatio(originalWidth, originalHeight);
  
  if (isVolces) {
    // 字节跳动 API - 使用 2K 分辨率推荐尺寸
    return VOLCES_2K_SIZES[aspectRatio as keyof typeof VOLCES_2K_SIZES] || '2048x2048';
  } else {
    // 标准 OpenAI 兼容 API
    return OPENAI_SIZES[aspectRatio as keyof typeof OPENAI_SIZES] || '1024x1024';
  }
}

async function generateImageWithProvider(
  provider: LLMProvider,
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  const { provider: providerType, model, apiKey, baseUrl } = provider;
  
  if (!apiKey) {
    throw new ImageGenerationError('API key is required for image generation');
  }

  const url = baseUrl || getDefaultBaseUrl(providerType);
  // 检测是否是字节跳动 API：通过 providerType 或 baseUrl 判断
  const isVolces = providerType === 'volces' || isVolcesAPI(url);
  
  // 优先处理 base64 方式
  let finalPrompt = params.prompt;
  let imageUrlForApi: string | undefined;
  
  if (params.imageUrl) {
    if (params.useBase64InPrompt !== false) {
      // 默认使用 base64 方式（除非明确设置为 false）
      try {
        const base64Image = await imageUrlToBase64(params.imageUrl);
        // 尝试从 URL 推断 mime type
        const mimeType = params.imageUrl.endsWith('.png') 
          ? 'image/png' 
          : params.imageUrl.endsWith('.jpg') || params.imageUrl.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png';
        finalPrompt = buildPromptWithBase64Image(params.prompt, base64Image, mimeType);
      } catch {
        // 如果 base64 转换失败，回退到 URL 方式
        imageUrlForApi = params.imageUrl;
      }
    } else {
      // 明确使用 URL 方式
      imageUrlForApi = params.imageUrl;
    }
  }
  
  // 字节跳动 API 使用 OpenAI 兼容模式
  if (isVolces || providerType === 'custom' || providerType === 'moonshot' || providerType === 'qwen') {
    return generateWithOpenAICompatible(url, apiKey, model, {
      ...params,
      prompt: finalPrompt,
      imageUrl: imageUrlForApi,
    }, isVolces);
  }
  
  // OpenAI 原生 API
  return generateWithOpenAI(url, apiKey, model, {
    ...params,
    prompt: finalPrompt,
    imageUrl: imageUrlForApi,
  });
}

function getDefaultBaseUrl(providerType: string): string {
  switch (providerType) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'moonshot':
      return 'https://api.moonshot.cn/v1';
    case 'qwen':
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    case 'volces':
      return 'https://ark.cn-beijing.volces.com/api/v3';
    default:
      return '';
  }
}

async function generateWithOpenAI(
  baseUrl: string,
  apiKey: string,
  model: string,
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  const requestBody: Record<string, unknown> = {
    model,
    prompt: params.prompt,
    size: params.size || '1024x1024',
    response_format: params.responseFormat || 'url',
    n: 1,
  };

  // 如果有图片 URL 且未使用 base64 方式，添加到请求
  if (params.imageUrl) {
    requestBody.image = params.imageUrl;
  }

  // 添加额外参数
  if (params.additionalParams) {
    Object.assign(requestBody, params.additionalParams);
  }

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new ImageGenerationError(
      error.error?.message || `HTTP ${response.status}`,
      error.error?.code,
      response.status
    );
  }

  const data = await response.json();
  
  if (!data.data || !data.data[0]) {
    throw new ImageGenerationError('Invalid response from image generation API');
  }

  const result = data.data[0];
  
  if (result.url) {
    return { imageUrl: result.url, revisedPrompt: result.revised_prompt };
  } else if (result.b64_json) {
    return { imageUrl: `data:image/png;base64,${result.b64_json}`, revisedPrompt: result.revised_prompt };
  }
  
  throw new ImageGenerationError('No image data in response');
}

async function generateWithOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  params: ImageGenerationParams,
  isVolces = false
): Promise<ImageGenerationResult> {
  const requestBody: Record<string, unknown> = {
    model,
    prompt: params.prompt,
    response_format: params.responseFormat || 'url',
  };

  // 字节跳动 API 特有的参数处理
  if (isVolces) {
    // 字节跳动支持具体宽高像素值（如 2048x2048）或 2K/3K 等
    requestBody.size = params.size || '2048x2048';
    // 字节跳动特有参数
    requestBody.sequential_image_generation = 'disabled';
    requestBody.stream = false;
    requestBody.watermark = false; // 拼豆图案不需要水印
    requestBody.output_format = 'png'; // 使用 PNG 格式以获得更好的质量
  } else {
    requestBody.size = params.size || '1024x1024';
    requestBody.stream = false;
  }

  // 如果有图片 URL 且未使用 base64 方式，添加到请求
  if (params.imageUrl) {
    requestBody.image = params.imageUrl;
  }

  // 添加额外参数（优先级更高，可以覆盖默认值）
  if (params.additionalParams) {
    Object.assign(requestBody, params.additionalParams);
  }

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new ImageGenerationError(
      error.error?.message || `HTTP ${response.status}`,
      error.error?.code,
      response.status
    );
  }

  const data = await response.json();
  
  if (data.data && data.data[0]) {
    const result = data.data[0];
    if (result.url) {
      return { imageUrl: result.url, revisedPrompt: result.revised_prompt };
    } else if (result.b64_json) {
      return { imageUrl: `data:image/png;base64,${result.b64_json}`, revisedPrompt: result.revised_prompt };
    }
  }
  
  if (data.url) {
    return { imageUrl: data.url, revisedPrompt: data.revised_prompt };
  }
  
  throw new ImageGenerationError('No image data in response');
}

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);

  const generateImage = useCallback(async (
    provider: LLMProvider,
    params: ImageGenerationParams
  ): Promise<ImageGenerationResult> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const data = await generateImageWithProvider(provider, params);
      setResult(data);
      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new ImageGenerationError(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateImage,
    isGenerating,
    error,
    result,
  };
}

export { generateImageWithProvider, imageUrlToBase64, buildPromptWithBase64Image };

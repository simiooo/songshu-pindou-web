import { useState, useCallback } from 'react';
import type { LLMProvider, CanvasData } from '@/types/editor';

export interface ImageGenerationParams {
  prompt: string;
  imageUrl?: string;
  size?: string;
  responseFormat?: 'url' | 'b64_json';
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

重要提示（适用于整个图像，包括主体和背景）：
- 绝对禁止：不要在图片的任何部分生成网格线、边框线、分隔线或点阵
- 绝对禁止：不要生成任何积木凸起、积木拼接效果或乐高（Lego）风格元素
- 颜色块必须是纯色的，禁止任何形式的描边、轮廓线或阴影
- 颜色块之间只能通过颜色差异自然区分，禁止添加额外的线条或边界
- 整个图像必须保持平坦的像素化效果，禁止任何立体感或凸起效果

背景处理要求：
- 背景必须是纯色或简单的渐变色，绝对不能有网格、点阵、纹理或图案
- 背景不能有任何装饰性元素，如星星、圆点、方块等图案
- 背景必须是平坦、干净、统一的纯色区域
- 主体与背景的边界要清晰，但不要有描边或阴影

输出要求：
- 生成适合拼豆制作的图案
- 确保主体居中且完整
- 背景必须是纯色，不能有纹理或图案
- 整体风格活泼、卡通化但可辨认

比例处理要求：
- 输出图片必须为 1:1 正方形比例（1024x1024 或 2048x2048）
- 如果用户上传的图片比例不是 1:1，模型需要通过语义补全或裁剪将其调整为 1:1 正方形
- 补全时应保持主体内容完整，通过合理的场景延伸填充空白区域
- 确保补全后的内容在语义上连贯自然，符合原图的场景和氛围
- 主体内容不应被不合理地拉伸、压缩或截断`;

/**
 * 生成带网格参数的 Prompt
 * @param basePrompt 基础 prompt
 * @param gridSize 网格大小（如 29, 52, 72 等）
 * @param colorGroup 可选的色号组信息，用于指定可用的颜色范围
 * @returns 包含网格参数的最终 prompt
 */
export function generateGridPrompt(
  basePrompt: string,
  gridSize: number,
  colorGroup?: { name: string; brand: string; beadSize: string; colorCount: number }
): string {
  let gridInstruction = `\n\n网格参数要求：\n- 最终图案必须适配 ${gridSize}×${gridSize} 的方形网格\n- 图像应该被划分为 ${gridSize} 行 ${gridSize} 列的网格结构\n- 每个网格单元格代表一颗拼豆，且每个网格内的颜色必须完全相同（纯色填充）\n- 确保图案在 ${gridSize}×${gridSize} 网格内完整呈现，主体居中\n- 考虑网格边界，避免图案被截断\n- 绝对不能生成网格线、边框线或分隔线，颜色块之间只能通过颜色差异区分\n- 背景区域必须是纯色填充，不能有纹理、图案或装饰性元素`;

  if (colorGroup) {
    gridInstruction += `\n\n色号组参数要求：\n- 必须使用 ${colorGroup.brand} ${colorGroup.beadSize} 色号组\n- 该色号组共有 ${colorGroup.colorCount} 种颜色可选\n- 颜色数量控制在 ${colorGroup.colorCount} 种以内，必须使用该色号组中实际存在的颜色\n- 不要使用色号组中没有的颜色`;

    if (basePrompt.toLowerCase().includes('perler')) {
      gridInstruction += `\n\n重要提醒：\n- 绝对不能生成乐高(Lego)风格的凸起积木效果\n- 必须保持拼豆艺术风格：扁平的像素化效果`;
    }
  }

  return basePrompt ? `${basePrompt}${gridInstruction}` : `${PERLER_BEAD_PROMPT_TEMPLATE}${gridInstruction}`;
}

// uguu.se 上传响应接口
interface UguuUploadResponse {
  success: boolean;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  error?: string;
}

// 上传图片到 uguu.se 获取临时 URL
async function uploadImageToUguu(imageUrl: string): Promise<string> {
  try {
    // 获取图片 blob 数据
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error('Image blob is empty');
    }

    // 构建 FormData
    const formData = new FormData();
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    const filename = `image.${ext}`;

    // uguu.se 使用 files[] 数组字段名
    formData.append('files[]', blob, filename);

    // 上传到 uguu.se（通过代理）
    const uploadResponse = await fetch('/api/upload?output=json', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown error');
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    // 解析 JSON 响应
    const data = (await uploadResponse.json()) as UguuUploadResponse;

    if (!data.success) {
      throw new Error(`Upload failed: ${data.error || 'Unknown error'}`);
    }

    if (!data.files || data.files.length === 0 || !data.files[0].url) {
      throw new Error(`Invalid upload response: missing file URL`);
    }

    return data.files[0].url;
  } catch (error) {
    throw new ImageGenerationError(
      `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 将外部图片 URL 转换为代理 URL
function getProxiedImageUrl(originalUrl: string): string {
  // 如果 URL 已经是代理地址或 base64，直接返回
  if (originalUrl.startsWith('/api/') || originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  // 如果 URL 是 uguu.se 的，提取文件名并通过代理访问
  if (originalUrl.includes('uguu.se')) {
    try {
      const url = new URL(originalUrl);
      // 提取路径中的文件名部分
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      if (filename) {
        return `/api/upload/${filename}`;
      }
    } catch {
      // URL 解析失败，返回原 URL
      return originalUrl;
    }
  }

  // 其他外部 URL，使用 proxy-image 代理
  try {
    new URL(originalUrl);
    return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  } catch {
    // URL 解析失败，返回原 URL
    return originalUrl;
  }
}

// 检测是否是字节跳动/火山引擎 API
export function isVolcesAPI(baseUrl: string): boolean {
  return baseUrl.includes('volces.com') || baseUrl.includes('ark.cn-beijing');
}

// 根据原图比例计算 AI 生成尺寸（固定 1:1）
export function calculateImageSize(
  _originalWidth: number,
  _originalHeight: number,
  isVolces: boolean
): string {
  if (isVolces) {
    // 字节跳动 API - 固定使用 1:1 比例（2K 分辨率）
    return '2048x2048';
  } else {
    // 标准 OpenAI 兼容 API - 固定使用 1:1 比例
    return '1024x1024';
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

  // 如果有图片，先上传到 uguu.se 获取临时 URL
  let imageUrlForApi: string | undefined;

  if (params.imageUrl) {
    try {
      imageUrlForApi = await uploadImageToUguu(params.imageUrl);
    } catch (error) {
      throw new ImageGenerationError(
        `Failed to upload image for processing: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // 字节跳动 API 使用 OpenAI 兼容模式
  if (isVolces || providerType === 'custom' || providerType === 'moonshot' || providerType === 'qwen') {
    return generateWithOpenAICompatible(url, apiKey, model, {
      ...params,
      prompt: params.prompt,
      imageUrl: imageUrlForApi,
    }, isVolces);
  }

  // OpenAI 原生 API
  return generateWithOpenAI(url, apiKey, model, {
    ...params,
    prompt: params.prompt,
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
    // 将外部 URL 转换为代理 URL
    return { imageUrl: getProxiedImageUrl(result.url), revisedPrompt: result.revised_prompt };
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
      // 将外部 URL 转换为代理 URL
      return { imageUrl: getProxiedImageUrl(result.url), revisedPrompt: result.revised_prompt };
    } else if (result.b64_json) {
      return { imageUrl: `data:image/png;base64,${result.b64_json}`, revisedPrompt: result.revised_prompt };
    }
  }

  if (data.url) {
    // 将外部 URL 转换为代理 URL
    return { imageUrl: getProxiedImageUrl(data.url), revisedPrompt: data.revised_prompt };
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

export { generateImageWithProvider };

/**
 * 将图片URL转换为CanvasData（后处理，不涉及AI）
 * @param imageUrl 图片URL
 * @param gridSize 网格尺寸
 * @returns Promise<CanvasData>
 */
export async function processImageToCanvasData(
  imageUrl: string,
  gridSize: number
): Promise<CanvasData> {
  // 使用代理获取图片，避免 CORS 问题
  const proxyUrl = imageUrl.startsWith('/api/')
    ? imageUrl
    : `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch image through proxy');
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // 绘制原图
      ctx.drawImage(img, 0, 0);

      // 获取完整图像数据
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const canvasData: CanvasData = [];

      // 将原图划分为 gridSize x gridSize 的网格，每个网格取中心点像素
      const cellWidth = img.width / gridSize;
      const cellHeight = img.height / gridSize;

      for (let gridY = 0; gridY < gridSize; gridY++) {
        const row: { color: string | null; filled: boolean }[] = [];
        for (let gridX = 0; gridX < gridSize; gridX++) {
          // 计算该网格单元中心点在原图中的坐标
          const centerX = Math.floor(gridX * cellWidth + cellWidth / 2);
          const centerY = Math.floor(gridY * cellHeight + cellHeight / 2);

          // 确保坐标在有效范围内
          const safeX = Math.min(centerX, img.width - 1);
          const safeY = Math.min(centerY, img.height - 1);

          // 读取中心点像素
          const idx = (safeY * img.width + safeX) * 4;
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];
          const a = imageData.data[idx + 3];

          const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

          row.push({
            color: a > 128 ? hex : null,
            filled: a > 128,
          });
        }
        canvasData.push(row);
      }

      URL.revokeObjectURL(blobUrl);
      resolve(canvasData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = blobUrl;
  });
}
import type { LLMProvider } from '@/types/editor';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import { generateText } from 'ai';

export interface LLMProcessResult {
  success: boolean;
  result?: string;
  error?: string;
}

export async function processWithLLM(
  imageData: string,
  instruction: string,
  provider: LLMProvider
): Promise<LLMProcessResult> {
  if (!provider.apiKey && !provider.baseUrl) {
    return {
      success: false,
      error: '请先配置 API Key 或自定义端点',
    };
  }

  try {
    let model;

    switch (provider.provider) {
      case 'openai': {
        const { createOpenAI } = await import('@ai-sdk/openai');
        const openai = createOpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseUrl,
        });
        model = openai(provider.model);
        break;
      }

      case 'anthropic': {
        const { createAnthropic } = await import('@ai-sdk/anthropic');
        const anthropic = createAnthropic({
          apiKey: provider.apiKey,
        });
        model = anthropic(provider.model);
        break;
      }

      case 'google': {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const google = createGoogleGenerativeAI({
          apiKey: provider.apiKey,
        });
        model = google(provider.model);
        break;
      }

      default:
        return {
          success: false,
          error: `不支持的 Provider: ${provider.provider}`,
        };
    }

    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `你是一个图片处理助手。用户要求: ${instruction}\n\n请根据用户的要求处理这张图片，返回处理后的图片（如果是图片生成则返回新图片，如果是图片分析则返回分析结果）。只返回结果，不需要解释。`,
            },
            {
              type: 'image',
              image: imageData,
            },
          ],
        },
      ],
    });

    return {
      success: true,
      result: result.text,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '处理失败',
    };
  }
}

export function useLLMProcess() {
  const { getActiveProvider } = useLLMProviderStore();

  const processImage = async (
    imageData: string,
    instruction: string
  ): Promise<LLMProcessResult> => {
    const provider = getActiveProvider();

    if (!provider) {
      return {
        success: false,
        error: '请先配置并启用 LLM Provider',
      };
    }

    if (!provider.enabled) {
      return {
        success: false,
        error: '当前 Provider 未启用',
      };
    }

    return processWithLLM(imageData, instruction, provider);
  };

  return { processImage };
}

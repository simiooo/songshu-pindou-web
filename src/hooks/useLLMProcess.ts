import type { LLMProvider } from '@/types/editor';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export interface LLMProcessResult {
  success: boolean;
  result?: string;
  error?: string;
}

async function createModelForProvider(provider: LLMProvider) {
  const { provider: providerType, model, apiKey, baseUrl } = provider;

  switch (providerType) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey,
        baseURL: baseUrl,
      });
      return openai(model);
    }

    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({
        apiKey,
        baseURL: baseUrl,
      });
      return anthropic(model);
    }

    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({
        apiKey,
      });
      return google(model);
    }

    case 'deepseek':
    case 'moonshot':
    case 'qwen':
    case 'glm':
    case 'minimax':
    case 'ollama':
    case 'custom': {
      const openaiCompatible = createOpenAI({
        apiKey,
        baseURL: baseUrl,
      });
      return openaiCompatible(model);
    }

    default:
      throw new Error(`不支持的 Provider: ${providerType}`);
  }
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
    const model = await createModelForProvider(provider);

    const generateOptions: Record<string, unknown> = {
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
    };

    if (provider.maxTokens) {
      generateOptions.maxOutputTokens = provider.maxTokens;
    }

    if (provider.temperature !== undefined) {
      generateOptions.temperature = provider.temperature;
    }

    if (provider.topP !== undefined) {
      generateOptions.topP = provider.topP;
    }

    if (provider.reasoningLevel) {
      const reasoningBudgetMap: Record<string, number> = {
        low: 1024,
        medium: 4096,
        high: 8192,
      };
      const budget = reasoningBudgetMap[provider.reasoningLevel];
      if (budget) {
        generateOptions.thinking = { type: 'enabled', budget };
      }
    }

    const result = await generateText(generateOptions as Parameters<typeof generateText>[0]);

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
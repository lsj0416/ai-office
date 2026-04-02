import OpenAI from 'openai'
import { type AIModel } from '@/types'

export function createAIClient(_model: AIModel): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// 모델별 설정값 반환
export function getModelConfig(model: AIModel): { model: string; maxTokens: number } {
  const configs: Record<AIModel, { model: string; maxTokens: number }> = {
    'gpt-4o': { model: 'gpt-4o', maxTokens: 4096 },
    'gpt-4o-mini': { model: 'gpt-4o-mini', maxTokens: 2048 },
  }
  return configs[model]
}

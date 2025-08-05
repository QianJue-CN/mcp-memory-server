import { BaseEmbeddingProvider } from '../EmbeddingProvider.js';
import { EmbeddingResult, EmbeddingConfig } from '../../types/vector.js';
import { logger } from '../../utils/Logger.js';

/**
 * OpenAI嵌入提供商（也兼容OpenAI-like API）
 */
export class OpenAIProvider extends BaseEmbeddingProvider {
  private static readonly DEFAULT_BASE_URL = 'https://api.openai.com';
  private static readonly DEFAULT_MODEL = 'text-embedding-3-small';
  private static readonly MODEL_DIMENSIONS: Record<string, number> = {
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072,
    'text-embedding-ada-002': 1536
  };

  constructor(config: EmbeddingConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || OpenAIProvider.DEFAULT_BASE_URL,
      model: config.model || OpenAIProvider.DEFAULT_MODEL
    });
  }

  get name(): string {
    return 'openai';
  }

  get model(): string {
    return this.config.model;
  }

  get dimensions(): number {
    return this.config.dimensions ||
      OpenAIProvider.MODEL_DIMENSIONS[this.config.model] ||
      1536; // 默认维度
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.model);
  }

  /**
   * 生成嵌入向量
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured. Please provide apiKey.');
    }

    const processedText = this.preprocessText(text);

    return this.withRetry(async () => {
      const url = `${this.config.baseUrl}/v1/embeddings`;

      const requestBody = {
        input: processedText,
        model: this.config.model,
        encoding_format: 'float'
      };

      // 如果指定了维度且模型支持，添加dimensions参数
      if (this.config.dimensions && this.supportsCustomDimensions()) {
        (requestBody as any).dimensions = this.config.dimensions;
      }

      logger.debug(`Generating OpenAI embedding for text: ${processedText.substring(0, 100)}...`);

      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json() as any;

      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
      }

      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const embeddingData = data.data[0];
      if (!embeddingData.embedding || !Array.isArray(embeddingData.embedding)) {
        throw new Error('Invalid embedding data from OpenAI API');
      }

      const embedding = embeddingData.embedding;
      this.validateEmbedding(embedding);

      // 标准化向量
      const normalizedEmbedding = this.normalizeEmbedding(embedding);

      return {
        embedding: normalizedEmbedding,
        dimensions: embedding.length,
        model: this.config.model,
        provider: this.name
      };
    });
  }

  /**
   * 批量生成嵌入向量
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured. Please provide apiKey.');
    }

    logger.info(`Generating ${texts.length} embeddings using OpenAI (batch processing)`);

    // OpenAI支持批量处理，但有限制，我们分批处理
    const batchSize = 2048; // OpenAI的批量限制
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);

      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 处理单个批次
   */
  private async processBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return this.withRetry(async () => {
      const url = `${this.config.baseUrl}/v1/embeddings`;

      const processedTexts = texts.map(text => this.preprocessText(text));

      const requestBody = {
        input: processedTexts,
        model: this.config.model,
        encoding_format: 'float'
      };

      // 如果指定了维度且模型支持，添加dimensions参数
      if (this.config.dimensions && this.supportsCustomDimensions()) {
        (requestBody as any).dimensions = this.config.dimensions;
      }

      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json() as any;

      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
      }

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid batch response format from OpenAI API');
      }

      const results: EmbeddingResult[] = [];

      for (const embeddingData of data.data) {
        if (!embeddingData.embedding || !Array.isArray(embeddingData.embedding)) {
          throw new Error('Invalid embedding data in batch response');
        }

        const embedding = embeddingData.embedding;
        this.validateEmbedding(embedding);

        // 标准化向量
        const normalizedEmbedding = this.normalizeEmbedding(embedding);

        results.push({
          embedding: normalizedEmbedding,
          dimensions: embedding.length,
          model: this.config.model,
          provider: this.name
        });
      }

      return results;
    });
  }

  /**
   * 检查模型是否支持自定义维度
   */
  private supportsCustomDimensions(): boolean {
    return this.config.model.includes('text-embedding-3');
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      // 使用简单文本测试连接
      await this.generateEmbedding('test connection');
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error as Error);
      return false;
    }
  }

  /**
   * 获取使用统计
   */
  async getUsage(): Promise<any> {
    try {
      if (!this.isConfigured()) {
        return null;
      }

      // OpenAI没有直接的使用统计API，这里返回null
      // 实际使用中可以通过其他方式获取使用统计
      return null;
    } catch (error) {
      logger.error('Failed to get OpenAI usage:', error as Error);
      return null;
    }
  }
}

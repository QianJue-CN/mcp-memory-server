import { BaseEmbeddingProvider } from '../EmbeddingProvider.js';
import { EmbeddingResult, EmbeddingConfig } from '../../types/vector.js';
import { logger } from '../../utils/Logger.js';

/**
 * Ollama嵌入提供商
 */
export class OllamaProvider extends BaseEmbeddingProvider {
  private _dimensions: number = 0;

  constructor(config: EmbeddingConfig) {
    super(config);
    this._dimensions = config.dimensions || 0;
  }

  get name(): string {
    return 'ollama';
  }

  get model(): string {
    return this.config.model;
  }

  get dimensions(): number {
    return this._dimensions;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!(this.config.model && this.config.baseUrl);
  }

  /**
   * 生成嵌入向量
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.isConfigured()) {
      throw new Error('Ollama provider is not configured. Please provide model and baseUrl.');
    }

    const processedText = this.preprocessText(text);

    return this.withRetry(async () => {
      const url = `${this.config.baseUrl}/api/embeddings`;

      const requestBody = {
        model: this.config.model,
        prompt: processedText,
      };

      logger.debug(`Generating Ollama embedding for text: ${processedText.substring(0, 100)}...`);

      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as any;

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid response format from Ollama API');
      }

      const embedding = data.embedding;
      this.validateEmbedding(embedding);

      // 更新维度信息（如果之前未知）
      if (this._dimensions === 0) {
        this._dimensions = embedding.length;
        logger.info(`Detected Ollama embedding dimensions: ${this._dimensions}`);
      }

      // 标准化向量
      const normalizedEmbedding = this.normalizeEmbedding(embedding);

      return {
        embedding: normalizedEmbedding,
        dimensions: this._dimensions,
        model: this.config.model,
        provider: this.name,
      };
    });
  }

  /**
   * 批量生成嵌入向量（Ollama可能不支持批量，使用串行处理）
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    logger.info(`Generating ${texts.length} embeddings using Ollama (serial processing)`);

    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i++) {
      try {
        logger.debug(`Processing text ${i + 1}/${texts.length}`);
        const result = await this.generateEmbedding(texts[i]);
        results.push(result);

        // 添加小延迟避免过载
        if (i < texts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        logger.error(
          `Failed to generate embedding for text ${i + 1}: ${texts[i].substring(0, 50)}...`,
          error as Error
        );
        throw error;
      }
    }

    return results;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      const url = `${this.config.baseUrl}/api/tags`;
      const response = await this.makeRequest(
        url,
        {
          method: 'GET',
        },
        5000
      ); // 5秒超时

      const data = (await response.json()) as any;

      // 检查模型是否可用
      if (data.models && Array.isArray(data.models)) {
        const modelExists = data.models.some(
          (model: any) =>
            model.name === this.config.model || model.name.startsWith(this.config.model)
        );

        if (!modelExists) {
          logger.warn(
            `Model ${this.config.model} not found in Ollama. Available models: ${data.models.map((m: any) => m.name).join(', ')}`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Ollama connection test failed:', error as Error);
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      if (!this.config.baseUrl) {
        return [];
      }

      const url = `${this.config.baseUrl}/api/tags`;
      const response = await this.makeRequest(
        url,
        {
          method: 'GET',
        },
        5000
      );

      const data = (await response.json()) as any;

      if (data.models && Array.isArray(data.models)) {
        return data.models.map((model: any) => model.name);
      }

      return [];
    } catch (error) {
      logger.error('Failed to get available Ollama models:', error as Error);
      return [];
    }
  }
}

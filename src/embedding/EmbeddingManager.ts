import { EmbeddingProvider, EmbeddingResult, EmbeddingConfig, EmbeddingConfigSchema } from '../types/vector.js';
import { EmbeddingProviderFactory } from './EmbeddingProvider.js';
import { logger } from '../utils/Logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 嵌入管理器 - 管理嵌入提供商和配置
 */
export class EmbeddingManager {
  private provider: EmbeddingProvider | null = null;
  private config: EmbeddingConfig | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'embedding-config.json');
  }

  /**
   * 初始化嵌入管理器
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      if (this.config) {
        await this.createProvider(this.config);
      }
    } catch (error) {
      logger.warn('Failed to initialize embedding manager:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * 配置嵌入提供商
   */
  async configure(config: EmbeddingConfig): Promise<void> {
    // 验证配置
    const validatedConfig = EmbeddingConfigSchema.parse(config);

    // 创建提供商
    const provider = await EmbeddingProviderFactory.createProvider(validatedConfig);

    // 测试连接
    const isConnected = await this.testProvider(provider);
    if (!isConnected) {
      throw new Error(`Failed to connect to ${validatedConfig.provider} provider`);
    }

    // 保存配置和提供商
    this.config = validatedConfig;
    this.provider = provider;

    // 持久化配置
    await this.saveConfig();

    logger.info(`Successfully configured ${validatedConfig.provider} embedding provider with model ${validatedConfig.model}`);
  }

  /**
   * 生成嵌入向量
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.provider) {
      throw new Error('Embedding provider not configured. Please configure a provider first.');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    return await this.provider.generateEmbedding(text);
  }

  /**
   * 批量生成嵌入向量
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.provider) {
      throw new Error('Embedding provider not configured. Please configure a provider first.');
    }

    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    // 过滤空文本
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('No valid texts provided');
    }

    return await this.provider.generateEmbeddings(validTexts);
  }

  /**
   * 获取当前提供商信息
   */
  getProviderInfo(): any {
    if (!this.provider) {
      return null;
    }

    return this.provider.getInfo();
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.provider !== null && this.provider.isConfigured();
  }

  /**
   * 获取当前配置
   */
  getConfig(): EmbeddingConfig | null {
    return this.config;
  }

  /**
   * 测试当前提供商连接
   */
  async testConnection(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    return await this.testProvider(this.provider);
  }

  /**
   * 重置配置
   */
  async reset(): Promise<void> {
    this.provider = null;
    this.config = null;

    try {
      await fs.unlink(this.configPath);
    } catch (error) {
      // 文件不存在时忽略错误
    }

    logger.info('Embedding configuration reset');
  }

  /**
   * 获取支持的提供商列表
   */
  getSupportedProviders(): string[] {
    return EmbeddingProviderFactory.getSupportedProviders();
  }

  /**
   * 创建提供商实例
   */
  private async createProvider(config: EmbeddingConfig): Promise<void> {
    try {
      this.provider = await EmbeddingProviderFactory.createProvider(config);
      logger.info(`Created ${config.provider} embedding provider`);
    } catch (error) {
      logger.error(`Failed to create ${config.provider} provider:`, error as Error);
      throw error;
    }
  }

  /**
   * 测试提供商连接
   */
  private async testProvider(provider: EmbeddingProvider): Promise<boolean> {
    try {
      // 尝试生成一个简单的嵌入向量
      await provider.generateEmbedding('test');
      return true;
    } catch (error) {
      logger.error(`Provider ${provider.name} connection test failed:`, error as Error);
      return false;
    }
  }

  /**
   * 加载配置文件
   */
  private async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const rawConfig = JSON.parse(configData);
      this.config = EmbeddingConfigSchema.parse(rawConfig);
      logger.info(`Loaded embedding configuration from ${this.configPath}`);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        logger.warn(`Failed to load embedding configuration:`, { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  /**
   * 保存配置文件
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) {
      return;
    }

    try {
      // 创建配置副本，移除敏感信息用于日志
      const configForSave = { ...this.config };
      const configForLog = { ...this.config };
      if (configForLog.apiKey) {
        configForLog.apiKey = '***';
      }

      await fs.writeFile(this.configPath, JSON.stringify(configForSave, null, 2));
      logger.info(`Saved embedding configuration to ${this.configPath}:`, configForLog);
    } catch (error) {
      logger.error(`Failed to save embedding configuration:`, error as Error);
      throw error;
    }
  }

  /**
   * 获取配置模板
   */
  static getConfigTemplate(provider: 'ollama' | 'gemini' | 'openai'): Partial<EmbeddingConfig> {
    const baseTemplate = {
      provider,
      timeout: 30000,
      maxRetries: 3
    };

    switch (provider) {
      case 'ollama':
        return {
          ...baseTemplate,
          baseUrl: 'http://localhost:11434',
          model: 'nomic-embed-text', // 常用的Ollama嵌入模型
          dimensions: 768
        };

      case 'gemini':
        return {
          ...baseTemplate,
          model: 'embedding-001',
          apiKey: 'your-gemini-api-key',
          dimensions: 768
        };

      case 'openai':
        return {
          ...baseTemplate,
          model: 'text-embedding-3-small',
          apiKey: 'your-openai-api-key',
          dimensions: 1536
        };

      default:
        return baseTemplate;
    }
  }
}

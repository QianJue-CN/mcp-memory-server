import { BaseEmbeddingProvider } from '../EmbeddingProvider.js';
import { logger } from '../../utils/Logger.js';
/**
 * Gemini嵌入提供商
 */
export class GeminiProvider extends BaseEmbeddingProvider {
    static DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
    static DEFAULT_MODEL = 'embedding-001';
    static DEFAULT_DIMENSIONS = 768;
    constructor(config) {
        super({
            ...config,
            baseUrl: config.baseUrl || GeminiProvider.DEFAULT_BASE_URL,
            model: config.model || GeminiProvider.DEFAULT_MODEL,
        });
    }
    get name() {
        return 'gemini';
    }
    get model() {
        return this.config.model;
    }
    get dimensions() {
        return this.config.dimensions || GeminiProvider.DEFAULT_DIMENSIONS;
    }
    /**
     * 检查是否已配置
     */
    isConfigured() {
        return !!(this.config.apiKey && this.config.model);
    }
    /**
     * 生成嵌入向量
     */
    async generateEmbedding(text) {
        if (!this.isConfigured()) {
            throw new Error('Gemini provider is not configured. Please provide apiKey.');
        }
        const processedText = this.preprocessText(text);
        return this.withRetry(async () => {
            // 尝试不同的API端点格式
            const endpoints = [`/v1/embeddings`, `/v1/models/${this.config.model}:embedContent`];
            let response = null;
            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    const url = `${this.config.baseUrl}${endpoint}`;
                    // 根据端点选择请求格式
                    const requestBody = endpoint.includes('embedContent')
                        ? {
                            content: {
                                parts: [
                                    {
                                        text: processedText,
                                    },
                                ],
                            },
                        }
                        : {
                            input: processedText,
                            model: this.config.model,
                        };
                    logger.debug(`Trying Gemini endpoint: ${endpoint}`);
                    response = await this.makeRequest(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${this.config.apiKey}`,
                        },
                        body: JSON.stringify(requestBody),
                    });
                    // 如果成功，跳出循环
                    break;
                }
                catch (error) {
                    lastError = error;
                    logger.debug(`Endpoint ${endpoint} failed: ${lastError.message}`);
                }
            }
            if (!response) {
                throw lastError || new Error('All endpoints failed');
            }
            const data = (await response.json());
            if (data.error) {
                throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
            }
            let embedding;
            // 处理不同的响应格式
            if (data.embedding && data.embedding.values && Array.isArray(data.embedding.values)) {
                // Gemini embedContent 格式
                embedding = data.embedding.values;
            }
            else if (data.data && Array.isArray(data.data) && data.data[0] && data.data[0].embedding) {
                // OpenAI 兼容格式
                embedding = data.data[0].embedding;
            }
            else {
                throw new Error('Invalid response format from Gemini API');
            }
            this.validateEmbedding(embedding);
            // 标准化向量
            const normalizedEmbedding = this.normalizeEmbedding(embedding);
            return {
                embedding: normalizedEmbedding,
                dimensions: embedding.length,
                model: this.config.model,
                provider: this.name,
            };
        });
    }
    /**
     * 批量生成嵌入向量
     */
    async generateEmbeddings(texts) {
        if (!this.isConfigured()) {
            throw new Error('Gemini provider is not configured. Please provide apiKey.');
        }
        logger.info(`Generating ${texts.length} embeddings using Gemini (batch processing)`);
        // Gemini支持批量处理，但有限制，我们分批处理
        const batchSize = 100; // Gemini的批量限制
        const results = [];
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
    async processBatch(texts) {
        return this.withRetry(async () => {
            const url = `${this.config.baseUrl}/v1/models/${this.config.model}:batchEmbedContents`;
            const requests = texts.map((text) => ({
                content: {
                    parts: [
                        {
                            text: this.preprocessText(text),
                        },
                    ],
                },
            }));
            const requestBody = {
                requests,
            };
            const response = await this.makeRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });
            const data = (await response.json());
            if (data.error) {
                throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
            }
            if (!data.embeddings || !Array.isArray(data.embeddings)) {
                throw new Error('Invalid batch response format from Gemini API');
            }
            const results = [];
            for (const embeddingData of data.embeddings) {
                if (!embeddingData.values || !Array.isArray(embeddingData.values)) {
                    throw new Error('Invalid embedding data in batch response');
                }
                const embedding = embeddingData.values;
                this.validateEmbedding(embedding);
                // 标准化向量
                const normalizedEmbedding = this.normalizeEmbedding(embedding);
                results.push({
                    embedding: normalizedEmbedding,
                    dimensions: embedding.length,
                    model: this.config.model,
                    provider: this.name,
                });
            }
            return results;
        });
    }
    /**
     * 测试连接
     */
    async testConnection() {
        try {
            if (!this.isConfigured()) {
                return false;
            }
            // 使用简单文本测试连接
            await this.generateEmbedding('test connection');
            return true;
        }
        catch (error) {
            logger.error('Gemini connection test failed:', error);
            return false;
        }
    }
    /**
     * 获取模型信息
     */
    async getModelInfo() {
        try {
            if (!this.isConfigured()) {
                return null;
            }
            const url = `${this.config.baseUrl}/v1/models/${this.config.model}`;
            const response = await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
            }, 5000);
            const data = (await response.json());
            if (data.error) {
                throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
            }
            return data;
        }
        catch (error) {
            logger.error('Failed to get Gemini model info:', error);
            return null;
        }
    }
}
//# sourceMappingURL=GeminiProvider.js.map
import { logger } from '../utils/Logger.js';
/**
 * 嵌入提供商的抽象基类
 */
export class BaseEmbeddingProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * 批量生成嵌入向量的默认实现
     */
    async generateEmbeddings(texts) {
        const results = [];
        for (const text of texts) {
            try {
                const result = await this.generateEmbedding(text);
                results.push(result);
            }
            catch (error) {
                logger.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, error);
                throw error;
            }
        }
        return results;
    }
    /**
     * 获取提供商信息
     */
    getInfo() {
        return {
            name: this.name,
            model: this.model,
            dimensions: this.dimensions,
            configured: this.isConfigured(),
        };
    }
    /**
     * 预处理文本（清理和标准化）
     */
    preprocessText(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/\n+/g, ' ') // 替换换行符为空格
            .substring(0, 8000); // 限制长度，避免API限制
    }
    /**
     * 重试机制
     */
    async withRetry(operation, maxRetries = this.config.maxRetries || 3) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    break;
                }
                // 指数退避
                const delay = Math.pow(2, attempt) * 1000;
                logger.warn(`Embedding API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    /**
     * HTTP请求的通用方法
     */
    async makeRequest(url, options, timeout = this.config.timeout || 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * 验证嵌入向量
     */
    validateEmbedding(embedding) {
        if (!Array.isArray(embedding)) {
            throw new Error('Embedding must be an array');
        }
        if (embedding.length === 0) {
            throw new Error('Embedding cannot be empty');
        }
        if (embedding.some((val) => typeof val !== 'number' || !isFinite(val))) {
            throw new Error('Embedding must contain only finite numbers');
        }
        if (this.dimensions > 0 && embedding.length !== this.dimensions) {
            throw new Error(`Embedding dimension mismatch: expected ${this.dimensions}, got ${embedding.length}`);
        }
    }
    /**
     * 标准化嵌入向量（L2归一化）
     */
    normalizeEmbedding(embedding) {
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) {
            throw new Error('Cannot normalize zero vector');
        }
        return embedding.map((val) => val / magnitude);
    }
}
/**
 * 嵌入提供商工厂
 */
export class EmbeddingProviderFactory {
    /**
     * 创建嵌入提供商实例
     */
    static async createProvider(config) {
        const { OllamaProvider } = await import('./providers/OllamaProvider.js');
        const { GeminiProvider } = await import('./providers/GeminiProvider.js');
        const { OpenAIProvider } = await import('./providers/OpenAIProvider.js');
        switch (config.provider) {
            case 'ollama':
                return new OllamaProvider(config);
            case 'gemini':
                return new GeminiProvider(config);
            case 'openai':
                return new OpenAIProvider(config);
            default:
                throw new Error(`Unsupported embedding provider: ${config.provider}`);
        }
    }
    /**
     * 获取支持的提供商列表
     */
    static getSupportedProviders() {
        return ['ollama', 'gemini', 'openai'];
    }
}
//# sourceMappingURL=EmbeddingProvider.js.map
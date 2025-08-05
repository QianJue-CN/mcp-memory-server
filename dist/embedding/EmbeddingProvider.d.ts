import { EmbeddingProvider, EmbeddingResult, EmbeddingConfig } from '../types/vector.js';
/**
 * 嵌入提供商的抽象基类
 */
export declare abstract class BaseEmbeddingProvider implements EmbeddingProvider {
    protected config: EmbeddingConfig;
    constructor(config: EmbeddingConfig);
    abstract get name(): string;
    abstract get model(): string;
    abstract get dimensions(): number;
    abstract isConfigured(): boolean;
    abstract generateEmbedding(text: string): Promise<EmbeddingResult>;
    /**
     * 批量生成嵌入向量的默认实现
     */
    generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>;
    /**
     * 获取提供商信息
     */
    getInfo(): {
        name: string;
        model: string;
        dimensions: number;
        configured: boolean;
    };
    /**
     * 预处理文本（清理和标准化）
     */
    protected preprocessText(text: string): string;
    /**
     * 重试机制
     */
    protected withRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
    /**
     * HTTP请求的通用方法
     */
    protected makeRequest(url: string, options: RequestInit, timeout?: number): Promise<Response>;
    /**
     * 验证嵌入向量
     */
    protected validateEmbedding(embedding: number[]): void;
    /**
     * 标准化嵌入向量（L2归一化）
     */
    protected normalizeEmbedding(embedding: number[]): number[];
}
/**
 * 嵌入提供商工厂
 */
export declare class EmbeddingProviderFactory {
    /**
     * 创建嵌入提供商实例
     */
    static createProvider(config: EmbeddingConfig): Promise<EmbeddingProvider>;
    /**
     * 获取支持的提供商列表
     */
    static getSupportedProviders(): string[];
}
//# sourceMappingURL=EmbeddingProvider.d.ts.map
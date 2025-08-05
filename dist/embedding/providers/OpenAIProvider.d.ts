import { BaseEmbeddingProvider } from '../EmbeddingProvider.js';
import { EmbeddingResult, EmbeddingConfig } from '../../types/vector.js';
/**
 * OpenAI嵌入提供商（也兼容OpenAI-like API）
 */
export declare class OpenAIProvider extends BaseEmbeddingProvider {
    private static readonly DEFAULT_BASE_URL;
    private static readonly DEFAULT_MODEL;
    private static readonly MODEL_DIMENSIONS;
    constructor(config: EmbeddingConfig);
    get name(): string;
    get model(): string;
    get dimensions(): number;
    /**
     * 检查是否已配置
     */
    isConfigured(): boolean;
    /**
     * 生成嵌入向量
     */
    generateEmbedding(text: string): Promise<EmbeddingResult>;
    /**
     * 批量生成嵌入向量
     */
    generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>;
    /**
     * 处理单个批次
     */
    private processBatch;
    /**
     * 检查模型是否支持自定义维度
     */
    private supportsCustomDimensions;
    /**
     * 测试连接
     */
    testConnection(): Promise<boolean>;
    /**
     * 获取使用统计
     */
    getUsage(): Promise<any>;
}
//# sourceMappingURL=OpenAIProvider.d.ts.map
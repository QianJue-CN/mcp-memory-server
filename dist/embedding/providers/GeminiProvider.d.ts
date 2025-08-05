import { BaseEmbeddingProvider } from '../EmbeddingProvider.js';
import { EmbeddingResult, EmbeddingConfig } from '../../types/vector.js';
/**
 * Gemini嵌入提供商
 */
export declare class GeminiProvider extends BaseEmbeddingProvider {
    private static readonly DEFAULT_BASE_URL;
    private static readonly DEFAULT_MODEL;
    private static readonly DEFAULT_DIMENSIONS;
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
     * 测试连接
     */
    testConnection(): Promise<boolean>;
    /**
     * 获取模型信息
     */
    getModelInfo(): Promise<any>;
}
//# sourceMappingURL=GeminiProvider.d.ts.map
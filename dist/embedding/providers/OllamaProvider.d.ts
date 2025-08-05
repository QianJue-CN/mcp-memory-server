import { BaseEmbeddingProvider } from '../EmbeddingProvider.js';
import { EmbeddingResult, EmbeddingConfig } from '../../types/vector.js';
/**
 * Ollama嵌入提供商
 */
export declare class OllamaProvider extends BaseEmbeddingProvider {
    private _dimensions;
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
     * 批量生成嵌入向量（Ollama可能不支持批量，使用串行处理）
     */
    generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>;
    /**
     * 测试连接
     */
    testConnection(): Promise<boolean>;
    /**
     * 获取可用模型列表
     */
    getAvailableModels(): Promise<string[]>;
}
//# sourceMappingURL=OllamaProvider.d.ts.map
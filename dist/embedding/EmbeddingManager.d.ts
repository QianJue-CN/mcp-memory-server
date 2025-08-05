import { EmbeddingResult, EmbeddingConfig } from '../types/vector.js';
/**
 * 嵌入管理器 - 管理嵌入提供商和配置
 */
export declare class EmbeddingManager {
    private provider;
    private config;
    private configPath;
    constructor(configPath?: string);
    /**
     * 初始化嵌入管理器
     */
    initialize(): Promise<void>;
    /**
     * 配置嵌入提供商
     */
    configure(config: EmbeddingConfig): Promise<void>;
    /**
     * 生成嵌入向量
     */
    generateEmbedding(text: string): Promise<EmbeddingResult>;
    /**
     * 批量生成嵌入向量
     */
    generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>;
    /**
     * 获取当前提供商信息
     */
    getProviderInfo(): any;
    /**
     * 检查是否已配置
     */
    isConfigured(): boolean;
    /**
     * 获取当前配置
     */
    getConfig(): EmbeddingConfig | null;
    /**
     * 测试当前提供商连接
     */
    testConnection(): Promise<boolean>;
    /**
     * 重置配置
     */
    reset(): Promise<void>;
    /**
     * 获取支持的提供商列表
     */
    getSupportedProviders(): string[];
    /**
     * 创建提供商实例
     */
    private createProvider;
    /**
     * 测试提供商连接
     */
    private testProvider;
    /**
     * 加载配置文件
     */
    private loadConfig;
    /**
     * 保存配置文件
     */
    private saveConfig;
    /**
     * 获取配置模板
     */
    static getConfigTemplate(provider: 'ollama' | 'gemini' | 'openai'): Partial<EmbeddingConfig>;
}
//# sourceMappingURL=EmbeddingManager.d.ts.map
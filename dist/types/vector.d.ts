import { z } from 'zod';
export interface VectorSearchResult {
    id: string;
    similarity: number;
    content: string;
    metadata?: Record<string, any>;
}
export type EmbeddingProviderType = 'ollama' | 'gemini' | 'openai';
export declare const EmbeddingConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["ollama", "gemini", "openai"]>;
    apiKey: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
    model: z.ZodString;
    dimensions: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    provider: "ollama" | "gemini" | "openai";
    model: string;
    timeout: number;
    maxRetries: number;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    dimensions?: number | undefined;
}, {
    provider: "ollama" | "gemini" | "openai";
    model: string;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    dimensions?: number | undefined;
    timeout?: number | undefined;
    maxRetries?: number | undefined;
}>;
export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;
export declare const VectorEntrySchema: z.ZodObject<{
    id: z.ZodString;
    embedding: z.ZodArray<z.ZodNumber, "many">;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    embedding: number[];
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    embedding: number[];
    metadata?: Record<string, any> | undefined;
}>;
export type VectorEntry = z.infer<typeof VectorEntrySchema>;
export declare const VectorSearchParamsSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    threshold: z.ZodDefault<z.ZodNumber>;
    includeMetadata: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    threshold: number;
    includeMetadata: boolean;
}, {
    query: string;
    limit?: number | undefined;
    threshold?: number | undefined;
    includeMetadata?: boolean | undefined;
}>;
export type VectorSearchParams = z.infer<typeof VectorSearchParamsSchema>;
export interface EmbeddingResult {
    embedding: number[];
    dimensions: number;
    model: string;
    provider: string;
}
export interface EmbeddingProvider {
    readonly name: string;
    readonly model: string;
    readonly dimensions: number;
    /**
     * 检查提供商是否已正确配置
     */
    isConfigured(): boolean;
    /**
     * 生成文本的嵌入向量
     */
    generateEmbedding(text: string): Promise<EmbeddingResult>;
    /**
     * 批量生成嵌入向量
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
}
export interface VectorStore {
    /**
     * 添加向量
     */
    addVector(id: string, embedding: number[], content: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * 搜索相似向量
     */
    searchSimilar(queryEmbedding: number[], limit: number, threshold?: number): Promise<VectorSearchResult[]>;
    /**
     * 移除向量
     */
    removeVector(id: string): Promise<boolean>;
    /**
     * 更新向量
     */
    updateVector(id: string, embedding: number[], content: string, metadata?: Record<string, any>): Promise<boolean>;
    /**
     * 获取向量
     */
    getVector(id: string): Promise<VectorEntry | null>;
    /**
     * 获取所有向量ID
     */
    getAllVectorIds(): Promise<string[]>;
    /**
     * 获取向量数量
     */
    getVectorCount(): Promise<number>;
    /**
     * 清空所有向量
     */
    clear(): Promise<void>;
    /**
     * 保存到文件
     */
    save(): Promise<void>;
    /**
     * 从文件加载
     */
    load(): Promise<void>;
}
export interface VectorStats {
    totalVectors: number;
    averageDimensions: number;
    storageSize: number;
    lastUpdated: string;
    provider?: string;
    model?: string;
}
export declare const SemanticSearchOptionsSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    threshold: z.ZodDefault<z.ZodNumber>;
    includeContent: z.ZodDefault<z.ZodBoolean>;
    includeMetadata: z.ZodDefault<z.ZodBoolean>;
    hybridSearch: z.ZodDefault<z.ZodBoolean>;
    keywordWeight: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    threshold: number;
    includeMetadata: boolean;
    includeContent: boolean;
    hybridSearch: boolean;
    keywordWeight: number;
}, {
    query: string;
    limit?: number | undefined;
    threshold?: number | undefined;
    includeMetadata?: boolean | undefined;
    includeContent?: boolean | undefined;
    hybridSearch?: boolean | undefined;
    keywordWeight?: number | undefined;
}>;
export type SemanticSearchOptions = z.infer<typeof SemanticSearchOptionsSchema>;
export interface VectorApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    vectorStats?: VectorStats;
}
//# sourceMappingURL=vector.d.ts.map
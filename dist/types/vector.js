import { z } from 'zod';
// 嵌入配置
export const EmbeddingConfigSchema = z.object({
    provider: z.enum(['ollama', 'gemini', 'openai']),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    model: z.string(),
    dimensions: z.number().int().positive().optional(),
    timeout: z.number().int().positive().default(30000), // 30秒超时
    maxRetries: z.number().int().nonnegative().default(3),
});
// 向量条目
export const VectorEntrySchema = z.object({
    id: z.string().uuid(),
    embedding: z.array(z.number()),
    content: z.string(),
    metadata: z.record(z.any()).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
// 向量搜索参数
export const VectorSearchParamsSchema = z.object({
    query: z.string().min(1),
    limit: z.number().int().positive().default(10),
    threshold: z.number().min(0).max(1).default(0.7), // 相似度阈值
    includeMetadata: z.boolean().default(true),
});
// 语义搜索选项
export const SemanticSearchOptionsSchema = z.object({
    query: z.string().min(1),
    limit: z.number().int().positive().default(10),
    threshold: z.number().min(0).max(1).default(0.7),
    includeContent: z.boolean().default(true),
    includeMetadata: z.boolean().default(true),
    hybridSearch: z.boolean().default(false), // 是否结合关键词搜索
    keywordWeight: z.number().min(0).max(1).default(0.3), // 关键词搜索权重
});
//# sourceMappingURL=vector.js.map
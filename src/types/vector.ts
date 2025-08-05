import { z } from 'zod';

// 向量搜索结果
export interface VectorSearchResult {
  id: string;
  similarity: number;
  content: string;
  metadata?: Record<string, any>;
}

// 嵌入提供商类型
export type EmbeddingProviderType = 'ollama' | 'gemini' | 'openai';

// 嵌入配置
export const EmbeddingConfigSchema = z.object({
  provider: z.enum(['ollama', 'gemini', 'openai']),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string(),
  dimensions: z.number().int().positive().optional(),
  timeout: z.number().int().positive().default(30000), // 30秒超时
  maxRetries: z.number().int().nonnegative().default(3)
});

export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;

// 向量条目
export const VectorEntrySchema = z.object({
  id: z.string().uuid(),
  embedding: z.array(z.number()),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type VectorEntry = z.infer<typeof VectorEntrySchema>;

// 向量搜索参数
export const VectorSearchParamsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
  threshold: z.number().min(0).max(1).default(0.7), // 相似度阈值
  includeMetadata: z.boolean().default(true)
});

export type VectorSearchParams = z.infer<typeof VectorSearchParamsSchema>;

// 嵌入生成结果
export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  provider: string;
}

// 嵌入提供商接口
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

// 向量存储接口
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

// 向量统计信息
export interface VectorStats {
  totalVectors: number;
  averageDimensions: number;
  storageSize: number;
  lastUpdated: string;
  provider?: string;
  model?: string;
}

// 语义搜索选项
export const SemanticSearchOptionsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  includeContent: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
  hybridSearch: z.boolean().default(false), // 是否结合关键词搜索
  keywordWeight: z.number().min(0).max(1).default(0.3) // 关键词搜索权重
});

export type SemanticSearchOptions = z.infer<typeof SemanticSearchOptionsSchema>;

// API响应类型扩展
export interface VectorApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  vectorStats?: VectorStats;
}

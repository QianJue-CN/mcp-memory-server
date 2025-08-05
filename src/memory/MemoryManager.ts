import { v4 as uuidv4 } from 'uuid';
import {
  MemoryEntry,
  MemoryType,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryFilter,
  StorageConfig,
  ApiResponse,
  MemoryStats,
  CreateMemoryInputSchema,
  UpdateMemoryInputSchema,
  MemoryFilterSchema,
  MemoryEntrySchema
} from '../types/memory.js';
import {
  VectorSearchResult,
  VectorStats,
  SemanticSearchOptions,
  VectorApiResponse
} from '../types/vector.js';
import { FileManager } from '../utils/FileManager.js';
import { MemoryCache } from '../utils/MemoryCache.js';
import { MemoryIndex } from '../utils/MemoryIndex.js';
import { logger } from '../utils/Logger.js';
import { performanceMonitor, PerformanceMetrics, SystemMetrics } from '../utils/PerformanceMonitor.js';
import { EmbeddingManager } from '../embedding/EmbeddingManager.js';
import { MemoryVectorStore } from '../vector/VectorStore.js';
import { VectorUtils } from '../vector/VectorUtils.js';
import * as path from 'path';
import * as os from 'os';

export class MemoryManager {
  private fileManager: FileManager;
  private config: StorageConfig;
  private cache: MemoryCache;
  private index: MemoryIndex;
  private isInitialized: boolean = false;

  // 向量相关属性
  private embeddingManager: EmbeddingManager;
  private vectorStore: MemoryVectorStore;
  private vectorEnabled: boolean = false;

  constructor(storagePath?: string, cacheSize: number = 1000) {
    // 默认存储路径
    const defaultStoragePath = storagePath || path.join(os.homedir(), '.mcp-memory');

    this.config = {
      storagePath: defaultStoragePath,
      globalMemoryFile: 'global_memories.json',
      conversationFilePrefix: 'conversation_',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      backupEnabled: true
    };

    this.fileManager = new FileManager(this.config);
    this.cache = new MemoryCache(cacheSize);
    this.index = new MemoryIndex();

    // 初始化向量相关组件
    this.embeddingManager = new EmbeddingManager(
      path.join(defaultStoragePath, 'embedding-config.json')
    );
    this.vectorStore = new MemoryVectorStore(
      path.join(defaultStoragePath, 'vectors.json')
    );
  }

  /**
   * 初始化记忆管理器（加载现有记忆到缓存和索引）
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const timer = performanceMonitor.startTimer('initialize_memory_manager');

    try {
      logger.info('Initializing memory manager', { storagePath: this.config.storagePath });

      // 加载所有现有记忆到缓存和索引
      const files = await this.fileManager.listMemoryFiles();
      let totalMemories = 0;

      for (const file of files) {
        const filePath = path.join(this.config.storagePath, file);
        const memories = await this.fileManager.readJsonFile<MemoryEntry>(filePath);

        for (const memory of memories) {
          this.cache.set(memory.id, memory);
          this.index.addMemory(memory);
          totalMemories++;
        }
      }

      // 初始化向量相关组件
      await this.embeddingManager.initialize();
      await this.vectorStore.load();
      this.vectorEnabled = this.embeddingManager.isConfigured();

      this.isInitialized = true;
      logger.info('Memory manager initialized successfully', {
        totalMemories,
        cacheSize: this.cache.size(),
        indexStats: this.index.getStats(),
        vectorEnabled: this.vectorEnabled,
        vectorCount: await this.vectorStore.getVectorCount()
      });
    } catch (error) {
      logger.error('Failed to initialize memory manager', error as Error);
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * 设置存储路径
   */
  async setStoragePath(storagePath: string): Promise<ApiResponse> {
    try {
      this.config.storagePath = storagePath;
      this.fileManager = new FileManager(this.config);
      await this.fileManager.ensureStorageDirectory();

      return {
        success: true,
        message: `Storage path set to: ${storagePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set storage path'
      };
    }
  }

  /**
   * 创建记忆
   */
  async createMemory(input: CreateMemoryInput): Promise<ApiResponse<MemoryEntry>> {
    const timer = performanceMonitor.startTimer('create_memory');

    try {
      await this.initialize();

      // 验证输入
      const validatedInput = CreateMemoryInputSchema.parse(input);

      logger.debug('Creating memory', {
        type: validatedInput.type,
        contentLength: validatedInput.content.length,
        tags: validatedInput.tags
      });

      // 创建记忆条目
      const now = new Date().toISOString();
      const memory: MemoryEntry = {
        id: uuidv4(),
        content: validatedInput.content,
        type: validatedInput.type,
        conversationId: validatedInput.conversationId,
        createdAt: now,
        updatedAt: now,
        tags: validatedInput.tags || [],
        metadata: validatedInput.metadata || {}
      };

      // 验证记忆条目
      MemoryEntrySchema.parse(memory);

      // 生成嵌入向量（如果启用）
      if (this.vectorEnabled) {
        try {
          const embeddingResult = await this.embeddingManager.generateEmbedding(memory.content);
          memory.embedding = embeddingResult.embedding;

          // 添加到向量存储
          await this.vectorStore.addVector(
            memory.id,
            embeddingResult.embedding,
            memory.content,
            {
              type: memory.type,
              conversationId: memory.conversationId,
              tags: memory.tags,
              createdAt: memory.createdAt
            }
          );

          logger.debug('Generated embedding for memory', {
            memoryId: memory.id,
            dimensions: embeddingResult.dimensions,
            provider: embeddingResult.provider
          });
        } catch (error) {
          logger.warn('Failed to generate embedding for memory, continuing without vector support', {
            memoryId: memory.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // 确定存储文件
      const filePath = this.getMemoryFilePath(memory);

      // 读取现有记忆
      const existingMemories = await this.fileManager.readJsonFile<MemoryEntry>(filePath);

      // 添加新记忆
      existingMemories.push(memory);

      // 保存到文件
      await this.fileManager.writeJsonFile(filePath, existingMemories);

      // 更新缓存和索引
      this.cache.set(memory.id, memory);
      this.index.addMemory(memory);

      logger.info('Memory created successfully', {
        memoryId: memory.id,
        type: memory.type,
        cacheSize: this.cache.size()
      });

      return {
        success: true,
        data: memory,
        message: 'Memory created successfully'
      };
    } catch (error) {
      logger.error('Failed to create memory', error as Error, { input });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create memory'
      };
    } finally {
      timer();
    }
  }

  /**
   * 读取记忆
   */
  async readMemories(filter?: MemoryFilter): Promise<ApiResponse<MemoryEntry[]>> {
    const timer = performanceMonitor.startTimer('read_memories');

    try {
      await this.initialize();

      // 验证过滤器
      const validatedFilter = filter ? MemoryFilterSchema.parse(filter) : {};

      logger.debug('Reading memories', { filter: validatedFilter });

      let filteredMemories: MemoryEntry[] = [];

      // 使用索引进行快速搜索
      if (this.hasSearchCriteria(validatedFilter)) {
        const memoryIds = this.index.search({
          searchText: validatedFilter.searchText,
          tags: validatedFilter.tags,
          type: validatedFilter.type,
          conversationId: validatedFilter.conversationId
        });

        // 从缓存中获取记忆
        for (const memoryId of memoryIds) {
          const memory = this.cache.get(memoryId);
          if (memory) {
            filteredMemories.push(memory);
          }
        }
      } else {
        // 如果没有搜索条件，从缓存获取所有记忆
        filteredMemories = this.cache.getAllEntries();

        // 应用基本过滤器
        if (validatedFilter.type) {
          filteredMemories = filteredMemories.filter(m => m.type === validatedFilter.type);
        }
        if (validatedFilter.conversationId) {
          filteredMemories = filteredMemories.filter(m => m.conversationId === validatedFilter.conversationId);
        }
      }

      // 按创建时间排序（最新的在前）
      filteredMemories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // 应用分页
      const totalResults = filteredMemories.length;
      if (validatedFilter.offset !== undefined) {
        filteredMemories = filteredMemories.slice(validatedFilter.offset);
      }
      if (validatedFilter.limit !== undefined) {
        filteredMemories = filteredMemories.slice(0, validatedFilter.limit);
      }

      logger.info('Memories read successfully', {
        totalResults,
        returnedResults: filteredMemories.length,
        cacheHitRate: this.cache.getStats().hitRate
      });

      return {
        success: true,
        data: filteredMemories,
        message: `Found ${filteredMemories.length} memories`
      };
    } catch (error) {
      logger.error('Failed to read memories', error as Error, { filter });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read memories'
      };
    } finally {
      timer();
    }
  }

  /**
   * 更新记忆
   */
  async updateMemory(memoryId: string, input: UpdateMemoryInput): Promise<ApiResponse<MemoryEntry>> {
    const timer = performanceMonitor.startTimer('update_memory');

    try {
      await this.initialize();

      // 验证输入
      const validatedInput = UpdateMemoryInputSchema.parse(input);

      logger.debug('Updating memory', { memoryId, input: validatedInput });

      // 先从缓存中查找记忆
      const oldMemory = this.cache.get(memoryId);
      if (!oldMemory) {
        return {
          success: false,
          error: 'Memory not found'
        };
      }

      // 更新记忆
      const updatedMemory: MemoryEntry = {
        ...oldMemory,
        content: validatedInput.content ?? oldMemory.content,
        tags: validatedInput.tags ?? oldMemory.tags,
        metadata: { ...oldMemory.metadata, ...validatedInput.metadata },
        updatedAt: new Date().toISOString()
      };

      // 验证更新后的记忆
      MemoryEntrySchema.parse(updatedMemory);

      // 确定存储文件
      const filePath = this.getMemoryFilePath(updatedMemory);

      // 读取文件中的所有记忆
      const memories = await this.fileManager.readJsonFile<MemoryEntry>(filePath);

      // 替换更新的记忆
      const updatedMemories = memories.map(m => m.id === memoryId ? updatedMemory : m);

      // 保存到文件
      await this.fileManager.writeJsonFile(filePath, updatedMemories);

      // 更新缓存和索引
      this.cache.set(memoryId, updatedMemory);
      this.index.updateMemory(oldMemory, updatedMemory);

      logger.info('Memory updated successfully', {
        memoryId,
        changes: Object.keys(validatedInput)
      });

      return {
        success: true,
        data: updatedMemory,
        message: 'Memory updated successfully'
      };
    } catch (error) {
      logger.error('Failed to update memory', error as Error, { memoryId, input });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update memory'
      };
    } finally {
      timer();
    }
  }

  /**
   * 删除记忆
   */
  async deleteMemory(memoryId: string): Promise<ApiResponse> {
    const timer = performanceMonitor.startTimer('delete_memory');

    try {
      await this.initialize();

      logger.debug('Deleting memory', { memoryId });

      // 先从缓存中查找记忆
      const memory = this.cache.get(memoryId);
      if (!memory) {
        return {
          success: false,
          error: 'Memory not found'
        };
      }

      // 确定存储文件
      const filePath = this.getMemoryFilePath(memory);

      // 读取文件中的所有记忆
      const memories = await this.fileManager.readJsonFile<MemoryEntry>(filePath);

      // 过滤掉要删除的记忆
      const filteredMemories = memories.filter(m => m.id !== memoryId);

      // 保存到文件
      await this.fileManager.writeJsonFile(filePath, filteredMemories);

      // 从缓存和索引中移除
      this.cache.delete(memoryId);
      this.index.removeMemory(memory);

      logger.info('Memory deleted successfully', {
        memoryId,
        type: memory.type,
        cacheSize: this.cache.size()
      });

      return {
        success: true,
        message: 'Memory deleted successfully'
      };
    } catch (error) {
      logger.error('Failed to delete memory', error as Error, { memoryId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete memory'
      };
    } finally {
      timer();
    }
  }

  /**
   * 获取记忆统计信息
   */
  async getMemoryStats(): Promise<ApiResponse<MemoryStats>> {
    try {
      const files = await this.fileManager.listMemoryFiles();
      let totalMemories = 0;
      let globalMemories = 0;
      let conversationMemories = 0;
      let temporaryMemories = 0;
      let storageSize = 0;

      for (const file of files) {
        const filePath = path.join(this.config.storagePath, file);
        const memories = await this.fileManager.readJsonFile<MemoryEntry>(filePath);
        const stats = await this.fileManager.getFileStats(filePath);

        storageSize += stats.size;
        totalMemories += memories.length;

        for (const memory of memories) {
          switch (memory.type) {
            case MemoryType.GLOBAL:
              globalMemories++;
              break;
            case MemoryType.CONVERSATION:
              conversationMemories++;
              break;
            case MemoryType.TEMPORARY:
              temporaryMemories++;
              break;
          }
        }
      }

      const stats: MemoryStats = {
        totalMemories,
        globalMemories,
        conversationMemories,
        temporaryMemories,
        storageSize
      };

      return {
        success: true,
        data: stats,
        message: 'Memory statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get memory statistics'
      };
    }
  }

  /**
   * 根据 ID 查找记忆
   */
  private async findMemoryById(memoryId: string): Promise<ApiResponse<{ memory: MemoryEntry; filePath: string }>> {
    try {
      const files = await this.fileManager.listMemoryFiles();

      for (const file of files) {
        const filePath = path.join(this.config.storagePath, file);
        const memories = await this.fileManager.readJsonFile<MemoryEntry>(filePath);

        const memory = memories.find(m => m.id === memoryId);
        if (memory) {
          return {
            success: true,
            data: { memory, filePath }
          };
        }
      }

      return {
        success: false,
        error: 'Memory not found'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find memory'
      };
    }
  }

  /**
   * 应用过滤器到记忆列表
   */
  private applyFilters(memories: MemoryEntry[], filter: MemoryFilter): MemoryEntry[] {
    let filtered = memories;

    // 按类型过滤
    if (filter.type) {
      filtered = filtered.filter(m => m.type === filter.type);
    }

    // 按对话 ID 过滤
    if (filter.conversationId) {
      filtered = filtered.filter(m => m.conversationId === filter.conversationId);
    }

    // 按标签过滤
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(m =>
        filter.tags!.some(tag => m.tags?.includes(tag))
      );
    }

    // 按搜索文本过滤
    if (filter.searchText) {
      const searchText = filter.searchText.toLowerCase();
      filtered = filtered.filter(m =>
        m.content.toLowerCase().includes(searchText) ||
        m.tags?.some(tag => tag.toLowerCase().includes(searchText))
      );
    }

    // 按创建时间排序（最新的在前）
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }

  /**
   * 获取记忆文件路径
   */
  private getMemoryFilePath(memory: MemoryEntry): string {
    if (memory.type === MemoryType.GLOBAL) {
      return this.fileManager.getGlobalMemoryFilePath();
    } else if (memory.conversationId) {
      return this.fileManager.getConversationMemoryFilePath(memory.conversationId);
    } else {
      // 默认使用全局文件
      return this.fileManager.getGlobalMemoryFilePath();
    }
  }

  /**
   * 清理旧的对话记忆
   */
  async cleanupOldConversations(maxAge?: number): Promise<ApiResponse<number>> {
    try {
      const deletedCount = await this.fileManager.cleanupOldConversations(maxAge);
      return {
        success: true,
        data: deletedCount,
        message: `Cleaned up ${deletedCount} old conversation files`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup old conversations'
      };
    }
  }

  /**
   * 检查是否有搜索条件
   */
  private hasSearchCriteria(filter: MemoryFilter): boolean {
    return !!(
      filter.searchText ||
      (filter.tags && filter.tags.length > 0) ||
      filter.type ||
      filter.conversationId
    );
  }

  /**
   * 获取增强的记忆统计信息
   */
  async getEnhancedStats(): Promise<ApiResponse<{
    memoryStats: MemoryStats;
    cacheStats: {
      size: number;
      maxSize: number;
      hitCount: number;
      missCount: number;
      hitRate: number;
    };
    indexStats: {
      contentTerms: number;
      tags: number;
      types: number;
      conversations: number;
      metadataKeys: number;
      dates: number;
    };
    performanceStats: {
      totalOperations: number;
      uniqueOperations: number;
      averageOperationTime: number;
      slowestOperation: PerformanceMetrics | null;
      fastestOperation: PerformanceMetrics | null;
      mostFrequentOperation: PerformanceMetrics | null;
      systemMetrics: SystemMetrics;
    };
  }>> {
    try {
      await this.initialize();

      const memoryStatsResult = await this.getMemoryStats();
      if (!memoryStatsResult.success) {
        return memoryStatsResult as any;
      }

      return {
        success: true,
        data: {
          memoryStats: memoryStatsResult.data!,
          cacheStats: this.cache.getStats(),
          indexStats: this.index.getStats(),
          performanceStats: performanceMonitor.getPerformanceSummary()
        },
        message: 'Enhanced statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get enhanced statistics'
      };
    }
  }

  // ==================== 向量相关方法 ====================

  /**
   * 配置嵌入提供商
   */
  async configureEmbedding(config: any): Promise<VectorApiResponse> {
    try {
      await this.embeddingManager.configure(config);
      this.vectorEnabled = true;

      return {
        success: true,
        message: `Successfully configured ${config.provider} embedding provider`,
        data: this.embeddingManager.getProviderInfo()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to configure embedding provider'
      };
    }
  }

  /**
   * 语义搜索记忆
   */
  async semanticSearch(options: SemanticSearchOptions): Promise<VectorApiResponse<VectorSearchResult[]>> {
    try {
      await this.initialize();

      if (!this.vectorEnabled) {
        return {
          success: false,
          error: 'Vector search is not enabled. Please configure an embedding provider first.'
        };
      }

      // 生成查询向量
      const embeddingResult = await this.embeddingManager.generateEmbedding(options.query);

      // 搜索相似向量
      const vectorResults = await this.vectorStore.searchSimilar(
        embeddingResult.embedding,
        options.limit,
        options.threshold
      );

      // 如果启用混合搜索，结合关键词搜索结果
      if (options.hybridSearch) {
        const keywordResults = await this.readMemories({
          searchText: options.query,
          limit: Math.ceil(options.limit * 0.5)
        });

        if (keywordResults.success && keywordResults.data) {
          // 合并结果并去重
          const combinedResults = this.combineSearchResults(
            vectorResults,
            keywordResults.data,
            options.keywordWeight
          );

          return {
            success: true,
            data: combinedResults.slice(0, options.limit),
            message: `Found ${combinedResults.length} memories using hybrid search`
          };
        }
      }

      return {
        success: true,
        data: vectorResults,
        message: `Found ${vectorResults.length} similar memories`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform semantic search'
      };
    }
  }

  /**
   * 为现有记忆生成嵌入向量
   */
  async generateEmbeddingsForExistingMemories(): Promise<VectorApiResponse<{ processed: number; failed: number }>> {
    try {
      await this.initialize();

      if (!this.vectorEnabled) {
        return {
          success: false,
          error: 'Vector generation is not enabled. Please configure an embedding provider first.'
        };
      }

      let processed = 0;
      let failed = 0;

      // 获取所有记忆
      const allMemoriesResult = await this.readMemories({ limit: 10000 });
      if (!allMemoriesResult.success || !allMemoriesResult.data) {
        return {
          success: false,
          error: 'Failed to retrieve existing memories'
        };
      }

      const memories = allMemoriesResult.data;
      logger.info(`Starting to generate embeddings for ${memories.length} existing memories`);

      // 批量处理记忆
      const batchSize = 10;
      for (let i = 0; i < memories.length; i += batchSize) {
        const batch = memories.slice(i, i + batchSize);

        for (const memory of batch) {
          try {
            // 跳过已有嵌入向量的记忆
            if (memory.embedding) {
              continue;
            }

            // 生成嵌入向量
            const embeddingResult = await this.embeddingManager.generateEmbedding(memory.content);

            // 更新记忆
            memory.embedding = embeddingResult.embedding;
            memory.updatedAt = new Date().toISOString();

            // 添加到向量存储
            await this.vectorStore.addVector(
              memory.id,
              embeddingResult.embedding,
              memory.content,
              {
                type: memory.type,
                conversationId: memory.conversationId,
                tags: memory.tags,
                createdAt: memory.createdAt
              }
            );

            // 更新缓存
            this.cache.set(memory.id, memory);

            processed++;
          } catch (error) {
            logger.error(`Failed to generate embedding for memory ${memory.id}:`, error as Error);
            failed++;
          }
        }

        // 保存进度
        await this.vectorStore.save();
        logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(memories.length / batchSize)}`);
      }

      return {
        success: true,
        data: { processed, failed },
        message: `Generated embeddings for ${processed} memories, ${failed} failed`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate embeddings for existing memories'
      };
    }
  }

  /**
   * 获取向量统计信息
   */
  async getVectorStats(): Promise<VectorApiResponse<VectorStats>> {
    try {
      if (!this.vectorEnabled) {
        return {
          success: false,
          error: 'Vector functionality is not enabled'
        };
      }

      const stats = await this.vectorStore.getStats();
      const providerInfo = this.embeddingManager.getProviderInfo();

      return {
        success: true,
        data: {
          ...stats,
          provider: providerInfo?.name,
          model: providerInfo?.model
        },
        message: 'Vector statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get vector statistics'
      };
    }
  }

  /**
   * 计算两个文本的相似度
   */
  async calculateSimilarity(text1: string, text2: string): Promise<VectorApiResponse<{ similarity: number }>> {
    try {
      if (!this.vectorEnabled) {
        return {
          success: false,
          error: 'Vector functionality is not enabled'
        };
      }

      const [embedding1, embedding2] = await Promise.all([
        this.embeddingManager.generateEmbedding(text1),
        this.embeddingManager.generateEmbedding(text2)
      ]);

      const similarity = VectorUtils.cosineSimilarity(embedding1.embedding, embedding2.embedding);

      return {
        success: true,
        data: { similarity },
        message: 'Similarity calculated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate similarity'
      };
    }
  }

  /**
   * 合并向量搜索和关键词搜索结果
   */
  private combineSearchResults(
    vectorResults: VectorSearchResult[],
    keywordResults: MemoryEntry[],
    keywordWeight: number
  ): VectorSearchResult[] {
    const combined = new Map<string, VectorSearchResult>();

    // 添加向量搜索结果
    for (const result of vectorResults) {
      combined.set(result.id, {
        ...result,
        similarity: result.similarity * (1 - keywordWeight)
      });
    }

    // 添加关键词搜索结果
    for (const memory of keywordResults) {
      const existing = combined.get(memory.id);
      if (existing) {
        // 如果已存在，增加权重
        existing.similarity += keywordWeight;
      } else {
        // 新结果，使用关键词权重作为相似度
        combined.set(memory.id, {
          id: memory.id,
          similarity: keywordWeight,
          content: memory.content,
          metadata: {
            type: memory.type,
            conversationId: memory.conversationId,
            tags: memory.tags,
            createdAt: memory.createdAt
          }
        });
      }
    }

    // 按相似度排序
    return Array.from(combined.values()).sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 检查向量功能是否启用
   */
  isVectorEnabled(): boolean {
    return this.vectorEnabled;
  }

  /**
   * 获取嵌入提供商信息
   */
  getEmbeddingProviderInfo(): any {
    return this.embeddingManager.getProviderInfo();
  }
}

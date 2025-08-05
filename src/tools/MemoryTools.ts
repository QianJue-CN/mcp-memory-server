import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { MemoryType, CreateMemoryInput, UpdateMemoryInput, MemoryFilter } from '../types/memory.js';

export class MemoryTools {
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  /**
   * 获取所有工具定义
   */
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'create_memory',
        description: 'Create a new memory entry with specified content and type',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The content of the memory to store',
            },
            type: {
              type: 'string',
              enum: ['global', 'conversation', 'temporary'],
              description: 'The type of memory (global, conversation, or temporary)',
              default: 'conversation',
            },
            conversationId: {
              type: 'string',
              description: 'The conversation ID for conversation-type memories (optional)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional tags for categorizing the memory',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata object for additional information',
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'read_memories',
        description: 'Read memories with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['global', 'conversation', 'temporary'],
              description: 'Filter by memory type',
            },
            conversationId: {
              type: 'string',
              description: 'Filter by conversation ID',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags (memories containing any of these tags)',
            },
            searchText: {
              type: 'string',
              description: 'Search text to filter memories by content or tags',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of memories to return',
              minimum: 1,
            },
            offset: {
              type: 'number',
              description: 'Number of memories to skip (for pagination)',
              minimum: 0,
            },
          },
        },
      },
      {
        name: 'update_memory',
        description: 'Update an existing memory entry',
        inputSchema: {
          type: 'object',
          properties: {
            memoryId: {
              type: 'string',
              description: 'The UUID of the memory to update',
            },
            content: {
              type: 'string',
              description: 'New content for the memory',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'New tags for the memory',
            },
            metadata: {
              type: 'object',
              description: 'New metadata for the memory (will be merged with existing)',
            },
          },
          required: ['memoryId'],
        },
      },
      {
        name: 'delete_memory',
        description: 'Delete a memory entry by ID',
        inputSchema: {
          type: 'object',
          properties: {
            memoryId: {
              type: 'string',
              description: 'The UUID of the memory to delete',
            },
          },
          required: ['memoryId'],
        },
      },
      {
        name: 'set_storage_path',
        description: 'Set the storage path for memory files',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file system path where memory files should be stored',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'get_memory_stats',
        description: 'Get statistics about stored memories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cleanup_old_conversations',
        description: 'Clean up old conversation memory files',
        inputSchema: {
          type: 'object',
          properties: {
            maxAge: {
              type: 'number',
              description: 'Maximum age in milliseconds (default: 30 days)',
              default: 2592000000,
            },
          },
        },
      },
      {
        name: 'list_memories',
        description:
          'List memories with smart filtering - combines current conversation and global memories for quick access',
        inputSchema: {
          type: 'object',
          properties: {
            conversationId: {
              type: 'string',
              description: 'Current conversation ID to include conversation-specific memories',
            },
            query: {
              type: 'string',
              description: 'Search query to filter memories by content, tags, or metadata',
            },
            includeGlobal: {
              type: 'boolean',
              description: 'Whether to include global memories (default: true)',
              default: true,
            },
            includeConversation: {
              type: 'boolean',
              description: 'Whether to include conversation memories (default: true)',
              default: true,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of memories to return (default: 20)',
              default: 20,
              minimum: 1,
              maximum: 100,
            },
            sortBy: {
              type: 'string',
              enum: ['relevance', 'date', 'type'],
              description: 'Sort memories by relevance, date, or type (default: relevance)',
              default: 'relevance',
            },
          },
        },
      },
      {
        name: 'query_memories',
        description:
          'Advanced query interface for finding specific memories with detailed filtering',
        inputSchema: {
          type: 'object',
          properties: {
            searchText: {
              type: 'string',
              description: 'Text to search for in memory content and tags',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tags (memories containing any of these tags)',
            },
            type: {
              type: 'string',
              enum: ['global', 'conversation', 'temporary'],
              description: 'Filter by memory type',
            },
            conversationId: {
              type: 'string',
              description: 'Filter by specific conversation ID',
            },
            dateRange: {
              type: 'object',
              properties: {
                from: {
                  type: 'string',
                  description: 'Start date (ISO 8601 format)',
                },
                to: {
                  type: 'string',
                  description: 'End date (ISO 8601 format)',
                },
              },
              description: 'Filter by date range',
            },
            metadata: {
              type: 'object',
              description: 'Filter by metadata key-value pairs',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
              default: 50,
              minimum: 1,
              maximum: 200,
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip for pagination (default: 0)',
              default: 0,
              minimum: 0,
            },
          },
        },
      },
      {
        name: 'get_enhanced_stats',
        description:
          'Get comprehensive statistics including memory, cache, index, and performance metrics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'configure_embedding',
        description: 'Configure embedding provider for vector search functionality',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: ['ollama', 'gemini', 'openai'],
              description: 'The embedding provider to use',
            },
            apiKey: {
              type: 'string',
              description: 'API key for the provider (required for gemini and openai)',
            },
            baseUrl: {
              type: 'string',
              description:
                'Base URL for the provider API (required for ollama, optional for others)',
            },
            model: {
              type: 'string',
              description: 'Model name to use for embeddings',
            },
            dimensions: {
              type: 'number',
              description: 'Embedding dimensions (optional, will be auto-detected if not provided)',
            },
            timeout: {
              type: 'number',
              description: 'Request timeout in milliseconds (default: 30000)',
              default: 30000,
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retries for failed requests (default: 3)',
              default: 3,
            },
          },
          required: ['provider', 'model'],
        },
      },
      {
        name: 'semantic_search',
        description:
          'Search memories using semantic similarity based on meaning rather than exact keywords',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query text',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
              default: 10,
              minimum: 1,
              maximum: 50,
            },
            threshold: {
              type: 'number',
              description: 'Minimum similarity threshold (0-1, default: 0.7)',
              default: 0.7,
              minimum: 0,
              maximum: 1,
            },
            includeContent: {
              type: 'boolean',
              description: 'Whether to include full content in results (default: true)',
              default: true,
            },
            includeMetadata: {
              type: 'boolean',
              description: 'Whether to include metadata in results (default: true)',
              default: true,
            },
            hybridSearch: {
              type: 'boolean',
              description: 'Whether to combine semantic and keyword search (default: false)',
              default: false,
            },
            keywordWeight: {
              type: 'number',
              description: 'Weight for keyword search in hybrid mode (0-1, default: 0.3)',
              default: 0.3,
              minimum: 0,
              maximum: 1,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'generate_embeddings',
        description: "Generate embedding vectors for existing memories that don't have them",
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'calculate_similarity',
        description: 'Calculate semantic similarity between two text strings',
        inputSchema: {
          type: 'object',
          properties: {
            text1: {
              type: 'string',
              description: 'First text to compare',
            },
            text2: {
              type: 'string',
              description: 'Second text to compare',
            },
          },
          required: ['text1', 'text2'],
        },
      },
      {
        name: 'get_vector_stats',
        description: 'Get statistics about the vector store and embedding configuration',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * 调用指定的工具
   */
  async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'create_memory':
        return this.createMemory(args);

      case 'read_memories':
        return this.readMemories(args);

      case 'update_memory':
        return this.updateMemory(args);

      case 'delete_memory':
        return this.deleteMemory(args);

      case 'set_storage_path':
        return this.setStoragePath(args);

      case 'get_memory_stats':
        return this.getMemoryStats();

      case 'cleanup_old_conversations':
        return this.cleanupOldConversations(args);

      case 'list_memories':
        return this.listMemories(args);

      case 'query_memories':
        return this.queryMemories(args);

      case 'get_enhanced_stats':
        return this.getEnhancedStats();

      case 'configure_embedding':
        return this.configureEmbedding(args);

      case 'semantic_search':
        return this.semanticSearch(args);

      case 'generate_embeddings':
        return this.generateEmbeddings();

      case 'calculate_similarity':
        return this.calculateSimilarity(args);

      case 'get_vector_stats':
        return this.getVectorStats();

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * 创建记忆工具实现
   */
  private async createMemory(args: any) {
    const input: CreateMemoryInput = {
      content: args.content,
      type: args.type ? (args.type as MemoryType) : MemoryType.CONVERSATION,
      conversationId: args.conversationId,
      tags: args.tags,
      metadata: args.metadata,
    };

    return await this.memoryManager.createMemory(input);
  }

  /**
   * 读取记忆工具实现
   */
  private async readMemories(args: any) {
    const filter: MemoryFilter = {
      type: args.type ? (args.type as MemoryType) : undefined,
      conversationId: args.conversationId,
      tags: args.tags,
      searchText: args.searchText,
      limit: args.limit,
      offset: args.offset,
    };

    return await this.memoryManager.readMemories(filter);
  }

  /**
   * 更新记忆工具实现
   */
  private async updateMemory(args: any) {
    const { memoryId, ...updateData } = args;
    const input: UpdateMemoryInput = {
      content: updateData.content,
      tags: updateData.tags,
      metadata: updateData.metadata,
    };

    return await this.memoryManager.updateMemory(memoryId, input);
  }

  /**
   * 删除记忆工具实现
   */
  private async deleteMemory(args: any) {
    return await this.memoryManager.deleteMemory(args.memoryId);
  }

  /**
   * 设置存储路径工具实现
   */
  private async setStoragePath(args: any) {
    return await this.memoryManager.setStoragePath(args.path);
  }

  /**
   * 获取记忆统计工具实现
   */
  private async getMemoryStats() {
    return await this.memoryManager.getMemoryStats();
  }

  /**
   * 清理旧对话工具实现
   */
  private async cleanupOldConversations(args: any) {
    return await this.memoryManager.cleanupOldConversations(args.maxAge);
  }

  /**
   * 列出记忆工具实现 - 智能过滤当前对话和全局记忆
   */
  private async listMemories(args: any) {
    const {
      conversationId,
      query,
      includeGlobal = true,
      includeConversation = true,
      limit = 20,
      sortBy = 'relevance',
    } = args;

    try {
      let allMemories: any[] = [];

      // 获取全局记忆
      if (includeGlobal) {
        const globalResult = await this.memoryManager.readMemories({
          type: MemoryType.GLOBAL,
          searchText: query,
          limit: Math.ceil(limit / 2),
        });
        if (globalResult.success && globalResult.data) {
          allMemories.push(...globalResult.data);
        }
      }

      // 获取对话记忆
      if (includeConversation && conversationId) {
        const convResult = await this.memoryManager.readMemories({
          type: MemoryType.CONVERSATION,
          conversationId,
          searchText: query,
          limit: Math.ceil(limit / 2),
        });
        if (convResult.success && convResult.data) {
          allMemories.push(...convResult.data);
        }
      }

      // 排序
      if (sortBy === 'date') {
        allMemories.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      } else if (sortBy === 'type') {
        allMemories.sort((a, b) => a.type.localeCompare(b.type));
      }
      // 'relevance' 排序已经由搜索功能处理

      // 限制结果数量
      allMemories = allMemories.slice(0, limit);

      return {
        success: true,
        data: allMemories,
        message: `Found ${allMemories.length} memories`,
        metadata: {
          includeGlobal,
          includeConversation,
          conversationId,
          query,
          sortBy,
          totalResults: allMemories.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list memories',
      };
    }
  }

  /**
   * 高级查询记忆工具实现
   */
  private async queryMemories(args: any) {
    const {
      searchText,
      tags,
      type,
      conversationId,
      dateRange,
      metadata,
      limit = 50,
      offset = 0,
    } = args;

    try {
      // 构建过滤器
      const filter: MemoryFilter = {
        searchText,
        tags,
        type: type ? (type as MemoryType) : undefined,
        conversationId,
        limit,
        offset,
      };

      // 获取记忆
      const result = await this.memoryManager.readMemories(filter);

      if (!result.success || !result.data) {
        return result;
      }

      let filteredMemories = result.data;

      // 应用日期范围过滤
      if (dateRange) {
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        filteredMemories = filteredMemories.filter((memory) => {
          const memoryDate = new Date(memory.createdAt);
          if (fromDate && memoryDate < fromDate) return false;
          if (toDate && memoryDate > toDate) return false;
          return true;
        });
      }

      // 应用元数据过滤
      if (metadata && typeof metadata === 'object') {
        filteredMemories = filteredMemories.filter((memory) => {
          if (!memory.metadata) return false;

          for (const [key, value] of Object.entries(metadata)) {
            if (memory.metadata[key] !== value) return false;
          }
          return true;
        });
      }

      return {
        success: true,
        data: filteredMemories,
        message: `Found ${filteredMemories.length} memories matching query`,
        metadata: {
          searchText,
          tags,
          type,
          conversationId,
          dateRange,
          appliedMetadataFilter: !!metadata,
          totalResults: filteredMemories.length,
          offset,
          limit,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query memories',
      };
    }
  }

  /**
   * 获取增强统计信息工具实现
   */
  private async getEnhancedStats() {
    return await this.memoryManager.getEnhancedStats();
  }

  // ==================== 向量相关工具实现 ====================

  /**
   * 配置嵌入提供商工具实现
   */
  private async configureEmbedding(args: any) {
    try {
      const config = {
        provider: args.provider,
        apiKey: args.apiKey,
        baseUrl: args.baseUrl,
        model: args.model,
        dimensions: args.dimensions,
        timeout: args.timeout || 30000,
        maxRetries: args.maxRetries || 3,
      };

      return await this.memoryManager.configureEmbedding(config);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to configure embedding provider',
      };
    }
  }

  /**
   * 语义搜索工具实现
   */
  private async semanticSearch(args: any) {
    try {
      const options = {
        query: args.query,
        limit: args.limit || 10,
        threshold: args.threshold || 0.7,
        includeContent: args.includeContent !== false,
        includeMetadata: args.includeMetadata !== false,
        hybridSearch: args.hybridSearch || false,
        keywordWeight: args.keywordWeight || 0.3,
      };

      return await this.memoryManager.semanticSearch(options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform semantic search',
      };
    }
  }

  /**
   * 生成嵌入向量工具实现
   */
  private async generateEmbeddings() {
    try {
      return await this.memoryManager.generateEmbeddingsForExistingMemories();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate embeddings',
      };
    }
  }

  /**
   * 计算相似度工具实现
   */
  private async calculateSimilarity(args: any) {
    try {
      const { text1, text2 } = args;

      if (!text1 || !text2) {
        return {
          success: false,
          error: 'Both text1 and text2 are required',
        };
      }

      return await this.memoryManager.calculateSimilarity(text1, text2);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate similarity',
      };
    }
  }

  /**
   * 获取向量统计信息工具实现
   */
  private async getVectorStats() {
    try {
      return await this.memoryManager.getVectorStats();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get vector statistics',
      };
    }
  }
}

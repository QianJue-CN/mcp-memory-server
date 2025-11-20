import { v4 as uuidv4 } from 'uuid';
import { MemoryType, CreateMemoryInputSchema, UpdateMemoryInputSchema, MemoryFilterSchema, MemoryEntrySchema, CreateFolderInputSchema, RenameFolderInputSchema, DeleteFolderInputSchema, } from '../types/memory.js';
import { FileManager } from '../utils/FileManager.js';
import { MemoryCache } from '../utils/MemoryCache.js';
import { MemoryIndex } from '../utils/MemoryIndex.js';
import { logger } from '../utils/Logger.js';
import { performanceMonitor, } from '../utils/PerformanceMonitor.js';
import { EmbeddingManager } from '../embedding/EmbeddingManager.js';
import { MemoryVectorStore } from '../vector/VectorStore.js';
import { VectorUtils } from '../vector/VectorUtils.js';
import * as path from 'path';
import * as os from 'os';
export class MemoryManager {
    fileManager;
    config;
    cache;
    index;
    isInitialized = false;
    // 向量相关属性
    embeddingManager;
    vectorStore;
    vectorEnabled = false;
    constructor(storagePath, cacheSize = 1000) {
        // 默认存储路径
        const defaultStoragePath = storagePath || path.join(os.homedir(), '.mcp-memory');
        this.config = {
            storagePath: defaultStoragePath,
            globalMemoryFile: 'global_memories.json',
            conversationFilePrefix: 'conversation_',
            maxFileSize: 10 * 1024 * 1024, // 10MB
            backupEnabled: true,
        };
        this.fileManager = new FileManager(this.config);
        this.cache = new MemoryCache(cacheSize);
        this.index = new MemoryIndex();
        // 初始化向量相关组件
        this.embeddingManager = new EmbeddingManager(path.join(defaultStoragePath, 'embedding-config.json'));
        this.vectorStore = new MemoryVectorStore(path.join(defaultStoragePath, 'vectors.json'));
    }
    /**
     * 初始化记忆管理器（加载现有记忆到缓存和索引）
     */
    async initialize() {
        if (this.isInitialized)
            return;
        const timer = performanceMonitor.startTimer('initialize_memory_manager');
        try {
            logger.info('Initializing memory manager', { storagePath: this.config.storagePath });
            // 加载所有现有记忆到缓存和索引
            const files = await this.fileManager.listMemoryFiles();
            let totalMemories = 0;
            for (const file of files) {
                const filePath = path.join(this.config.storagePath, file);
                const memories = await this.fileManager.readJsonFile(filePath);
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
                vectorCount: await this.vectorStore.getVectorCount(),
            });
        }
        catch (error) {
            logger.error('Failed to initialize memory manager', error);
            throw error;
        }
        finally {
            timer();
        }
    }
    /**
     * 设置存储路径
     */
    async setStoragePath(storagePath) {
        try {
            this.config.storagePath = storagePath;
            this.fileManager = new FileManager(this.config);
            await this.fileManager.ensureStorageDirectory();
            return {
                success: true,
                message: `Storage path set to: ${storagePath}`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to set storage path',
            };
        }
    }
    /**
     * 创建记忆
     */
    async createMemory(input) {
        const timer = performanceMonitor.startTimer('create_memory');
        try {
            await this.initialize();
            // 验证输入
            const validatedInput = CreateMemoryInputSchema.parse(input);
            logger.debug('Creating memory', {
                type: validatedInput.type,
                contentLength: validatedInput.content.length,
                tags: validatedInput.tags,
            });
            // 创建记忆条目
            const now = new Date().toISOString();
            const memory = {
                id: uuidv4(),
                content: validatedInput.content,
                type: validatedInput.type,
                conversationId: validatedInput.conversationId,
                createdAt: now,
                updatedAt: now,
                tags: validatedInput.tags || [],
                metadata: validatedInput.metadata || {},
            };
            // 如果不是全局记忆,且 metadata 中包含 folderPath,则标注文件夹
            // 全局记忆不需要文件夹标注
            if (memory.type !== MemoryType.GLOBAL &&
                memory.metadata?.folderPath &&
                typeof memory.metadata.folderPath === 'string') {
                logger.debug('Memory assigned to folder', {
                    memoryId: memory.id,
                    folderPath: memory.metadata.folderPath,
                });
            }
            // 验证记忆条目
            MemoryEntrySchema.parse(memory);
            // 生成嵌入向量（如果启用）
            if (this.vectorEnabled) {
                try {
                    const embeddingResult = await this.embeddingManager.generateEmbedding(memory.content);
                    memory.embedding = embeddingResult.embedding;
                    // 添加到向量存储
                    await this.vectorStore.addVector(memory.id, embeddingResult.embedding, memory.content, {
                        type: memory.type,
                        conversationId: memory.conversationId,
                        tags: memory.tags,
                        createdAt: memory.createdAt,
                    });
                    logger.debug('Generated embedding for memory', {
                        memoryId: memory.id,
                        dimensions: embeddingResult.dimensions,
                        provider: embeddingResult.provider,
                    });
                }
                catch (error) {
                    logger.warn('Failed to generate embedding for memory, continuing without vector support', {
                        memoryId: memory.id,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
            // 确定存储文件
            const filePath = this.getMemoryFilePath(memory);
            // 读取现有记忆
            const existingMemories = await this.fileManager.readJsonFile(filePath);
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
                cacheSize: this.cache.size(),
            });
            return {
                success: true,
                data: memory,
                message: 'Memory created successfully',
            };
        }
        catch (error) {
            logger.error('Failed to create memory', error, { input });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create memory',
            };
        }
        finally {
            timer();
        }
    }
    /**
     * 读取记忆
     */
    async readMemories(filter) {
        const timer = performanceMonitor.startTimer('read_memories');
        try {
            await this.initialize();
            // 验证过滤器
            const validatedFilter = filter ? MemoryFilterSchema.parse(filter) : {};
            logger.debug('Reading memories', { filter: validatedFilter });
            let filteredMemories = [];
            // 使用索引进行快速搜索
            if (this.hasSearchCriteria(validatedFilter)) {
                const memoryIds = this.index.search({
                    searchText: validatedFilter.searchText,
                    tags: validatedFilter.tags,
                    type: validatedFilter.type,
                    conversationId: validatedFilter.conversationId,
                });
                // 从缓存中获取记忆
                for (const memoryId of memoryIds) {
                    const memory = this.cache.get(memoryId);
                    if (memory) {
                        filteredMemories.push(memory);
                    }
                }
            }
            else {
                // 如果没有搜索条件，从缓存获取所有记忆
                filteredMemories = this.cache.getAllEntries();
                // 应用基本过滤器
                if (validatedFilter.type) {
                    filteredMemories = filteredMemories.filter((m) => m.type === validatedFilter.type);
                }
                if (validatedFilter.conversationId) {
                    filteredMemories = filteredMemories.filter((m) => m.conversationId === validatedFilter.conversationId);
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
                cacheHitRate: this.cache.getStats().hitRate,
            });
            return {
                success: true,
                data: filteredMemories,
                message: `Found ${filteredMemories.length} memories`,
            };
        }
        catch (error) {
            logger.error('Failed to read memories', error, { filter });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read memories',
            };
        }
        finally {
            timer();
        }
    }
    /**
     * 更新记忆
     */
    async updateMemory(memoryId, input) {
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
                    error: 'Memory not found',
                };
            }
            // 更新记忆
            const updatedMemory = {
                ...oldMemory,
                content: validatedInput.content ?? oldMemory.content,
                tags: validatedInput.tags ?? oldMemory.tags,
                metadata: { ...oldMemory.metadata, ...validatedInput.metadata },
                updatedAt: new Date().toISOString(),
            };
            // 验证更新后的记忆
            MemoryEntrySchema.parse(updatedMemory);
            // 确定存储文件
            const filePath = this.getMemoryFilePath(updatedMemory);
            // 读取文件中的所有记忆
            const memories = await this.fileManager.readJsonFile(filePath);
            // 替换更新的记忆
            const updatedMemories = memories.map((m) => (m.id === memoryId ? updatedMemory : m));
            // 保存到文件
            await this.fileManager.writeJsonFile(filePath, updatedMemories);
            // 更新缓存和索引
            this.cache.set(memoryId, updatedMemory);
            this.index.updateMemory(oldMemory, updatedMemory);
            logger.info('Memory updated successfully', {
                memoryId,
                changes: Object.keys(validatedInput),
            });
            return {
                success: true,
                data: updatedMemory,
                message: 'Memory updated successfully',
            };
        }
        catch (error) {
            logger.error('Failed to update memory', error, { memoryId, input });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update memory',
            };
        }
        finally {
            timer();
        }
    }
    /**
     * 删除记忆
     */
    async deleteMemory(memoryId) {
        const timer = performanceMonitor.startTimer('delete_memory');
        try {
            await this.initialize();
            logger.debug('Deleting memory', { memoryId });
            // 先从缓存中查找记忆
            const memory = this.cache.get(memoryId);
            if (!memory) {
                return {
                    success: false,
                    error: 'Memory not found',
                };
            }
            // 确定存储文件
            const filePath = this.getMemoryFilePath(memory);
            // 读取文件中的所有记忆
            const memories = await this.fileManager.readJsonFile(filePath);
            // 过滤掉要删除的记忆
            const filteredMemories = memories.filter((m) => m.id !== memoryId);
            // 保存到文件
            await this.fileManager.writeJsonFile(filePath, filteredMemories);
            // 从缓存和索引中移除
            this.cache.delete(memoryId);
            this.index.removeMemory(memory);
            logger.info('Memory deleted successfully', {
                memoryId,
                type: memory.type,
                cacheSize: this.cache.size(),
            });
            return {
                success: true,
                message: 'Memory deleted successfully',
            };
        }
        catch (error) {
            logger.error('Failed to delete memory', error, { memoryId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete memory',
            };
        }
        finally {
            timer();
        }
    }
    /**
     * 获取记忆统计信息
     */
    async getMemoryStats() {
        try {
            await this.initialize();
            const files = await this.fileManager.listMemoryFiles();
            let totalMemories = 0;
            let globalMemories = 0;
            let conversationMemories = 0;
            let temporaryMemories = 0;
            let storageSize = 0;
            for (const file of files) {
                const filePath = path.join(this.config.storagePath, file);
                const memories = await this.fileManager.readJsonFile(filePath);
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
            const stats = {
                totalMemories,
                globalMemories,
                conversationMemories,
                temporaryMemories,
                storageSize,
            };
            return {
                success: true,
                data: stats,
                message: 'Memory statistics retrieved successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get memory statistics',
            };
        }
    }
    /**
     * 根据 ID 查找记忆
     */
    async findMemoryById(memoryId) {
        try {
            const files = await this.fileManager.listMemoryFiles();
            for (const file of files) {
                const filePath = path.join(this.config.storagePath, file);
                const memories = await this.fileManager.readJsonFile(filePath);
                const memory = memories.find((m) => m.id === memoryId);
                if (memory) {
                    return {
                        success: true,
                        data: { memory, filePath },
                    };
                }
            }
            return {
                success: false,
                error: 'Memory not found',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to find memory',
            };
        }
    }
    /**
     * 应用过滤器到记忆列表
     */
    applyFilters(memories, filter) {
        let filtered = memories;
        // 按类型过滤
        if (filter.type) {
            filtered = filtered.filter((m) => m.type === filter.type);
        }
        // 按对话 ID 过滤
        if (filter.conversationId) {
            filtered = filtered.filter((m) => m.conversationId === filter.conversationId);
        }
        // 按标签过滤
        if (filter.tags && filter.tags.length > 0) {
            filtered = filtered.filter((m) => filter.tags.some((tag) => m.tags?.includes(tag)));
        }
        // 按搜索文本过滤
        if (filter.searchText) {
            const searchText = filter.searchText.toLowerCase();
            filtered = filtered.filter((m) => m.content.toLowerCase().includes(searchText) ||
                m.tags?.some((tag) => tag.toLowerCase().includes(searchText)));
        }
        // 按创建时间排序（最新的在前）
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return filtered;
    }
    /**
     * 获取记忆文件路径
     */
    getMemoryFilePath(memory) {
        if (memory.type === MemoryType.GLOBAL) {
            return this.fileManager.getGlobalMemoryFilePath();
        }
        else if (memory.conversationId) {
            return this.fileManager.getConversationMemoryFilePath(memory.conversationId);
        }
        else {
            // 默认使用全局文件
            return this.fileManager.getGlobalMemoryFilePath();
        }
    }
    /**
     * 清理旧的对话记忆
     */
    async cleanupOldConversations(maxAge) {
        try {
            const deletedCount = await this.fileManager.cleanupOldConversations(maxAge);
            return {
                success: true,
                data: deletedCount,
                message: `Cleaned up ${deletedCount} old conversation files`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to cleanup old conversations',
            };
        }
    }
    /**
     * 检查是否有搜索条件
     */
    hasSearchCriteria(filter) {
        return !!(filter.searchText ||
            (filter.tags && filter.tags.length > 0) ||
            filter.type ||
            filter.conversationId);
    }
    /**
     * 获取增强的记忆统计信息
     */
    async getEnhancedStats() {
        try {
            await this.initialize();
            const memoryStatsResult = await this.getMemoryStats();
            if (!memoryStatsResult.success) {
                return memoryStatsResult;
            }
            return {
                success: true,
                data: {
                    memoryStats: memoryStatsResult.data,
                    cacheStats: this.cache.getStats(),
                    indexStats: this.index.getStats(),
                    performanceStats: performanceMonitor.getPerformanceSummary(),
                },
                message: 'Enhanced statistics retrieved successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get enhanced statistics',
            };
        }
    }
    // ==================== 向量相关方法 ====================
    /**
     * 配置嵌入提供商
     */
    async configureEmbedding(config) {
        try {
            await this.embeddingManager.configure(config);
            this.vectorEnabled = true;
            return {
                success: true,
                message: `Successfully configured ${config.provider} embedding provider`,
                data: this.embeddingManager.getProviderInfo(),
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to configure embedding provider',
            };
        }
    }
    /**
     * 语义搜索记忆
     */
    async semanticSearch(options) {
        try {
            await this.initialize();
            if (!this.vectorEnabled) {
                return {
                    success: false,
                    error: 'Vector search is not enabled. Please configure an embedding provider first.',
                };
            }
            // 生成查询向量
            const embeddingResult = await this.embeddingManager.generateEmbedding(options.query);
            // 搜索相似向量
            const vectorResults = await this.vectorStore.searchSimilar(embeddingResult.embedding, options.limit, options.threshold);
            // 如果启用混合搜索，结合关键词搜索结果
            if (options.hybridSearch) {
                const keywordResults = await this.readMemories({
                    searchText: options.query,
                    limit: Math.ceil(options.limit * 0.5),
                });
                if (keywordResults.success && keywordResults.data) {
                    // 合并结果并去重
                    const combinedResults = this.combineSearchResults(vectorResults, keywordResults.data, options.keywordWeight);
                    return {
                        success: true,
                        data: combinedResults.slice(0, options.limit),
                        message: `Found ${combinedResults.length} memories using hybrid search`,
                    };
                }
            }
            return {
                success: true,
                data: vectorResults,
                message: `Found ${vectorResults.length} similar memories`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to perform semantic search',
            };
        }
    }
    /**
     * 为现有记忆生成嵌入向量
     */
    async generateEmbeddingsForExistingMemories() {
        try {
            await this.initialize();
            if (!this.vectorEnabled) {
                return {
                    success: false,
                    error: 'Vector generation is not enabled. Please configure an embedding provider first.',
                };
            }
            let processed = 0;
            let failed = 0;
            // 获取所有记忆
            const allMemoriesResult = await this.readMemories({ limit: 10000 });
            if (!allMemoriesResult.success || !allMemoriesResult.data) {
                return {
                    success: false,
                    error: 'Failed to retrieve existing memories',
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
                        await this.vectorStore.addVector(memory.id, embeddingResult.embedding, memory.content, {
                            type: memory.type,
                            conversationId: memory.conversationId,
                            tags: memory.tags,
                            createdAt: memory.createdAt,
                        });
                        // 更新缓存
                        this.cache.set(memory.id, memory);
                        processed++;
                    }
                    catch (error) {
                        logger.error(`Failed to generate embedding for memory ${memory.id}:`, error);
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
                message: `Generated embeddings for ${processed} memories, ${failed} failed`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Failed to generate embeddings for existing memories',
            };
        }
    }
    /**
     * 获取向量统计信息
     */
    async getVectorStats() {
        try {
            if (!this.vectorEnabled) {
                return {
                    success: false,
                    error: 'Vector functionality is not enabled',
                };
            }
            const stats = await this.vectorStore.getStats();
            const providerInfo = this.embeddingManager.getProviderInfo();
            return {
                success: true,
                data: {
                    ...stats,
                    provider: providerInfo?.name,
                    model: providerInfo?.model,
                },
                message: 'Vector statistics retrieved successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get vector statistics',
            };
        }
    }
    /**
     * 计算两个文本的相似度
     */
    async calculateSimilarity(text1, text2) {
        try {
            if (!this.vectorEnabled) {
                return {
                    success: false,
                    error: 'Vector functionality is not enabled',
                };
            }
            const [embedding1, embedding2] = await Promise.all([
                this.embeddingManager.generateEmbedding(text1),
                this.embeddingManager.generateEmbedding(text2),
            ]);
            const similarity = VectorUtils.cosineSimilarity(embedding1.embedding, embedding2.embedding);
            return {
                success: true,
                data: { similarity },
                message: 'Similarity calculated successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to calculate similarity',
            };
        }
    }
    /**
     * 合并向量搜索和关键词搜索结果
     */
    combineSearchResults(vectorResults, keywordResults, keywordWeight) {
        const combined = new Map();
        // 添加向量搜索结果
        for (const result of vectorResults) {
            combined.set(result.id, {
                ...result,
                similarity: result.similarity * (1 - keywordWeight),
            });
        }
        // 添加关键词搜索结果
        for (const memory of keywordResults) {
            const existing = combined.get(memory.id);
            if (existing) {
                // 如果已存在，增加权重
                existing.similarity += keywordWeight;
            }
            else {
                // 新结果，使用关键词权重作为相似度
                combined.set(memory.id, {
                    id: memory.id,
                    similarity: keywordWeight,
                    content: memory.content,
                    metadata: {
                        type: memory.type,
                        conversationId: memory.conversationId,
                        tags: memory.tags,
                        createdAt: memory.createdAt,
                    },
                });
            }
        }
        // 按相似度排序
        return Array.from(combined.values()).sort((a, b) => b.similarity - a.similarity);
    }
    /**
     * 检查向量功能是否启用
     */
    isVectorEnabled() {
        return this.vectorEnabled;
    }
    /**
     * 获取嵌入提供商信息
     */
    getEmbeddingProviderInfo() {
        return this.embeddingManager.getProviderInfo();
    }
    // ==================== 文件夹管理方法 ====================
    /**
     * 创建文件夹
     */
    async createFolder(input) {
        const timer = performanceMonitor.startTimer('create_folder');
        try {
            await this.initialize();
            // 验证输入
            const validatedInput = CreateFolderInputSchema.parse(input);
            logger.debug('Creating folder', { folderPath: validatedInput.folderPath });
            // 检查文件夹是否已存在
            const existingFolders = await this.listFolders();
            if (existingFolders.success && existingFolders.data) {
                const folderExists = existingFolders.data.folders.some((f) => f.path === validatedInput.folderPath);
                if (folderExists) {
                    return {
                        success: false,
                        error: `Folder '${validatedInput.folderPath}' already exists`,
                    };
                }
            }
            // 创建文件夹信息
            const folderInfo = {
                path: validatedInput.folderPath,
                name: validatedInput.folderPath.split('/').pop() || validatedInput.folderPath,
                createdAt: new Date().toISOString(),
                memoryCount: 0,
                parentPath: this.getParentPath(validatedInput.folderPath),
            };
            // 保存文件夹信息到索引文件
            await this.saveFolderInfo(folderInfo);
            logger.info('Folder created successfully', { folderPath: validatedInput.folderPath });
            return {
                success: true,
                data: folderInfo,
                message: `Folder '${validatedInput.folderPath}' created successfully`,
            };
        }
        catch (error) {
            logger.error('Failed to create folder', error, { input });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create folder',
            };
        }
        finally {
            timer();
        }
    }
    /**
     * 删除文件夹
     */
    async deleteFolder(input) {
        const timer = performanceMonitor.startTimer('delete_folder');
        try {
            await this.initialize();
            // 验证输入
            const validatedInput = DeleteFolderInputSchema.parse(input);
            logger.debug('Deleting folder', {
                folderPath: validatedInput.folderPath,
                deleteMemories: validatedInput.deleteMemories,
            });
            // 查找文件夹中的所有记忆
            const memoriesInFolder = await this.getMemoriesInFolder(validatedInput.folderPath);
            let deletedMemories = 0;
            if (validatedInput.deleteMemories) {
                // 删除文件夹内的所有记忆
                for (const memory of memoriesInFolder) {
                    const deleteResult = await this.deleteMemory(memory.id);
                    if (deleteResult.success) {
                        deletedMemories++;
                    }
                }
            }
            else {
                // 只移除文件夹标注,不删除记忆
                for (const memory of memoriesInFolder) {
                    if (memory.metadata?.folderPath === validatedInput.folderPath) {
                        const updatedMetadata = { ...memory.metadata };
                        delete updatedMetadata.folderPath;
                        await this.updateMemory(memory.id, {
                            metadata: updatedMetadata,
                        });
                    }
                }
            }
            // 从文件夹索引中删除
            await this.removeFolderInfo(validatedInput.folderPath);
            logger.info('Folder deleted successfully', {
                folderPath: validatedInput.folderPath,
                deletedMemories,
            });
            return {
                success: true,
                data: { deletedMemories },
                message: `Folder '${validatedInput.folderPath}' deleted successfully. ${deletedMemories} memories ${validatedInput.deleteMemories ? 'deleted' : 'untagged'}.`,
            };
        }
        catch (error) {
            logger.error('Failed to delete folder', error, { input });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete folder',
            };
        }
        finally {
            timer();
        }
    }
    /**
     * 重命名文件夹
     */
    async renameFolder(input) {
        const timer = performanceMonitor.startTimer('rename_folder');
        try {
            await this.initialize();
            // 验证输入
            const validatedInput = RenameFolderInputSchema.parse(input);
            logger.debug('Renaming folder', {
                oldPath: validatedInput.oldPath,
                newPath: validatedInput.newPath,
            });
            // 检查旧文件夹是否存在
            const existingFolders = await this.listFolders();
            if (!existingFolders.success || !existingFolders.data) {
                return {
                    success: false,
                    error: 'Failed to retrieve folder list',
                };
            }
            const oldFolder = existingFolders.data.folders.find((f) => f.path === validatedInput.oldPath);
            if (!oldFolder) {
                return {
                    success: false,
                    error: `Folder '${validatedInput.oldPath}' not found`,
                };
            }
            // 检查新文件夹名是否已存在
            const newFolderExists = existingFolders.data.folders.some((f) => f.path === validatedInput.newPath);
            if (newFolderExists) {
                return {
                    success: false,
                    error: `Folder '${validatedInput.newPath}' already exists`,
                };
            }
            // 更新文件夹中所有记忆的 folder 元数据
            const memoriesInFolder = await this.getMemoriesInFolder(validatedInput.oldPath);
            for (const memory of memoriesInFolder) {
                const metadata = memory.metadata || {};
                if (metadata.folder === validatedInput.oldPath ||
                    metadata.folderPath === validatedInput.oldPath) {
                    const updatedMetadata = {
                        ...metadata,
                        folder: validatedInput.newPath,
                        folderPath: validatedInput.newPath,
                    };
                    await this.updateMemory(memory.id, {
                        metadata: updatedMetadata,
                    });
                }
            }
            // 更新文件夹信息
            const updatedFolderInfo = {
                ...oldFolder,
                path: validatedInput.newPath,
                name: validatedInput.newPath.split('/').pop() || validatedInput.newPath,
                parentPath: this.getParentPath(validatedInput.newPath),
            };
            // 删除旧文件夹信息并保存新的
            await this.removeFolderInfo(validatedInput.oldPath);
            await this.saveFolderInfo(updatedFolderInfo);
            logger.info('Folder renamed successfully', {
                oldPath: validatedInput.oldPath,
                newPath: validatedInput.newPath,
                updatedMemories: memoriesInFolder.length,
            });
            return {
                success: true,
                data: updatedFolderInfo,
                message: `Folder renamed from '${validatedInput.oldPath}' to '${validatedInput.newPath}'. ${memoriesInFolder.length} memories updated.`,
            };
        }
        catch (error) {
            logger.error('Failed to rename folder', error, { input });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to rename folder',
            };
        }
        finally {
            timer();
        }
    }
    /**
     * 列出所有文件夹
     */
    async listFolders() {
        try {
            await this.initialize();
            const foldersFilePath = path.join(this.config.storagePath, 'folders.json');
            let folders = [];
            try {
                const data = await this.fileManager.readJsonFile(foldersFilePath);
                folders = data;
            }
            catch (error) {
                // 文件不存在或读取失败,返回空列表
                folders = [];
            }
            // 更新每个文件夹的记忆数量
            for (const folder of folders) {
                const memories = await this.getMemoriesInFolder(folder.path);
                folder.memoryCount = memories.length;
            }
            return {
                success: true,
                data: {
                    folders,
                    totalFolders: folders.length,
                },
                message: `Found ${folders.length} folders`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list folders',
            };
        }
    }
    /**
     * 获取文件夹中的所有记忆
     */
    async getMemoriesInFolder(folderPath) {
        const allMemoriesResult = await this.readMemories({ limit: 10000 });
        if (!allMemoriesResult.success || !allMemoriesResult.data) {
            return [];
        }
        return allMemoriesResult.data.filter((memory) => {
            const metadata = memory.metadata || {};
            return metadata.folder === folderPath || metadata.folderPath === folderPath;
        });
    }
    /**
     * 保存文件夹信息
     */
    async saveFolderInfo(folderInfo) {
        const foldersFilePath = path.join(this.config.storagePath, 'folders.json');
        let folders = [];
        try {
            folders = await this.fileManager.readJsonFile(foldersFilePath);
        }
        catch (error) {
            // 文件不存在,创建新的
            folders = [];
        }
        // 添加或更新文件夹信息
        const existingIndex = folders.findIndex((f) => f.path === folderInfo.path);
        if (existingIndex >= 0) {
            folders[existingIndex] = folderInfo;
        }
        else {
            folders.push(folderInfo);
        }
        await this.fileManager.writeJsonFile(foldersFilePath, folders);
    }
    /**
     * 删除文件夹信息
     */
    async removeFolderInfo(folderPath) {
        const foldersFilePath = path.join(this.config.storagePath, 'folders.json');
        let folders = [];
        try {
            folders = await this.fileManager.readJsonFile(foldersFilePath);
        }
        catch (error) {
            // 文件不存在,无需删除
            return;
        }
        // 过滤掉要删除的文件夹
        folders = folders.filter((f) => f.path !== folderPath);
        await this.fileManager.writeJsonFile(foldersFilePath, folders);
    }
    /**
     * 获取父文件夹路径
     */
    getParentPath(folderPath) {
        const parts = folderPath.split('/');
        if (parts.length <= 1) {
            return undefined;
        }
        return parts.slice(0, -1).join('/');
    }
}
//# sourceMappingURL=MemoryManager.js.map
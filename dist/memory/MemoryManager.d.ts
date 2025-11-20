import { MemoryEntry, CreateMemoryInput, UpdateMemoryInput, MemoryFilter, ApiResponse, MemoryStats, CreateFolderInput, RenameFolderInput, DeleteFolderInput, FolderInfo, FolderListResponse } from '../types/memory.js';
import { VectorSearchResult, VectorStats, SemanticSearchOptions, VectorApiResponse } from '../types/vector.js';
import { PerformanceMetrics, SystemMetrics } from '../utils/PerformanceMonitor.js';
export declare class MemoryManager {
    private fileManager;
    private config;
    private cache;
    private index;
    private isInitialized;
    private embeddingManager;
    private vectorStore;
    private vectorEnabled;
    constructor(storagePath?: string, cacheSize?: number);
    /**
     * 初始化记忆管理器（加载现有记忆到缓存和索引）
     */
    private initialize;
    /**
     * 设置存储路径
     */
    setStoragePath(storagePath: string): Promise<ApiResponse>;
    /**
     * 创建记忆
     */
    createMemory(input: CreateMemoryInput): Promise<ApiResponse<MemoryEntry>>;
    /**
     * 读取记忆
     */
    readMemories(filter?: MemoryFilter): Promise<ApiResponse<MemoryEntry[]>>;
    /**
     * 更新记忆
     */
    updateMemory(memoryId: string, input: UpdateMemoryInput): Promise<ApiResponse<MemoryEntry>>;
    /**
     * 删除记忆
     */
    deleteMemory(memoryId: string): Promise<ApiResponse>;
    /**
     * 获取记忆统计信息
     */
    getMemoryStats(): Promise<ApiResponse<MemoryStats>>;
    /**
     * 根据 ID 查找记忆
     */
    private findMemoryById;
    /**
     * 应用过滤器到记忆列表
     */
    private applyFilters;
    /**
     * 获取记忆文件路径
     */
    private getMemoryFilePath;
    /**
     * 清理旧的对话记忆
     */
    cleanupOldConversations(maxAge?: number): Promise<ApiResponse<number>>;
    /**
     * 检查是否有搜索条件
     */
    private hasSearchCriteria;
    /**
     * 获取增强的记忆统计信息
     */
    getEnhancedStats(): Promise<ApiResponse<{
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
    }>>;
    /**
     * 配置嵌入提供商
     */
    configureEmbedding(config: any): Promise<VectorApiResponse>;
    /**
     * 语义搜索记忆
     */
    semanticSearch(options: SemanticSearchOptions): Promise<VectorApiResponse<VectorSearchResult[]>>;
    /**
     * 为现有记忆生成嵌入向量
     */
    generateEmbeddingsForExistingMemories(): Promise<VectorApiResponse<{
        processed: number;
        failed: number;
    }>>;
    /**
     * 获取向量统计信息
     */
    getVectorStats(): Promise<VectorApiResponse<VectorStats>>;
    /**
     * 计算两个文本的相似度
     */
    calculateSimilarity(text1: string, text2: string): Promise<VectorApiResponse<{
        similarity: number;
    }>>;
    /**
     * 合并向量搜索和关键词搜索结果
     */
    private combineSearchResults;
    /**
     * 检查向量功能是否启用
     */
    isVectorEnabled(): boolean;
    /**
     * 获取嵌入提供商信息
     */
    getEmbeddingProviderInfo(): any;
    /**
     * 创建文件夹
     */
    createFolder(input: CreateFolderInput): Promise<ApiResponse<FolderInfo>>;
    /**
     * 删除文件夹
     */
    deleteFolder(input: DeleteFolderInput): Promise<ApiResponse<{
        deletedMemories: number;
    }>>;
    /**
     * 重命名文件夹
     */
    renameFolder(input: RenameFolderInput): Promise<ApiResponse<FolderInfo>>;
    /**
     * 列出所有文件夹
     */
    listFolders(): Promise<ApiResponse<FolderListResponse>>;
    /**
     * 获取文件夹中的所有记忆
     */
    private getMemoriesInFolder;
    /**
     * 保存文件夹信息
     */
    private saveFolderInfo;
    /**
     * 删除文件夹信息
     */
    private removeFolderInfo;
    /**
     * 获取父文件夹路径
     */
    private getParentPath;
}
//# sourceMappingURL=MemoryManager.d.ts.map
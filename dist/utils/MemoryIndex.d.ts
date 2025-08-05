import { MemoryEntry, MemoryType } from '../types/memory.js';
/**
 * 记忆索引系统，用于快速搜索和过滤
 */
export declare class MemoryIndex {
    private contentIndex;
    private tagIndex;
    private typeIndex;
    private conversationIndex;
    private metadataIndex;
    private dateIndex;
    /**
     * 添加记忆到索引
     */
    addMemory(memory: MemoryEntry): void;
    /**
     * 从索引中移除记忆
     */
    removeMemory(memory: MemoryEntry): void;
    /**
     * 更新记忆索引
     */
    updateMemory(oldMemory: MemoryEntry, newMemory: MemoryEntry): void;
    /**
     * 搜索记忆ID
     */
    search(options: {
        searchText?: string;
        tags?: string[];
        type?: MemoryType;
        conversationId?: string;
        metadata?: Record<string, any>;
        dateRange?: {
            from?: string;
            to?: string;
        };
    }): Set<string>;
    /**
     * 获取索引统计信息
     */
    getStats(): {
        contentTerms: number;
        tags: number;
        types: number;
        conversations: number;
        metadataKeys: number;
        dates: number;
    };
    /**
     * 清空所有索引
     */
    clear(): void;
    /**
     * 索引内容（简单分词）
     */
    private indexContent;
    /**
     * 从内容索引中移除
     */
    private removeFromContentIndex;
    /**
     * 简单分词器
     */
    private tokenize;
    /**
     * 添加到索引
     */
    private addToIndex;
    /**
     * 从索引中移除
     */
    private removeFromIndex;
    /**
     * 搜索内容
     */
    private searchContent;
    /**
     * 搜索标签
     */
    private searchTags;
    /**
     * 搜索元数据
     */
    private searchMetadata;
    /**
     * 搜索日期范围
     */
    private searchDateRange;
    /**
     * 集合交集操作
     */
    private intersectSets;
}
//# sourceMappingURL=MemoryIndex.d.ts.map
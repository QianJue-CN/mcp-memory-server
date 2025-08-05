import { MemoryEntry } from '../types/memory.js';
/**
 * LRU 缓存实现，用于提高记忆访问性能
 */
export declare class MemoryCache {
    private cache;
    private maxSize;
    private hitCount;
    private missCount;
    constructor(maxSize?: number);
    /**
     * 获取记忆条目
     */
    get(id: string): MemoryEntry | null;
    /**
     * 设置记忆条目
     */
    set(id: string, entry: MemoryEntry): void;
    /**
     * 删除记忆条目
     */
    delete(id: string): boolean;
    /**
     * 批量获取记忆条目
     */
    getMultiple(ids: string[]): Map<string, MemoryEntry>;
    /**
     * 批量设置记忆条目
     */
    setMultiple(entries: MemoryEntry[]): void;
    /**
     * 清空缓存
     */
    clear(): void;
    /**
     * 获取缓存统计信息
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitCount: number;
        missCount: number;
        hitRate: number;
    };
    /**
     * 获取所有缓存的记忆 ID
     */
    getAllIds(): string[];
    /**
     * 获取所有缓存的记忆条目
     */
    getAllEntries(): MemoryEntry[];
    /**
     * 检查记忆是否在缓存中
     */
    has(id: string): boolean;
    /**
     * 获取缓存大小
     */
    size(): number;
    /**
     * 设置最大缓存大小
     */
    setMaxSize(maxSize: number): void;
    /**
     * 根据条件搜索缓存中的记忆
     */
    search(predicate: (entry: MemoryEntry) => boolean): MemoryEntry[];
}
//# sourceMappingURL=MemoryCache.d.ts.map
/**
 * LRU 缓存实现，用于提高记忆访问性能
 */
export class MemoryCache {
    cache;
    maxSize;
    hitCount = 0;
    missCount = 0;
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    /**
     * 获取记忆条目
     */
    get(id) {
        const item = this.cache.get(id);
        if (item) {
            // 更新访问时间（LRU）
            item.timestamp = Date.now();
            this.cache.delete(id);
            this.cache.set(id, item);
            this.hitCount++;
            return item.entry;
        }
        this.missCount++;
        return null;
    }
    /**
     * 设置记忆条目
     */
    set(id, entry) {
        // 如果已存在，先删除
        if (this.cache.has(id)) {
            this.cache.delete(id);
        }
        // 如果缓存已满，删除最旧的条目
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        // 添加新条目
        this.cache.set(id, {
            entry: { ...entry },
            timestamp: Date.now(),
        });
    }
    /**
     * 删除记忆条目
     */
    delete(id) {
        return this.cache.delete(id);
    }
    /**
     * 批量获取记忆条目
     */
    getMultiple(ids) {
        const result = new Map();
        for (const id of ids) {
            const entry = this.get(id);
            if (entry) {
                result.set(id, entry);
            }
        }
        return result;
    }
    /**
     * 批量设置记忆条目
     */
    setMultiple(entries) {
        for (const entry of entries) {
            this.set(entry.id, entry);
        }
    }
    /**
     * 清空缓存
     */
    clear() {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }
    /**
     * 获取缓存统计信息
     */
    getStats() {
        const total = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: total > 0 ? this.hitCount / total : 0,
        };
    }
    /**
     * 获取所有缓存的记忆 ID
     */
    getAllIds() {
        return Array.from(this.cache.keys());
    }
    /**
     * 获取所有缓存的记忆条目
     */
    getAllEntries() {
        return Array.from(this.cache.values()).map((item) => item.entry);
    }
    /**
     * 检查记忆是否在缓存中
     */
    has(id) {
        return this.cache.has(id);
    }
    /**
     * 获取缓存大小
     */
    size() {
        return this.cache.size;
    }
    /**
     * 设置最大缓存大小
     */
    setMaxSize(maxSize) {
        this.maxSize = maxSize;
        // 如果当前缓存超过新的最大大小，删除最旧的条目
        while (this.cache.size > this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
            else {
                break;
            }
        }
    }
    /**
     * 根据条件搜索缓存中的记忆
     */
    search(predicate) {
        const results = [];
        for (const item of this.cache.values()) {
            if (predicate(item.entry)) {
                results.push(item.entry);
            }
        }
        return results;
    }
}
//# sourceMappingURL=MemoryCache.js.map
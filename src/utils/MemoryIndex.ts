import { MemoryEntry, MemoryType } from '../types/memory.js';

/**
 * 记忆索引系统，用于快速搜索和过滤
 */
export class MemoryIndex {
  // 内容索引：单词 -> 记忆ID集合
  private contentIndex: Map<string, Set<string>> = new Map();

  // 标签索引：标签 -> 记忆ID集合
  private tagIndex: Map<string, Set<string>> = new Map();

  // 类型索引：类型 -> 记忆ID集合
  private typeIndex: Map<MemoryType, Set<string>> = new Map();

  // 对话索引：对话ID -> 记忆ID集合
  private conversationIndex: Map<string, Set<string>> = new Map();

  // 元数据索引：键值对 -> 记忆ID集合
  private metadataIndex: Map<string, Set<string>> = new Map();

  // 日期索引：日期字符串 -> 记忆ID集合
  private dateIndex: Map<string, Set<string>> = new Map();

  /**
   * 添加记忆到索引
   */
  addMemory(memory: MemoryEntry): void {
    const memoryId = memory.id;

    // 索引内容（分词）
    this.indexContent(memory.content, memoryId);

    // 索引标签
    if (memory.tags) {
      for (const tag of memory.tags) {
        this.addToIndex(this.tagIndex, tag.toLowerCase(), memoryId);
      }
    }

    // 索引类型
    this.addToIndex(this.typeIndex, memory.type, memoryId);

    // 索引对话ID
    if (memory.conversationId) {
      this.addToIndex(this.conversationIndex, memory.conversationId, memoryId);
    }

    // 索引元数据
    if (memory.metadata) {
      for (const [key, value] of Object.entries(memory.metadata)) {
        const metadataKey = `${key}:${String(value)}`;
        this.addToIndex(this.metadataIndex, metadataKey, memoryId);
      }
    }

    // 索引日期
    const createdDate = new Date(memory.createdAt).toISOString().split('T')[0];
    this.addToIndex(this.dateIndex, createdDate, memoryId);
  }

  /**
   * 从索引中移除记忆
   */
  removeMemory(memory: MemoryEntry): void {
    const memoryId = memory.id;

    // 从内容索引中移除
    this.removeFromContentIndex(memory.content, memoryId);

    // 从标签索引中移除
    if (memory.tags) {
      for (const tag of memory.tags) {
        this.removeFromIndex(this.tagIndex, tag.toLowerCase(), memoryId);
      }
    }

    // 从类型索引中移除
    this.removeFromIndex(this.typeIndex, memory.type, memoryId);

    // 从对话索引中移除
    if (memory.conversationId) {
      this.removeFromIndex(this.conversationIndex, memory.conversationId, memoryId);
    }

    // 从元数据索引中移除
    if (memory.metadata) {
      for (const [key, value] of Object.entries(memory.metadata)) {
        const metadataKey = `${key}:${String(value)}`;
        this.removeFromIndex(this.metadataIndex, metadataKey, memoryId);
      }
    }

    // 从日期索引中移除
    const createdDate = new Date(memory.createdAt).toISOString().split('T')[0];
    this.removeFromIndex(this.dateIndex, createdDate, memoryId);
  }

  /**
   * 更新记忆索引
   */
  updateMemory(oldMemory: MemoryEntry, newMemory: MemoryEntry): void {
    this.removeMemory(oldMemory);
    this.addMemory(newMemory);
  }

  /**
   * 搜索记忆ID
   */
  search(options: {
    searchText?: string;
    tags?: string[];
    type?: MemoryType;
    conversationId?: string;
    metadata?: Record<string, any>;
    dateRange?: { from?: string; to?: string };
  }): Set<string> {
    let resultIds: Set<string> | null = null;

    // 文本搜索
    if (options.searchText) {
      const textIds = this.searchContent(options.searchText);
      resultIds = this.intersectSets(resultIds, textIds);
    }

    // 标签搜索
    if (options.tags && options.tags.length > 0) {
      const tagIds = this.searchTags(options.tags);
      resultIds = this.intersectSets(resultIds, tagIds);
    }

    // 类型搜索
    if (options.type) {
      const typeIds = this.typeIndex.get(options.type) || new Set();
      resultIds = this.intersectSets(resultIds, typeIds);
    }

    // 对话搜索
    if (options.conversationId) {
      const convIds = this.conversationIndex.get(options.conversationId) || new Set();
      resultIds = this.intersectSets(resultIds, convIds);
    }

    // 元数据搜索
    if (options.metadata) {
      const metadataIds = this.searchMetadata(options.metadata);
      resultIds = this.intersectSets(resultIds, metadataIds);
    }

    // 日期范围搜索
    if (options.dateRange) {
      const dateIds = this.searchDateRange(options.dateRange);
      resultIds = this.intersectSets(resultIds, dateIds);
    }

    return resultIds || new Set();
  }

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
  } {
    return {
      contentTerms: this.contentIndex.size,
      tags: this.tagIndex.size,
      types: this.typeIndex.size,
      conversations: this.conversationIndex.size,
      metadataKeys: this.metadataIndex.size,
      dates: this.dateIndex.size
    };
  }

  /**
   * 清空所有索引
   */
  clear(): void {
    this.contentIndex.clear();
    this.tagIndex.clear();
    this.typeIndex.clear();
    this.conversationIndex.clear();
    this.metadataIndex.clear();
    this.dateIndex.clear();
  }

  // 私有辅助方法

  /**
   * 索引内容（简单分词）
   */
  private indexContent(content: string, memoryId: string): void {
    const words = this.tokenize(content);
    for (const word of words) {
      this.addToIndex(this.contentIndex, word, memoryId);
    }
  }

  /**
   * 从内容索引中移除
   */
  private removeFromContentIndex(content: string, memoryId: string): void {
    const words = this.tokenize(content);
    for (const word of words) {
      this.removeFromIndex(this.contentIndex, word, memoryId);
    }
  }

  /**
   * 简单分词器
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文字符
      .split(/\s+/)
      .filter(word => word.length > 1); // 过滤单字符
  }

  /**
   * 添加到索引
   */
  private addToIndex<K>(index: Map<K, Set<string>>, key: K, memoryId: string): void {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key)!.add(memoryId);
  }

  /**
   * 从索引中移除
   */
  private removeFromIndex<K>(index: Map<K, Set<string>>, key: K, memoryId: string): void {
    const set = index.get(key);
    if (set) {
      set.delete(memoryId);
      if (set.size === 0) {
        index.delete(key);
      }
    }
  }

  /**
   * 搜索内容
   */
  private searchContent(searchText: string): Set<string> {
    const words = this.tokenize(searchText);
    let resultIds: Set<string> | null = null;

    for (const word of words) {
      const wordIds = this.contentIndex.get(word) || new Set();
      resultIds = this.intersectSets(resultIds, wordIds);
    }

    return resultIds || new Set();
  }

  /**
   * 搜索标签
   */
  private searchTags(tags: string[]): Set<string> {
    let resultIds: Set<string> | null = null;

    for (const tag of tags) {
      const tagIds = this.tagIndex.get(tag.toLowerCase()) || new Set();
      if (resultIds === null) {
        resultIds = new Set(tagIds);
      } else {
        // 使用并集（OR 逻辑）
        for (const id of tagIds) {
          resultIds.add(id);
        }
      }
    }

    return resultIds || new Set();
  }

  /**
   * 搜索元数据
   */
  private searchMetadata(metadata: Record<string, any>): Set<string> {
    let resultIds: Set<string> | null = null;

    for (const [key, value] of Object.entries(metadata)) {
      const metadataKey = `${key}:${String(value)}`;
      const metadataIds = this.metadataIndex.get(metadataKey) || new Set();
      resultIds = this.intersectSets(resultIds, metadataIds);
    }

    return resultIds || new Set();
  }

  /**
   * 搜索日期范围
   */
  private searchDateRange(dateRange: { from?: string; to?: string }): Set<string> {
    let resultIds: Set<string> | null = null;

    for (const [dateStr, ids] of this.dateIndex.entries()) {
      const date = new Date(dateStr);

      if (dateRange.from && date < new Date(dateRange.from)) continue;
      if (dateRange.to && date > new Date(dateRange.to)) continue;

      if (resultIds === null) {
        resultIds = new Set(ids);
      } else {
        for (const id of ids) {
          resultIds.add(id);
        }
      }
    }

    return resultIds || new Set();
  }

  /**
   * 集合交集操作
   */
  private intersectSets(set1: Set<string> | null, set2: Set<string>): Set<string> {
    if (set1 === null) {
      return new Set(set2);
    }

    const result = new Set<string>();
    for (const item of set1) {
      if (set2.has(item)) {
        result.add(item);
      }
    }
    return result;
  }
}

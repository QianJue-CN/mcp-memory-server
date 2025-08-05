import { VectorStore, VectorEntry, VectorSearchResult, VectorStats } from '../types/vector.js';
/**
 * 内存向量存储实现
 */
export declare class MemoryVectorStore implements VectorStore {
    private vectors;
    private filePath;
    private isDirty;
    private autoSave;
    private saveInterval;
    constructor(filePath: string, autoSave?: boolean);
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
    /**
     * 获取统计信息
     */
    getStats(): Promise<VectorStats>;
    /**
     * 批量添加向量
     */
    addVectors(vectors: Array<{
        id: string;
        embedding: number[];
        content: string;
        metadata?: Record<string, any>;
    }>): Promise<void>;
    /**
     * 销毁存储（清理资源）
     */
    destroy(): void;
}
//# sourceMappingURL=VectorStore.d.ts.map
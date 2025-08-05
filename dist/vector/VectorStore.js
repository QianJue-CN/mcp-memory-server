import { VectorUtils } from './VectorUtils.js';
import { logger } from '../utils/Logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * 内存向量存储实现
 */
export class MemoryVectorStore {
    vectors = new Map();
    filePath;
    isDirty = false;
    autoSave = true;
    saveInterval = null;
    constructor(filePath, autoSave = true) {
        this.filePath = filePath;
        this.autoSave = autoSave;
        if (autoSave) {
            // 每30秒自动保存一次
            this.saveInterval = setInterval(() => {
                if (this.isDirty) {
                    this.save().catch((error) => {
                        logger.error('Auto-save failed:', error);
                    });
                }
            }, 30000);
        }
    }
    /**
     * 添加向量
     */
    async addVector(id, embedding, content, metadata) {
        if (!VectorUtils.validateVector(embedding)) {
            throw new Error('Invalid embedding vector');
        }
        if (!content || content.trim().length === 0) {
            throw new Error('Content cannot be empty');
        }
        const now = new Date().toISOString();
        const vectorEntry = {
            id,
            embedding: VectorUtils.quantize(embedding), // 量化以节省空间
            content,
            metadata,
            createdAt: now,
            updatedAt: now,
        };
        this.vectors.set(id, vectorEntry);
        this.isDirty = true;
        logger.debug(`Added vector for ID: ${id}, dimensions: ${embedding.length}`);
    }
    /**
     * 搜索相似向量
     */
    async searchSimilar(queryEmbedding, limit, threshold = 0.7) {
        if (!VectorUtils.validateVector(queryEmbedding)) {
            throw new Error('Invalid query embedding vector');
        }
        if (this.vectors.size === 0) {
            return [];
        }
        const results = [];
        // 计算所有向量的相似度
        for (const entry of this.vectors.values()) {
            try {
                const similarity = VectorUtils.cosineSimilarity(queryEmbedding, entry.embedding);
                if (similarity >= threshold) {
                    results.push({ entry, similarity });
                }
            }
            catch (error) {
                logger.warn(`Failed to calculate similarity for vector ${entry.id}:`, error);
            }
        }
        // 按相似度排序并限制结果数量
        results.sort((a, b) => b.similarity - a.similarity);
        const topResults = results.slice(0, limit);
        // 转换为搜索结果格式
        return topResults.map(({ entry, similarity }) => ({
            id: entry.id,
            similarity,
            content: entry.content,
            metadata: entry.metadata,
        }));
    }
    /**
     * 移除向量
     */
    async removeVector(id) {
        const existed = this.vectors.has(id);
        if (existed) {
            this.vectors.delete(id);
            this.isDirty = true;
            logger.debug(`Removed vector for ID: ${id}`);
        }
        return existed;
    }
    /**
     * 更新向量
     */
    async updateVector(id, embedding, content, metadata) {
        const existingEntry = this.vectors.get(id);
        if (!existingEntry) {
            return false;
        }
        if (!VectorUtils.validateVector(embedding)) {
            throw new Error('Invalid embedding vector');
        }
        if (!content || content.trim().length === 0) {
            throw new Error('Content cannot be empty');
        }
        const updatedEntry = {
            ...existingEntry,
            embedding: VectorUtils.quantize(embedding),
            content,
            metadata,
            updatedAt: new Date().toISOString(),
        };
        this.vectors.set(id, updatedEntry);
        this.isDirty = true;
        logger.debug(`Updated vector for ID: ${id}`);
        return true;
    }
    /**
     * 获取向量
     */
    async getVector(id) {
        return this.vectors.get(id) || null;
    }
    /**
     * 获取所有向量ID
     */
    async getAllVectorIds() {
        return Array.from(this.vectors.keys());
    }
    /**
     * 获取向量数量
     */
    async getVectorCount() {
        return this.vectors.size;
    }
    /**
     * 清空所有向量
     */
    async clear() {
        this.vectors.clear();
        this.isDirty = true;
        logger.info('Cleared all vectors from store');
    }
    /**
     * 保存到文件
     */
    async save() {
        try {
            // 确保目录存在
            const dir = path.dirname(this.filePath);
            await fs.mkdir(dir, { recursive: true });
            // 转换为可序列化的格式
            const data = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                vectors: Array.from(this.vectors.entries()).map(([, entry]) => entry),
            };
            // 写入文件
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
            this.isDirty = false;
            logger.debug(`Saved ${this.vectors.size} vectors to ${this.filePath}`);
        }
        catch (error) {
            logger.error('Failed to save vector store:', error);
            throw error;
        }
    }
    /**
     * 从文件加载
     */
    async load() {
        try {
            const fileContent = await fs.readFile(this.filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            if (!data.vectors || !Array.isArray(data.vectors)) {
                throw new Error('Invalid vector store file format');
            }
            this.vectors.clear();
            for (const vectorData of data.vectors) {
                if (!vectorData.id || !vectorData.embedding || !vectorData.content) {
                    logger.warn('Skipping invalid vector entry:', vectorData);
                    continue;
                }
                const entry = {
                    id: vectorData.id,
                    embedding: vectorData.embedding,
                    content: vectorData.content,
                    metadata: vectorData.metadata,
                    createdAt: vectorData.createdAt,
                    updatedAt: vectorData.updatedAt,
                };
                this.vectors.set(entry.id, entry);
            }
            this.isDirty = false;
            logger.info(`Loaded ${this.vectors.size} vectors from ${this.filePath}`);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                logger.info('Vector store file not found, starting with empty store');
            }
            else {
                logger.error('Failed to load vector store:', error);
                throw error;
            }
        }
    }
    /**
     * 获取统计信息
     */
    async getStats() {
        const vectors = Array.from(this.vectors.values());
        const embeddings = vectors.map((v) => v.embedding);
        let totalSize = 0;
        try {
            const stats = await fs.stat(this.filePath);
            totalSize = stats.size;
        }
        catch (error) {
            // 文件不存在时忽略
        }
        const vectorStats = VectorUtils.computeStats(embeddings);
        return {
            totalVectors: this.vectors.size,
            averageDimensions: vectorStats.dimensions,
            storageSize: totalSize,
            lastUpdated: vectors.length > 0
                ? Math.max(...vectors.map((v) => new Date(v.updatedAt).getTime())).toString()
                : new Date().toISOString(),
        };
    }
    /**
     * 批量添加向量
     */
    async addVectors(vectors) {
        for (const vector of vectors) {
            await this.addVector(vector.id, vector.embedding, vector.content, vector.metadata);
        }
    }
    /**
     * 销毁存储（清理资源）
     */
    destroy() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        // 如果有未保存的更改，尝试保存
        if (this.isDirty && this.autoSave) {
            this.save().catch((error) => {
                logger.error('Failed to save during destroy:', error);
            });
        }
    }
}
//# sourceMappingURL=VectorStore.js.map
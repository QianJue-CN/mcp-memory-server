/**
 * 向量计算工具类
 */
export declare class VectorUtils {
    /**
     * 计算两个向量的余弦相似度
     */
    static cosineSimilarity(vectorA: number[], vectorB: number[]): number;
    /**
     * 计算欧几里得距离
     */
    static euclideanDistance(vectorA: number[], vectorB: number[]): number;
    /**
     * 计算曼哈顿距离
     */
    static manhattanDistance(vectorA: number[], vectorB: number[]): number;
    /**
     * 向量归一化（L2范数）
     */
    static normalize(vector: number[]): number[];
    /**
     * 计算向量的L2范数（欧几里得范数）
     */
    static l2Norm(vector: number[]): number;
    /**
     * 计算向量的L1范数（曼哈顿范数）
     */
    static l1Norm(vector: number[]): number;
    /**
     * 向量加法
     */
    static add(vectorA: number[], vectorB: number[]): number[];
    /**
     * 向量减法
     */
    static subtract(vectorA: number[], vectorB: number[]): number[];
    /**
     * 向量标量乘法
     */
    static multiply(vector: number[], scalar: number): number[];
    /**
     * 向量点积
     */
    static dotProduct(vectorA: number[], vectorB: number[]): number;
    /**
     * 批量计算相似度
     */
    static batchCosineSimilarity(queryVector: number[], vectors: number[][]): number[];
    /**
     * 找到最相似的向量索引
     */
    static findMostSimilar(queryVector: number[], vectors: number[][], threshold?: number): {
        index: number;
        similarity: number;
    } | null;
    /**
     * 找到前N个最相似的向量
     */
    static findTopSimilar(queryVector: number[], vectors: number[][], topK?: number, threshold?: number): Array<{
        index: number;
        similarity: number;
    }>;
    /**
     * 验证向量格式
     */
    static validateVector(vector: any): vector is number[];
    /**
     * 检查向量维度是否匹配
     */
    static checkDimensions(vectors: number[][]): boolean;
    /**
     * 计算向量集合的统计信息
     */
    static computeStats(vectors: number[][]): {
        count: number;
        dimensions: number;
        avgMagnitude: number;
        minMagnitude: number;
        maxMagnitude: number;
    };
    /**
     * 向量量化（减少精度以节省存储空间）
     */
    static quantize(vector: number[], precision?: number): number[];
    /**
     * 检查向量是否为零向量
     */
    static isZeroVector(vector: number[], tolerance?: number): boolean;
    /**
     * 生成随机向量（用于测试）
     */
    static generateRandomVector(dimensions: number, normalize?: boolean): number[];
}
//# sourceMappingURL=VectorUtils.d.ts.map
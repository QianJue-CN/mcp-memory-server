/**
 * 向量计算工具类
 */
export class VectorUtils {
  /**
   * 计算两个向量的余弦相似度
   */
  static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    if (vectorA.length === 0) {
      throw new Error('Vectors cannot be empty');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 计算欧几里得距离
   */
  static euclideanDistance(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * 计算曼哈顿距离
   */
  static manhattanDistance(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
      sum += Math.abs(vectorA[i] - vectorB[i]);
    }

    return sum;
  }

  /**
   * 向量归一化（L2范数）
   */
  static normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

    if (magnitude === 0) {
      throw new Error('Cannot normalize zero vector');
    }

    return vector.map((val) => val / magnitude);
  }

  /**
   * 计算向量的L2范数（欧几里得范数）
   */
  static l2Norm(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * 计算向量的L1范数（曼哈顿范数）
   */
  static l1Norm(vector: number[]): number {
    return vector.reduce((sum, val) => sum + Math.abs(val), 0);
  }

  /**
   * 向量加法
   */
  static add(vectorA: number[], vectorB: number[]): number[] {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vectorA.map((val, i) => val + vectorB[i]);
  }

  /**
   * 向量减法
   */
  static subtract(vectorA: number[], vectorB: number[]): number[] {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vectorA.map((val, i) => val - vectorB[i]);
  }

  /**
   * 向量标量乘法
   */
  static multiply(vector: number[], scalar: number): number[] {
    return vector.map((val) => val * scalar);
  }

  /**
   * 向量点积
   */
  static dotProduct(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vectorA.reduce((sum, val, i) => sum + val * vectorB[i], 0);
  }

  /**
   * 批量计算相似度
   */
  static batchCosineSimilarity(queryVector: number[], vectors: number[][]): number[] {
    return vectors.map((vector) => this.cosineSimilarity(queryVector, vector));
  }

  /**
   * 找到最相似的向量索引
   */
  static findMostSimilar(
    queryVector: number[],
    vectors: number[][],
    threshold: number = 0
  ): {
    index: number;
    similarity: number;
  } | null {
    let maxSimilarity = threshold;
    let bestIndex = -1;

    for (let i = 0; i < vectors.length; i++) {
      const similarity = this.cosineSimilarity(queryVector, vectors[i]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestIndex = i;
      }
    }

    return bestIndex >= 0 ? { index: bestIndex, similarity: maxSimilarity } : null;
  }

  /**
   * 找到前N个最相似的向量
   */
  static findTopSimilar(
    queryVector: number[],
    vectors: number[][],
    topK: number = 10,
    threshold: number = 0
  ): Array<{ index: number; similarity: number }> {
    const similarities = vectors.map((vector, index) => ({
      index,
      similarity: this.cosineSimilarity(queryVector, vector),
    }));

    return similarities
      .filter((item) => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * 验证向量格式
   */
  static validateVector(vector: any): vector is number[] {
    return (
      Array.isArray(vector) &&
      vector.length > 0 &&
      vector.every((val) => typeof val === 'number' && isFinite(val))
    );
  }

  /**
   * 检查向量维度是否匹配
   */
  static checkDimensions(vectors: number[][]): boolean {
    if (vectors.length === 0) return true;

    const expectedDim = vectors[0].length;
    return vectors.every((vector) => vector.length === expectedDim);
  }

  /**
   * 计算向量集合的统计信息
   */
  static computeStats(vectors: number[][]): {
    count: number;
    dimensions: number;
    avgMagnitude: number;
    minMagnitude: number;
    maxMagnitude: number;
  } {
    if (vectors.length === 0) {
      return {
        count: 0,
        dimensions: 0,
        avgMagnitude: 0,
        minMagnitude: 0,
        maxMagnitude: 0,
      };
    }

    const magnitudes = vectors.map((vector) => this.l2Norm(vector));

    return {
      count: vectors.length,
      dimensions: vectors[0].length,
      avgMagnitude: magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length,
      minMagnitude: Math.min(...magnitudes),
      maxMagnitude: Math.max(...magnitudes),
    };
  }

  /**
   * 向量量化（减少精度以节省存储空间）
   */
  static quantize(vector: number[], precision: number = 6): number[] {
    return vector.map((val) => parseFloat(val.toFixed(precision)));
  }

  /**
   * 检查向量是否为零向量
   */
  static isZeroVector(vector: number[], tolerance: number = 1e-10): boolean {
    return vector.every((val) => Math.abs(val) < tolerance);
  }

  /**
   * 生成随机向量（用于测试）
   */
  static generateRandomVector(dimensions: number, normalize: boolean = true): number[] {
    const vector = Array.from({ length: dimensions }, () => Math.random() - 0.5);
    return normalize ? this.normalize(vector) : vector;
  }
}

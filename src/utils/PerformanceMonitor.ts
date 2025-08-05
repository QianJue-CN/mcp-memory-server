/**
 * 性能监控系统
 */
export interface PerformanceMetrics {
  operation: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastExecuted: string;
}

export interface SystemMetrics {
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  timestamp: string;
}

export class PerformanceMonitor {
  private metrics: Map<
    string,
    {
      count: number;
      totalDuration: number;
      minDuration: number;
      maxDuration: number;
      lastExecuted: string;
    }
  > = new Map();

  private systemMetricsHistory: SystemMetrics[] = [];
  private maxHistorySize: number = 100;

  /**
   * 记录操作性能
   */
  recordOperation(operation: string, duration: number): void {
    const existing = this.metrics.get(operation);
    const now = new Date().toISOString();

    if (existing) {
      existing.count++;
      existing.totalDuration += duration;
      existing.minDuration = Math.min(existing.minDuration, duration);
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.lastExecuted = now;
    } else {
      this.metrics.set(operation, {
        count: 1,
        totalDuration: duration,
        minDuration: duration,
        maxDuration: duration,
        lastExecuted: now,
      });
    }
  }

  /**
   * 创建性能计时器
   */
  startTimer(operation: string): () => void {
    const startTime = process.hrtime.bigint();

    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
      this.recordOperation(operation, duration);
      return duration;
    };
  }

  /**
   * 获取操作性能指标
   */
  getOperationMetrics(operation?: string): PerformanceMetrics[] {
    const results: PerformanceMetrics[] = [];

    for (const [op, data] of this.metrics.entries()) {
      if (operation && op !== operation) continue;

      results.push({
        operation: op,
        count: data.count,
        totalDuration: data.totalDuration,
        averageDuration: data.totalDuration / data.count,
        minDuration: data.minDuration,
        maxDuration: data.maxDuration,
        lastExecuted: data.lastExecuted,
      });
    }

    return results.sort((a, b) => b.count - a.count);
  }

  /**
   * 记录系统指标
   */
  recordSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const metrics: SystemMetrics = {
      memoryUsage,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    this.systemMetricsHistory.push(metrics);

    // 限制历史记录大小
    if (this.systemMetricsHistory.length > this.maxHistorySize) {
      this.systemMetricsHistory = this.systemMetricsHistory.slice(-this.maxHistorySize);
    }

    return metrics;
  }

  /**
   * 获取系统指标历史
   */
  getSystemMetricsHistory(limit?: number): SystemMetrics[] {
    const history = this.systemMetricsHistory;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * 获取当前系统指标
   */
  getCurrentSystemMetrics(): SystemMetrics {
    return this.recordSystemMetrics();
  }

  /**
   * 获取性能摘要
   */
  getPerformanceSummary(): {
    totalOperations: number;
    uniqueOperations: number;
    averageOperationTime: number;
    slowestOperation: PerformanceMetrics | null;
    fastestOperation: PerformanceMetrics | null;
    mostFrequentOperation: PerformanceMetrics | null;
    systemMetrics: SystemMetrics;
  } {
    const operationMetrics = this.getOperationMetrics();
    const systemMetrics = this.getCurrentSystemMetrics();

    let totalOperations = 0;
    let totalDuration = 0;
    let slowestOperation: PerformanceMetrics | null = null;
    let fastestOperation: PerformanceMetrics | null = null;
    let mostFrequentOperation: PerformanceMetrics | null = null;

    for (const metric of operationMetrics) {
      totalOperations += metric.count;
      totalDuration += metric.totalDuration;

      if (!slowestOperation || metric.averageDuration > slowestOperation.averageDuration) {
        slowestOperation = metric;
      }

      if (!fastestOperation || metric.averageDuration < fastestOperation.averageDuration) {
        fastestOperation = metric;
      }

      if (!mostFrequentOperation || metric.count > mostFrequentOperation.count) {
        mostFrequentOperation = metric;
      }
    }

    return {
      totalOperations,
      uniqueOperations: operationMetrics.length,
      averageOperationTime: totalOperations > 0 ? totalDuration / totalOperations : 0,
      slowestOperation,
      fastestOperation,
      mostFrequentOperation,
      systemMetrics,
    };
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics.clear();
    this.systemMetricsHistory = [];
  }

  /**
   * 清理旧的指标数据
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAge);

    // 清理系统指标历史
    this.systemMetricsHistory = this.systemMetricsHistory.filter(
      (metric) => new Date(metric.timestamp) > cutoffTime
    );

    // 清理操作指标（如果最后执行时间超过阈值）
    for (const [operation, data] of this.metrics.entries()) {
      if (new Date(data.lastExecuted) < cutoffTime) {
        this.metrics.delete(operation);
      }
    }
  }

  /**
   * 导出性能数据
   */
  exportData(): {
    operationMetrics: PerformanceMetrics[];
    systemMetricsHistory: SystemMetrics[];
    summary: {
      totalOperations: number;
      uniqueOperations: number;
      averageOperationTime: number;
      slowestOperation: PerformanceMetrics | null;
      fastestOperation: PerformanceMetrics | null;
      mostFrequentOperation: PerformanceMetrics | null;
      systemMetrics: SystemMetrics;
    };
  } {
    return {
      operationMetrics: this.getOperationMetrics(),
      systemMetricsHistory: this.getSystemMetricsHistory(),
      summary: this.getPerformanceSummary(),
    };
  }

  /**
   * 启动定期系统指标收集
   */
  startSystemMetricsCollection(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.recordSystemMetrics();
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

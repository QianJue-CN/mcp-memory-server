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
export declare class PerformanceMonitor {
    private metrics;
    private systemMetricsHistory;
    private maxHistorySize;
    /**
     * 记录操作性能
     */
    recordOperation(operation: string, duration: number): void;
    /**
     * 创建性能计时器
     */
    startTimer(operation: string): () => void;
    /**
     * 获取操作性能指标
     */
    getOperationMetrics(operation?: string): PerformanceMetrics[];
    /**
     * 记录系统指标
     */
    recordSystemMetrics(): SystemMetrics;
    /**
     * 获取系统指标历史
     */
    getSystemMetricsHistory(limit?: number): SystemMetrics[];
    /**
     * 获取当前系统指标
     */
    getCurrentSystemMetrics(): SystemMetrics;
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
    };
    /**
     * 重置所有指标
     */
    reset(): void;
    /**
     * 清理旧的指标数据
     */
    cleanup(maxAge?: number): void;
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
    };
    /**
     * 启动定期系统指标收集
     */
    startSystemMetricsCollection(intervalMs?: number): () => void;
}
export declare const performanceMonitor: PerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.d.ts.map
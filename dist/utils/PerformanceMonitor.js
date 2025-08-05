export class PerformanceMonitor {
    metrics = new Map();
    systemMetricsHistory = [];
    maxHistorySize = 100;
    /**
     * 记录操作性能
     */
    recordOperation(operation, duration) {
        const existing = this.metrics.get(operation);
        const now = new Date().toISOString();
        if (existing) {
            existing.count++;
            existing.totalDuration += duration;
            existing.minDuration = Math.min(existing.minDuration, duration);
            existing.maxDuration = Math.max(existing.maxDuration, duration);
            existing.lastExecuted = now;
        }
        else {
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
    startTimer(operation) {
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
    getOperationMetrics(operation) {
        const results = [];
        for (const [op, data] of this.metrics.entries()) {
            if (operation && op !== operation)
                continue;
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
    recordSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        const metrics = {
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
    getSystemMetricsHistory(limit) {
        const history = this.systemMetricsHistory;
        return limit ? history.slice(-limit) : history;
    }
    /**
     * 获取当前系统指标
     */
    getCurrentSystemMetrics() {
        return this.recordSystemMetrics();
    }
    /**
     * 获取性能摘要
     */
    getPerformanceSummary() {
        const operationMetrics = this.getOperationMetrics();
        const systemMetrics = this.getCurrentSystemMetrics();
        let totalOperations = 0;
        let totalDuration = 0;
        let slowestOperation = null;
        let fastestOperation = null;
        let mostFrequentOperation = null;
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
    reset() {
        this.metrics.clear();
        this.systemMetricsHistory = [];
    }
    /**
     * 清理旧的指标数据
     */
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
        const cutoffTime = new Date(Date.now() - maxAge);
        // 清理系统指标历史
        this.systemMetricsHistory = this.systemMetricsHistory.filter((metric) => new Date(metric.timestamp) > cutoffTime);
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
    exportData() {
        return {
            operationMetrics: this.getOperationMetrics(),
            systemMetricsHistory: this.getSystemMetricsHistory(),
            summary: this.getPerformanceSummary(),
        };
    }
    /**
     * 启动定期系统指标收集
     */
    startSystemMetricsCollection(intervalMs = 60000) {
        const interval = setInterval(() => {
            this.recordSystemMetrics();
        }, intervalMs);
        return () => clearInterval(interval);
    }
}
// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();
//# sourceMappingURL=PerformanceMonitor.js.map
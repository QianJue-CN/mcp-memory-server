/**
 * 结构化日志系统
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    logLevel;
    logEntries = [];
    maxLogEntries;
    constructor(logLevel = LogLevel.INFO, maxLogEntries = 1000) {
        this.logLevel = logLevel;
        this.maxLogEntries = maxLogEntries;
    }
    /**
     * 记录调试信息
     */
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    /**
     * 记录信息
     */
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    /**
     * 记录警告
     */
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    /**
     * 记录错误
     */
    error(message, error, context) {
        this.log(LogLevel.ERROR, message, context, undefined, undefined, error);
    }
    /**
     * 记录操作性能
     */
    logOperation(operation, duration, context) {
        this.log(LogLevel.INFO, `Operation completed: ${operation}`, context, operation, duration);
    }
    /**
     * 创建性能计时器
     */
    startTimer(operation) {
        const startTime = Date.now();
        return () => {
            const duration = Date.now() - startTime;
            this.logOperation(operation, duration);
        };
    }
    /**
     * 获取日志条目
     */
    getLogs(level, limit) {
        let logs = this.logEntries;
        if (level !== undefined) {
            logs = logs.filter((entry) => entry.level >= level);
        }
        if (limit !== undefined) {
            logs = logs.slice(-limit);
        }
        return logs;
    }
    /**
     * 清空日志
     */
    clearLogs() {
        this.logEntries = [];
    }
    /**
     * 设置日志级别
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * 获取日志统计
     */
    getLogStats() {
        const stats = {
            total: this.logEntries.length,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
        };
        for (const entry of this.logEntries) {
            switch (entry.level) {
                case LogLevel.DEBUG:
                    stats.debug++;
                    break;
                case LogLevel.INFO:
                    stats.info++;
                    break;
                case LogLevel.WARN:
                    stats.warn++;
                    break;
                case LogLevel.ERROR:
                    stats.error++;
                    break;
            }
        }
        return stats;
    }
    /**
     * 导出日志为 JSON
     */
    exportLogs() {
        return JSON.stringify(this.logEntries, null, 2);
    }
    /**
     * 私有日志方法
     */
    log(level, message, context, operation, duration, error) {
        if (level < this.logLevel) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            operation,
            duration,
            error,
        };
        this.logEntries.push(entry);
        // 限制日志条目数量
        if (this.logEntries.length > this.maxLogEntries) {
            this.logEntries = this.logEntries.slice(-this.maxLogEntries);
        }
        // 输出到控制台
        this.outputToConsole(entry);
    }
    /**
     * 输出到控制台
     */
    outputToConsole(entry) {
        const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const levelName = levelNames[entry.level];
        const logData = {
            timestamp: entry.timestamp,
            level: levelName,
            message: entry.message,
            ...(entry.context && { context: entry.context }),
            ...(entry.operation && { operation: entry.operation }),
            ...(entry.duration !== undefined && { duration: `${entry.duration}ms` }),
            ...(entry.error && { error: entry.error.message, stack: entry.error.stack }),
        };
        const logString = JSON.stringify(logData);
        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(logString);
                break;
            case LogLevel.INFO:
                console.info(logString);
                break;
            case LogLevel.WARN:
                console.warn(logString);
                break;
            case LogLevel.ERROR:
                console.error(logString);
                break;
        }
    }
}
// 全局日志实例
export const logger = new Logger();
//# sourceMappingURL=Logger.js.map
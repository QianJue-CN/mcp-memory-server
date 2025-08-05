/**
 * 结构化日志系统
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    operation?: string;
    duration?: number;
    error?: Error;
}
export declare class Logger {
    private logLevel;
    private logEntries;
    private maxLogEntries;
    constructor(logLevel?: LogLevel, maxLogEntries?: number);
    /**
     * 记录调试信息
     */
    debug(message: string, context?: Record<string, any>): void;
    /**
     * 记录信息
     */
    info(message: string, context?: Record<string, any>): void;
    /**
     * 记录警告
     */
    warn(message: string, context?: Record<string, any>): void;
    /**
     * 记录错误
     */
    error(message: string, error?: Error, context?: Record<string, any>): void;
    /**
     * 记录操作性能
     */
    logOperation(operation: string, duration: number, context?: Record<string, any>): void;
    /**
     * 创建性能计时器
     */
    startTimer(operation: string): () => void;
    /**
     * 获取日志条目
     */
    getLogs(level?: LogLevel, limit?: number): LogEntry[];
    /**
     * 清空日志
     */
    clearLogs(): void;
    /**
     * 设置日志级别
     */
    setLogLevel(level: LogLevel): void;
    /**
     * 获取日志统计
     */
    getLogStats(): {
        total: number;
        debug: number;
        info: number;
        warn: number;
        error: number;
    };
    /**
     * 导出日志为 JSON
     */
    exportLogs(): string;
    /**
     * 私有日志方法
     */
    private log;
    /**
     * 输出到控制台
     */
    private outputToConsole;
}
export declare const logger: Logger;
//# sourceMappingURL=Logger.d.ts.map
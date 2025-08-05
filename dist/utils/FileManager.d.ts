import { StorageConfig } from '../types/memory.js';
export declare class FileManager {
    private config;
    private locks;
    constructor(config: StorageConfig);
    /**
     * 确保存储目录存在
     */
    ensureStorageDirectory(): Promise<void>;
    /**
     * 获取全局记忆文件路径
     */
    getGlobalMemoryFilePath(): string;
    /**
     * 获取对话记忆文件路径
     */
    getConversationMemoryFilePath(conversationId: string): string;
    /**
     * 安全地读取 JSON 文件
     */
    readJsonFile<T = any>(filePath: string): Promise<T[]>;
    /**
     * 安全地写入 JSON 文件
     */
    writeJsonFile<T = any>(filePath: string, data: T[]): Promise<void>;
    /**
     * 创建文件备份
     */
    private createBackup;
    /**
     * 删除文件
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * 获取文件统计信息
     */
    getFileStats(filePath: string): Promise<{
        size: number;
        exists: boolean;
    }>;
    /**
     * 列出所有记忆文件
     */
    listMemoryFiles(): Promise<string[]>;
    /**
     * 清理旧的对话文件
     */
    cleanupOldConversations(maxAge?: number): Promise<number>;
}
//# sourceMappingURL=FileManager.d.ts.map
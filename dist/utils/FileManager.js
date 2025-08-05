import * as fs from 'fs/promises';
import * as path from 'path';
import * as lockfile from 'proper-lockfile';
export class FileManager {
    config;
    locks = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * 确保存储目录存在
     */
    async ensureStorageDirectory() {
        try {
            await fs.access(this.config.storagePath);
        }
        catch {
            await fs.mkdir(this.config.storagePath, { recursive: true });
        }
    }
    /**
     * 获取全局记忆文件路径
     */
    getGlobalMemoryFilePath() {
        return path.join(this.config.storagePath, this.config.globalMemoryFile);
    }
    /**
     * 获取对话记忆文件路径
     */
    getConversationMemoryFilePath(conversationId) {
        return path.join(this.config.storagePath, `${this.config.conversationFilePrefix}${conversationId}.json`);
    }
    /**
     * 安全地读取 JSON 文件
     */
    async readJsonFile(filePath) {
        await this.ensureStorageDirectory();
        try {
            // 检查文件是否存在
            await fs.access(filePath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在，返回空数组
                return [];
            }
            throw error;
        }
        // 文件存在，获取文件锁
        const release = await lockfile.lock(filePath, {
            retries: 3,
            stale: 5000,
        });
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        }
        finally {
            await release();
        }
    }
    /**
     * 安全地写入 JSON 文件
     */
    async writeJsonFile(filePath, data) {
        await this.ensureStorageDirectory();
        // 检查文件大小限制
        const jsonString = JSON.stringify(data, null, 2);
        if (jsonString.length > this.config.maxFileSize) {
            throw new Error(`File size exceeds maximum limit of ${this.config.maxFileSize} bytes`);
        }
        // 如果文件不存在，先创建一个空文件
        try {
            await fs.access(filePath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(filePath, '[]', 'utf-8');
            }
        }
        // 获取文件锁
        const release = await lockfile.lock(filePath, {
            retries: 3,
            stale: 5000,
        });
        try {
            // 如果启用备份，先创建备份
            if (this.config.backupEnabled) {
                await this.createBackup(filePath);
            }
            await fs.writeFile(filePath, jsonString, 'utf-8');
        }
        finally {
            await release();
        }
    }
    /**
     * 创建文件备份
     */
    async createBackup(filePath) {
        try {
            await fs.access(filePath);
            const backupPath = `${filePath}.backup`;
            await fs.copyFile(filePath, backupPath);
        }
        catch (error) {
            // 如果原文件不存在，忽略备份错误
            if (error.code !== 'ENOENT') {
                console.warn(`Failed to create backup for ${filePath}:`, error);
            }
        }
    }
    /**
     * 删除文件
     */
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    /**
     * 获取文件统计信息
     */
    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return { size: stats.size, exists: true };
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return { size: 0, exists: false };
            }
            throw error;
        }
    }
    /**
     * 列出所有记忆文件
     */
    async listMemoryFiles() {
        try {
            await this.ensureStorageDirectory();
            const files = await fs.readdir(this.config.storagePath);
            return files.filter((file) => file.endsWith('.json') &&
                (file === this.config.globalMemoryFile ||
                    file.startsWith(this.config.conversationFilePrefix)));
        }
        catch (error) {
            console.warn('Failed to list memory files:', error);
            return [];
        }
    }
    /**
     * 清理旧的对话文件
     */
    async cleanupOldConversations(maxAge = 30 * 24 * 60 * 60 * 1000) {
        const files = await this.listMemoryFiles();
        const now = Date.now();
        let deletedCount = 0;
        for (const file of files) {
            if (file.startsWith(this.config.conversationFilePrefix)) {
                const filePath = path.join(this.config.storagePath, file);
                try {
                    const stats = await fs.stat(filePath);
                    if (now - stats.mtime.getTime() > maxAge) {
                        await this.deleteFile(filePath);
                        deletedCount++;
                    }
                }
                catch (error) {
                    console.warn(`Failed to check file age for ${file}:`, error);
                }
            }
        }
        return deletedCount;
    }
}
//# sourceMappingURL=FileManager.js.map
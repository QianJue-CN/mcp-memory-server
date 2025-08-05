import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MemoryManager } from '../memory/MemoryManager.js';
export declare class MemoryTools {
    private memoryManager;
    constructor(memoryManager: MemoryManager);
    /**
     * 获取所有工具定义
     */
    getToolDefinitions(): Tool[];
    /**
     * 调用指定的工具
     */
    callTool(name: string, args: any): Promise<any>;
    /**
     * 创建记忆工具实现
     */
    private createMemory;
    /**
     * 读取记忆工具实现
     */
    private readMemories;
    /**
     * 更新记忆工具实现
     */
    private updateMemory;
    /**
     * 删除记忆工具实现
     */
    private deleteMemory;
    /**
     * 设置存储路径工具实现
     */
    private setStoragePath;
    /**
     * 获取记忆统计工具实现
     */
    private getMemoryStats;
    /**
     * 清理旧对话工具实现
     */
    private cleanupOldConversations;
    /**
     * 列出记忆工具实现 - 智能过滤当前对话和全局记忆
     */
    private listMemories;
    /**
     * 高级查询记忆工具实现
     */
    private queryMemories;
    /**
     * 获取增强统计信息工具实现
     */
    private getEnhancedStats;
    /**
     * 配置嵌入提供商工具实现
     */
    private configureEmbedding;
    /**
     * 语义搜索工具实现
     */
    private semanticSearch;
    /**
     * 生成嵌入向量工具实现
     */
    private generateEmbeddings;
    /**
     * 计算相似度工具实现
     */
    private calculateSimilarity;
    /**
     * 获取向量统计信息工具实现
     */
    private getVectorStats;
}
//# sourceMappingURL=MemoryTools.d.ts.map
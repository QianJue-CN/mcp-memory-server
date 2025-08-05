import { z } from 'zod';
// 记忆类型枚举
export var MemoryType;
(function (MemoryType) {
    MemoryType["GLOBAL"] = "global";
    MemoryType["CONVERSATION"] = "conversation";
    MemoryType["TEMPORARY"] = "temporary";
})(MemoryType || (MemoryType = {}));
// 记忆条目的 Zod 模式
export const MemoryEntrySchema = z.object({
    id: z.string().uuid(),
    content: z.string().min(1),
    type: z.nativeEnum(MemoryType),
    conversationId: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    embedding: z.array(z.number()).optional(), // 添加可选的嵌入向量字段
});
// 创建记忆的输入模式
export const CreateMemoryInputSchema = z.object({
    content: z.string().min(1),
    type: z.nativeEnum(MemoryType).default(MemoryType.CONVERSATION),
    conversationId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});
// 更新记忆的输入模式
export const UpdateMemoryInputSchema = z.object({
    content: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});
// 查询记忆的过滤器模式
export const MemoryFilterSchema = z.object({
    type: z.nativeEnum(MemoryType).optional(),
    conversationId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    searchText: z.string().optional(),
    limit: z.number().int().positive().optional(),
    offset: z.number().int().nonnegative().optional(),
});
// 记忆存储配置
export const StorageConfigSchema = z.object({
    storagePath: z.string(),
    globalMemoryFile: z.string().default('global_memories.json'),
    conversationFilePrefix: z.string().default('conversation_'),
    maxFileSize: z
        .number()
        .int()
        .positive()
        .default(10 * 1024 * 1024), // 10MB
    backupEnabled: z.boolean().default(true),
});
//# sourceMappingURL=memory.js.map
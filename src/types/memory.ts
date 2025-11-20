import { z } from 'zod';

// 记忆类型枚举
export enum MemoryType {
  GLOBAL = 'global',
  CONVERSATION = 'conversation',
  TEMPORARY = 'temporary',
}

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

// 记忆条目类型
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

// 创建记忆的输入模式
export const CreateMemoryInputSchema = z.object({
  content: z.string().min(1),
  type: z.nativeEnum(MemoryType).default(MemoryType.CONVERSATION),
  conversationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateMemoryInput = z.infer<typeof CreateMemoryInputSchema>;

// 更新记忆的输入模式
export const UpdateMemoryInputSchema = z.object({
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateMemoryInput = z.infer<typeof UpdateMemoryInputSchema>;

// 查询记忆的过滤器模式
export const MemoryFilterSchema = z.object({
  type: z.nativeEnum(MemoryType).optional(),
  conversationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchText: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type MemoryFilter = z.infer<typeof MemoryFilterSchema>;

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

export type StorageConfig = z.infer<typeof StorageConfigSchema>;

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 记忆统计信息
export interface MemoryStats {
  totalMemories: number;
  globalMemories: number;
  conversationMemories: number;
  temporaryMemories: number;
  storageSize: number;
}

// ==================== 文件夹管理相关类型 ====================

// 文件夹信息
export interface FolderInfo {
  path: string; // 文件夹路径,如 "工作/项目A"
  name: string; // 文件夹名称
  createdAt: string; // 创建时间
  memoryCount: number; // 包含的记忆数量
  parentPath?: string; // 父文件夹路径
}

// 创建文件夹的输入模式
export const CreateFolderInputSchema = z.object({
  folderPath: z.string().min(1),
  description: z.string().optional(),
});

export type CreateFolderInput = z.infer<typeof CreateFolderInputSchema>;

// 重命名文件夹的输入模式
export const RenameFolderInputSchema = z.object({
  oldPath: z.string().min(1),
  newPath: z.string().min(1),
});

export type RenameFolderInput = z.infer<typeof RenameFolderInputSchema>;

// 删除文件夹的输入模式
export const DeleteFolderInputSchema = z.object({
  folderPath: z.string().min(1),
  deleteMemories: z.boolean().default(false), // 是否删除文件夹内的记忆
});

export type DeleteFolderInput = z.infer<typeof DeleteFolderInputSchema>;

// 文件夹列表响应
export interface FolderListResponse {
  folders: FolderInfo[];
  totalFolders: number;
}

import { z } from 'zod';
export declare enum MemoryType {
    GLOBAL = "global",
    CONVERSATION = "conversation",
    TEMPORARY = "temporary"
}
export declare const MemoryEntrySchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    type: z.ZodNativeEnum<typeof MemoryType>;
    conversationId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    type: MemoryType;
    createdAt: string;
    updatedAt: string;
    conversationId?: string | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}, {
    id: string;
    content: string;
    type: MemoryType;
    createdAt: string;
    updatedAt: string;
    conversationId?: string | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}>;
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
export declare const CreateMemoryInputSchema: z.ZodObject<{
    content: z.ZodString;
    type: z.ZodDefault<z.ZodNativeEnum<typeof MemoryType>>;
    conversationId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    type: MemoryType;
    conversationId?: string | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    content: string;
    type?: MemoryType | undefined;
    conversationId?: string | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type CreateMemoryInput = z.infer<typeof CreateMemoryInputSchema>;
export declare const UpdateMemoryInputSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    content?: string | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type UpdateMemoryInput = z.infer<typeof UpdateMemoryInputSchema>;
export declare const MemoryFilterSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodNativeEnum<typeof MemoryType>>;
    conversationId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    searchText: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: MemoryType | undefined;
    conversationId?: string | undefined;
    tags?: string[] | undefined;
    searchText?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    type?: MemoryType | undefined;
    conversationId?: string | undefined;
    tags?: string[] | undefined;
    searchText?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type MemoryFilter = z.infer<typeof MemoryFilterSchema>;
export declare const StorageConfigSchema: z.ZodObject<{
    storagePath: z.ZodString;
    globalMemoryFile: z.ZodDefault<z.ZodString>;
    conversationFilePrefix: z.ZodDefault<z.ZodString>;
    maxFileSize: z.ZodDefault<z.ZodNumber>;
    backupEnabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    storagePath: string;
    globalMemoryFile: string;
    conversationFilePrefix: string;
    maxFileSize: number;
    backupEnabled: boolean;
}, {
    storagePath: string;
    globalMemoryFile?: string | undefined;
    conversationFilePrefix?: string | undefined;
    maxFileSize?: number | undefined;
    backupEnabled?: boolean | undefined;
}>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface MemoryStats {
    totalMemories: number;
    globalMemories: number;
    conversationMemories: number;
    temporaryMemories: number;
    storageSize: number;
}
//# sourceMappingURL=memory.d.ts.map
# MCP Memory Server

一个基于 Model Context Protocol (MCP) 的智能记忆管理服务器，为 AI 模型提供持久化记忆存储和强大的向量搜索功能。

## 🌟 功能特性

### 核心功能
- **CRUD 操作**：创建、读取、更新、删除记忆条目
- **多种记忆类型**：支持全局记忆、对话记忆和临时记忆
- **文件夹管理**:创建、删除、重命名文件夹,组织和分类记忆
- **灵活存储**：用户可自定义存储路径
- **JSON 格式**：使用 JSON 格式存储，便于读取和备份

### 🎯 向量搜索功能
- **语义搜索**：基于含义而非关键词的智能搜索
- **混合搜索**：结合语义搜索和关键词搜索
- **多提供商支持**：支持 Ollama、Gemini、OpenAI 等嵌入模型
- **自动向量化**：创建记忆时自动生成嵌入向量
- **相似度计算**：计算任意两个文本的语义相似度
- **高性能**：内存缓存 + 文件持久化

### 高级功能
- **内存缓存**：提高读取性能
- **索引系统**：快速搜索和过滤
- **性能监控**：实时性能指标
- **文件管理**：自动备份和恢复
- **完整的错误处理**：稳定可靠的运行

## 📦 安装

### 从 NPM 安装 (推荐)

```bash
npm install @qianjue/mcp-memory-server
```

### 从源码安装

```bash
# 克隆项目
git clone https://github.com/QianJue-CN/mcp-memory-server.git
cd mcp-memory-server

# 安装依赖
npm install

# 构建项目
npm run build
```

## 🚀 快速开始

### MCP 服务器配置

在您的MCP客户端配置文件中添加此服务器：

#### Claude Desktop 配置 (config.json)

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "node",
      "args": ["path/to/mcp-memory-server/dist/index.js"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "/path/to/your/memory/storage"
      }
    }
  }
}
```

#### 使用 NPM 包

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "npx",
      "args": ["@qianjue/mcp-memory-server"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "/path/to/your/memory/storage"
      }
    }
  }
}
```

#### 配置选项

**基础配置**
- `MCP_MEMORY_STORAGE_PATH`: 自定义存储目录路径
- `LOG_LEVEL`: 日志级别 (debug/info/warn/error)

**向量模型配置**
- `MCP_EMBEDDING_PROVIDER`: 嵌入提供商 (ollama/gemini/openai)
- `MCP_EMBEDDING_API_KEY`: 嵌入提供商的API密钥
- `MCP_EMBEDDING_MODEL`: 嵌入模型名称（如未配置则使用默认模型）
- `MCP_EMBEDDING_BASE_URL`: 嵌入服务基础URL（如未配置则使用默认URL）
- `MCP_EMBEDDING_DIMENSIONS`: 向量维度（如未配置则使用模型默认维度）
- `MCP_EMBEDDING_TIMEOUT`: 请求超时时间，单位毫秒（默认：30000）
- `MCP_EMBEDDING_MAX_RETRIES`: 最大重试次数（默认：3）

### 基础使用

```bash
# 直接启动服务器
npm start

# 或从dist目录运行
node dist/index.js
```

### 向量搜索快速开始

#### 1. 配置嵌入提供商

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "configure_embedding",
    "arguments": {
      "provider": "gemini",
      "apiKey": "your-gemini-api-key",
      "baseUrl": "https://generativelanguage.googleapis.com",
      "model": "text-embedding-004"
    }
  }
}
```

#### 2. 创建记忆（自动生成向量）

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_memory",
    "arguments": {
      "content": "我正在学习JavaScript编程",
      "type": "global",
      "tags": ["编程", "学习"]
    }
  }
}
```

#### 3. 语义搜索

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "semantic_search",
    "arguments": {
      "query": "编程学习",
      "limit": 5,
      "threshold": 0.7
    }
  }
}
```

## 📚 MCP 工具函数

### 基础记忆管理

#### 1. create_memory
创建新的记忆条目

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_memory",
    "arguments": {
      "content": "记忆内容",
      "type": "global",
      "tags": ["标签1", "标签2"],
      "metadata": {"key": "value"}
    }
  }
}
```

#### 2. read_memories
读取记忆条目

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "read_memories",
    "arguments": {
      "type": "global",
      "limit": 10,
      "searchText": "搜索关键词"
    }
  }
}
```

#### 3. update_memory
更新记忆条目

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "update_memory",
    "arguments": {
      "id": "memory-id",
      "content": "更新后的内容"
    }
  }
}
```

#### 4. delete_memory
删除记忆条目

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "delete_memory",
    "arguments": {
      "id": "memory-id"
    }
  }
}
```

### 向量搜索工具

#### 1. configure_embedding
配置嵌入模型提供商

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "configure_embedding",
    "arguments": {
      "provider": "gemini",
      "apiKey": "your-gemini-api-key",
      "baseUrl": "https://generativelanguage.googleapis.com",
      "model": "text-embedding-004"
    }
  }
}
```

#### 2. semantic_search
语义相似性搜索

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "semantic_search",
    "arguments": {
      "query": "编程学习",
      "limit": 5,
      "threshold": 0.7,
      "hybridSearch": false
    }
  }
}
```

#### 3. generate_embeddings
为现有记忆生成嵌入向量

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "generate_embeddings",
    "arguments": {}
  }
}
```

#### 4. calculate_similarity
计算两个文本的相似度

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "calculate_similarity",
    "arguments": {
      "text1": "学习编程",
      "text2": "写代码"
    }
  }
}
```

#### 5. get_vector_stats
获取向量存储统计信息

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_vector_stats",
    "arguments": {}
  }
}
```

### 文件夹管理工具

#### 1. create_folder
创建新的记忆文件夹

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_folder",
    "arguments": {
      "folderPath": "工作/项目A",
      "description": "项目A相关的记忆"
    }
  }
}
```

**参数说明:**
- `folderPath`: 文件夹路径,支持多级路径(如 "工作/项目A/文档")
- `description`: 可选的文件夹描述

**使用场景:**
- 组织不同项目的记忆
- 按主题分类记忆
- 创建层级化的记忆结构

#### 2. delete_folder
删除文件夹

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "delete_folder",
    "arguments": {
      "folderPath": "工作/项目A",
      "deleteMemories": false
    }
  }
}
```

**参数说明:**
- `folderPath`: 要删除的文件夹路径
- `deleteMemories`: 是否同时删除文件夹内的所有记忆(默认: false)
  - `true`: 删除文件夹及其所有记忆
  - `false`: 只删除文件夹,记忆保留但移除文件夹标注

**注意事项:**
- 删除文件夹前请确认是否需要保留记忆
- 设置 `deleteMemories: true` 将永久删除文件夹内的所有记忆

#### 3. rename_folder
重命名文件夹

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "rename_folder",
    "arguments": {
      "oldPath": "工作/项目A",
      "newPath": "工作/项目Alpha"
    }
  }
}
```

**参数说明:**
- `oldPath`: 当前文件夹路径
- `newPath`: 新的文件夹路径

**功能特性:**
- 自动更新文件夹内所有记忆的元数据
- 确保重命名操作的原子性
- 防止数据不一致

**重要提示:**
重命名文件夹时,系统会自动同步更新该文件夹内所有记忆的 `metadata.folderPath` 字段,确保记忆与文件夹的关联关系正确。

#### 4. list_folders
列出所有文件夹

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "list_folders",
    "arguments": {}
  }
}
```

**返回信息:**
- 文件夹路径
- 文件夹名称
- 创建时间
- 包含的记忆数量
- 父文件夹路径

### 在记忆中使用文件夹

创建记忆时,可以通过 `metadata.folderPath` 字段指定文件夹:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_memory",
    "arguments": {
      "content": "项目A的需求文档已完成",
      "type": "conversation",
      "tags": ["项目", "文档"],
      "metadata": {
        "folderPath": "工作/项目A",
        "priority": "high"
      }
    }
  }
}
```

**注意事项:**
- 全局记忆(type: "global")不需要文件夹标注
- 文件夹路径会自动存储在记忆的 `metadata.folderPath` 字段中
- 重命名文件夹时,所有相关记忆的文件夹路径会自动更新

## 🔧 配置

### 嵌入提供商配置

#### Ollama (本地模型)
```json
{
  "provider": "ollama",
  "baseUrl": "http://localhost:11434",
  "model": "nomic-embed-text",
  "dimensions": 768
}
```

#### Gemini API
```json
{
  "provider": "gemini",
  "apiKey": "your-gemini-api-key",
  "baseUrl": "https://generativelanguage.googleapis.com",
  "model": "text-embedding-004",
  "dimensions": 768
}
```

#### OpenAI API
```json
{
  "provider": "openai",
  "apiKey": "your-openai-api-key",
  "model": "text-embedding-3-small",
  "dimensions": 1536
}
```

### 完整配置示例

以下是在 Claude Desktop 中配置 MCP Memory Server 的完整示例：

#### 基础配置（仅记忆功能）

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "npx",
      "args": ["@qianjue/mcp-memory-server"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "~/Documents/AI-Memory",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### 完整配置（包含向量搜索）

**使用 Gemini 嵌入模型：**

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "npx",
      "args": ["@qianjue/mcp-memory-server"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "~/Documents/AI-Memory",
        "MCP_EMBEDDING_PROVIDER": "gemini",
        "MCP_EMBEDDING_API_KEY": "your-gemini-api-key",
        "MCP_EMBEDDING_MODEL": "text-embedding-004",
        "MCP_EMBEDDING_BASE_URL": "https://generativelanguage.googleapis.com",
        "MCP_EMBEDDING_DIMENSIONS": "768",
        "MCP_EMBEDDING_TIMEOUT": "30000",
        "MCP_EMBEDDING_MAX_RETRIES": "3",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**使用 OpenAI 嵌入模型：**

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "npx",
      "args": ["@qianjue/mcp-memory-server"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "~/Documents/AI-Memory",
        "MCP_EMBEDDING_PROVIDER": "openai",
        "MCP_EMBEDDING_API_KEY": "your-openai-api-key",
        "MCP_EMBEDDING_MODEL": "text-embedding-3-small",
        "MCP_EMBEDDING_BASE_URL": "https://api.openai.com",
        "MCP_EMBEDDING_DIMENSIONS": "1536",
        "MCP_EMBEDDING_TIMEOUT": "30000",
        "MCP_EMBEDDING_MAX_RETRIES": "3",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**使用 Ollama 本地模型：**

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "npx",
      "args": ["@qianjue/mcp-memory-server"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "~/Documents/AI-Memory",
        "MCP_EMBEDDING_PROVIDER": "ollama",
        "MCP_EMBEDDING_MODEL": "nomic-embed-text",
        "MCP_EMBEDDING_BASE_URL": "http://localhost:11434",
        "MCP_EMBEDDING_DIMENSIONS": "768",
        "MCP_EMBEDDING_TIMEOUT": "30000",
        "MCP_EMBEDDING_MAX_RETRIES": "3",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### 默认值说明

如果未配置相应的环境变量，系统将使用以下默认值：

| 提供商     | 默认模型                 | 默认URL                                     | 默认维度 |
| ---------- | ------------------------ | ------------------------------------------- | -------- |
| **Gemini** | `embedding-001`          | `https://generativelanguage.googleapis.com` | 768      |
| **OpenAI** | `text-embedding-3-small` | `https://api.openai.com`                    | 1536     |
| **Ollama** | `nomic-embed-text`       | `http://localhost:11434`                    | 768      |

- **超时时间**：默认 30000 毫秒（30秒）
- **最大重试次数**：默认 3 次

#### 配置后的效果

添加配置后：
1. 重启 Claude Desktop
2. 记忆服务器将提供所有11个工具
3. 如果配置了向量模型环境变量，向量搜索将自动启用
4. 记忆将存储在指定目录中
5. 无需手动调用 `configure_embedding` 工具

## 📊 数据结构

### MemoryEntry
```typescript
interface MemoryEntry {
  id: string;              // UUID
  content: string;         // 记忆内容
  type: MemoryType;        // 记忆类型
  conversationId?: string; // 对话 ID（可选）
  createdAt: string;       // 创建时间 (ISO 8601)
  updatedAt: string;       // 更新时间 (ISO 8601)
  tags?: string[];         // 标签数组
  metadata?: object;       // 元数据对象
  embedding?: number[];    // 嵌入向量（可选）
}
```

### MemoryType
```typescript
enum MemoryType {
  GLOBAL = 'global',           // 全局记忆
  CONVERSATION = 'conversation', // 对话记忆
  TEMPORARY = 'temporary'      // 临时记忆
}
```

## 🏗️ 项目结构

```
src/
├── types/          # 类型定义
│   ├── memory.ts   # 记忆相关类型
│   └── vector.ts   # 向量相关类型
├── memory/         # 记忆管理核心
├── embedding/      # 嵌入模型提供商
│   ├── EmbeddingProvider.ts
│   ├── EmbeddingManager.ts
│   └── providers/  # 各个提供商实现
├── vector/         # 向量存储和计算
│   ├── VectorStore.ts
│   └── VectorUtils.ts
├── utils/          # 工具类
├── tools/          # MCP 工具接口
└── index.ts        # 服务器入口
```

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 链接

- [GitHub 仓库](https://github.com/QianJue-CN/mcp-memory-server)
- [NPM 包](https://www.npmjs.com/package/@qianjue/mcp-memory-server)
- [问题报告](https://github.com/QianJue-CN/mcp-memory-server/issues)
- [English README](README.md)

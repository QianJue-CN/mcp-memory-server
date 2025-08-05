# MCP Memory Server

一个基于 Model Context Protocol (MCP) 的智能记忆管理服务器，为 AI 模型提供持久化记忆存储和强大的向量搜索功能。

## 🌟 功能特性

### 核心功能
- **CRUD 操作**：创建、读取、更新、删除记忆条目
- **多种记忆类型**：支持全局记忆、对话记忆和临时记忆
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
npm install mcp-memory-server
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
      "args": ["mcp-memory-server"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "/path/to/your/memory/storage"
      }
    }
  }
}
```

#### 配置选项

- `MCP_MEMORY_STORAGE_PATH`: 自定义存储目录路径
- `MCP_EMBEDDING_PROVIDER`: 默认嵌入提供商 (ollama/gemini/openai)
- `MCP_EMBEDDING_API_KEY`: 嵌入提供商的默认API密钥
- `LOG_LEVEL`: 日志级别 (debug/info/warn/error)

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
      "apiKey": "your-api-key",
      "baseUrl": "https://gemini.qianjue.top",
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
      "apiKey": "your-api-key",
      "baseUrl": "https://gemini.qianjue.top",
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
  "apiKey": "your-api-key",
  "baseUrl": "https://gemini.qianjue.top",
  "model": "text-embedding-004",
  "dimensions": 768
}
```

#### OpenAI API
```json
{
  "provider": "openai",
  "apiKey": "your-api-key",
  "model": "text-embedding-3-small",
  "dimensions": 1536
}
```

### 完整配置示例

以下是在 Claude Desktop 中配置 MCP Memory Server 的完整示例：

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "npx",
      "args": ["mcp-memory-server"],
      "env": {
        "MCP_MEMORY_STORAGE_PATH": "~/Documents/AI-Memory",
        "MCP_EMBEDDING_PROVIDER": "gemini",
        "MCP_EMBEDDING_API_KEY": "your-gemini-api-key",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

添加此配置后：
1. 重启 Claude Desktop
2. 记忆服务器将提供所有11个工具
3. 如果提供了API密钥，向量搜索将自动启用
4. 记忆将存储在指定目录中

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
- [NPM 包](https://www.npmjs.com/package/mcp-memory-server)
- [问题报告](https://github.com/QianJue-CN/mcp-memory-server/issues)
- [English README](README.md)

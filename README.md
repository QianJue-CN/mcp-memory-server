# MCP Memory Server

An intelligent memory management server based on Model Context Protocol (MCP), providing persistent memory storage and powerful vector search capabilities for AI models.

## 🌟 Features

### Core Functionality
- **CRUD Operations**: Create, read, update, and delete memory entries
- **Multiple Memory Types**: Support for global, conversation, and temporary memories
- **Flexible Storage**: User-customizable storage paths
- **JSON Format**: JSON-based storage for easy reading and backup

### 🎯 Vector Search Capabilities (NEW!)
- **Semantic Search**: Intelligent search based on meaning rather than keywords
- **Hybrid Search**: Combines semantic and keyword search
- **Multi-Provider Support**: Support for Ollama, Gemini, OpenAI embedding models
- **Auto-Vectorization**: Automatic embedding generation when creating memories
- **Similarity Calculation**: Calculate semantic similarity between any two texts
- **High Performance**: In-memory caching + file persistence

### Advanced Features
- **Memory Caching**: Improved read performance
- **Indexing System**: Fast search and filtering
- **Performance Monitoring**: Real-time performance metrics
- **File Management**: Automatic backup and recovery
- **Comprehensive Error Handling**: Stable and reliable operation

## 📦 Installation

### Install from NPM (Recommended)

```bash
npm install @qianjue/mcp-memory-server
```

### Install from Source

```bash
# Clone the repository
git clone https://github.com/QianJue-CN/mcp-memory-server.git
cd mcp-memory-server

# Install dependencies
npm install

# Build the project
npm run build
```

## 🚀 Quick Start

### MCP Server Configuration

Add this server to your MCP client configuration file:

#### For Claude Desktop (config.json)

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

#### Using NPM Package

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

#### Configuration Options

- `MCP_MEMORY_STORAGE_PATH`: Custom storage directory path
- `MCP_EMBEDDING_PROVIDER`: Default embedding provider (ollama/gemini/openai)
- `MCP_EMBEDDING_API_KEY`: Default API key for embedding provider
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

### Basic Usage

```bash
# Start the server directly
npm start

# Or run from dist
node dist/index.js
```

### Vector Search Quick Start

#### 1. Configure Embedding Provider

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

#### 2. Create Memory (Auto-generates vectors)

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_memory",
    "arguments": {
      "content": "I am learning JavaScript programming",
      "type": "global",
      "tags": ["programming", "learning"]
    }
  }
}
```

#### 3. Semantic Search

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "semantic_search",
    "arguments": {
      "query": "programming learning",
      "limit": 5,
      "threshold": 0.7
    }
  }
}
```

## 📚 MCP Tools

### Basic Memory Management

#### 1. create_memory
Create a new memory entry

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_memory",
    "arguments": {
      "content": "Memory content",
      "type": "global",
      "tags": ["tag1", "tag2"],
      "metadata": {"key": "value"}
    }
  }
}
```

#### 2. read_memories
Read memory entries

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
      "searchText": "search keywords"
    }
  }
}
```

#### 3. update_memory
Update a memory entry

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "update_memory",
    "arguments": {
      "id": "memory-id",
      "content": "Updated content"
    }
  }
}
```

#### 4. delete_memory
Delete a memory entry

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

#### 5. get_memory_stats
Get memory statistics

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_memory_stats",
    "arguments": {}
  }
}
```

### Vector Search Tools

#### 1. configure_embedding
Configure embedding model provider

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
Semantic similarity search

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "semantic_search",
    "arguments": {
      "query": "programming learning",
      "limit": 5,
      "threshold": 0.7,
      "hybridSearch": false
    }
  }
}
```

#### 3. generate_embeddings
Generate embeddings for existing memories

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
Calculate similarity between two texts

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "calculate_similarity",
    "arguments": {
      "text1": "learning programming",
      "text2": "writing code"
    }
  }
}
```

#### 5. get_vector_stats
Get vector storage statistics

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

## 🔧 Configuration

### Embedding Provider Configuration

#### Ollama (Local Models)
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

### Environment Variables
```bash
# Optional: Set default storage path
MCP_MEMORY_STORAGE_PATH=/path/to/storage

# Optional: Set embedding configuration
MCP_EMBEDDING_PROVIDER=gemini
MCP_EMBEDDING_API_KEY=your-gemini-api-key
```

### Complete Configuration Example

Here's a complete example of how to configure the MCP Memory Server in Claude Desktop:

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
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

After adding this configuration:
1. Restart Claude Desktop
2. The memory server will be available with all 11 tools
3. Vector search will be automatically enabled if API key is provided
4. Memories will be stored in the specified directory

## 📊 Data Structures

### MemoryEntry
```typescript
interface MemoryEntry {
  id: string;              // UUID
  content: string;         // Memory content
  type: MemoryType;        // Memory type
  conversationId?: string; // Conversation ID (optional)
  createdAt: string;       // Creation time (ISO 8601)
  updatedAt: string;       // Update time (ISO 8601)
  tags?: string[];         // Tags array
  metadata?: object;       // Metadata object
  embedding?: number[];    // Embedding vector (optional)
}
```

### MemoryType
```typescript
enum MemoryType {
  GLOBAL = 'global',           // Global memory
  CONVERSATION = 'conversation', // Conversation memory
  TEMPORARY = 'temporary'      // Temporary memory
}
```

## 🏗️ Project Structure

```
src/
├── types/          # Type definitions
│   ├── memory.ts   # Memory-related types
│   └── vector.ts   # Vector-related types
├── memory/         # Memory management core
├── embedding/      # Embedding model providers
│   ├── EmbeddingProvider.ts
│   ├── EmbeddingManager.ts
│   └── providers/  # Provider implementations
├── vector/         # Vector storage and computation
│   ├── VectorStore.ts
│   └── VectorUtils.ts
├── utils/          # Utility classes
├── tools/          # MCP tool interfaces
└── index.ts        # Server entry point
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/QianJue-CN/mcp-memory-server)
- [NPM Package](https://www.npmjs.com/package/@qianjue/mcp-memory-server)
- [Issue Tracker](https://github.com/QianJue-CN/mcp-memory-server/issues)
- [中文文档](README_ZH.md)

#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MemoryManager } from './memory/MemoryManager.js';
import { MemoryTools } from './tools/MemoryTools.js';

class MemoryMCPServer {
  private server: Server;
  private memoryManager: MemoryManager;
  private memoryTools: MemoryTools;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-memory-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 从环境变量读取配置
    const storagePath = process.env.MCP_MEMORY_STORAGE_PATH;

    // 初始化记忆管理器
    this.memoryManager = new MemoryManager(storagePath);
    this.memoryTools = new MemoryTools(this.memoryManager);

    this.setupHandlers();
    this.initializeEmbeddingFromEnv();
  }

  private setupHandlers(): void {
    // 处理工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.memoryTools.getToolDefinitions(),
      };
    });

    // 处理工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.memoryTools.callTool(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: errorMessage,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 从环境变量初始化嵌入配置
   */
  private async initializeEmbeddingFromEnv(): Promise<void> {
    const provider = process.env.MCP_EMBEDDING_PROVIDER;
    const apiKey = process.env.MCP_EMBEDDING_API_KEY;

    if (provider && apiKey) {
      try {
        const config: any = {
          provider,
          apiKey,
        };

        // 可选配置
        if (process.env.MCP_EMBEDDING_MODEL) {
          config.model = process.env.MCP_EMBEDDING_MODEL;
        }
        if (process.env.MCP_EMBEDDING_BASE_URL) {
          config.baseUrl = process.env.MCP_EMBEDDING_BASE_URL;
        }
        if (process.env.MCP_EMBEDDING_DIMENSIONS) {
          config.dimensions = parseInt(process.env.MCP_EMBEDDING_DIMENSIONS);
        }
        if (process.env.MCP_EMBEDDING_TIMEOUT) {
          config.timeout = parseInt(process.env.MCP_EMBEDDING_TIMEOUT);
        }
        if (process.env.MCP_EMBEDDING_MAX_RETRIES) {
          config.maxRetries = parseInt(process.env.MCP_EMBEDDING_MAX_RETRIES);
        }

        // 配置嵌入提供商
        await this.memoryManager.configureEmbedding(config);
        console.error(`Embedding provider ${provider} configured successfully`);
      } catch (error) {
        console.error('Failed to configure embedding from environment variables:', error);
      }
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Memory Server started successfully');
  }
}

// 启动服务器
async function main() {
  const server = new MemoryMCPServer();
  await server.start();
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

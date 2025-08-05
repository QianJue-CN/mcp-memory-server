#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MemoryManager } from './memory/MemoryManager.js';
import { MemoryTools } from './tools/MemoryTools.js';

class MemoryMCPServer {
  private server: Server;
  private memoryManager: MemoryManager;
  private memoryTools: MemoryTools;
  private isInitialized: boolean = false;

  constructor() {
    // 添加详细的错误日志
    console.error('[MCP Memory Server] Starting initialization...');

    this.server = new Server(
      {
        name: 'mcp-memory-server',
        version: '1.1.4',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 从环境变量读取配置
    const storagePath = process.env.MCP_MEMORY_STORAGE_PATH;
    console.error(`[MCP Memory Server] Storage path: ${storagePath || 'default'}`);

    try {
      // 初始化记忆管理器
      this.memoryManager = new MemoryManager(storagePath);
      this.memoryTools = new MemoryTools(this.memoryManager);

      console.error('[MCP Memory Server] Memory manager and tools initialized');

      this.setupHandlers();
      this.initializeEmbeddingFromEnv();

      this.isInitialized = true;
      console.error('[MCP Memory Server] Initialization completed successfully');
    } catch (error) {
      console.error('[MCP Memory Server] Initialization failed:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    console.error('[MCP Memory Server] Setting up request handlers...');

    // 处理工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[MCP Memory Server] Received tools/list request');

      if (!this.isInitialized) {
        console.error('[MCP Memory Server] Server not initialized, returning empty tools list');
        return { tools: [] };
      }

      try {
        const tools = this.memoryTools.getToolDefinitions();
        console.error(`[MCP Memory Server] Returning ${tools.length} tools`);
        return { tools };
      } catch (error) {
        console.error('[MCP Memory Server] Error getting tool definitions:', error);
        return { tools: [] };
      }
    });

    // 处理工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.error(`[MCP Memory Server] Received tool call: ${name}`);

      if (!this.isInitialized) {
        console.error('[MCP Memory Server] Server not initialized');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: 'Server not initialized' }, null, 2),
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await this.memoryTools.callTool(name, args || {});
        console.error(`[MCP Memory Server] Tool call ${name} completed successfully`);
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
        console.error(`[MCP Memory Server] Tool call ${name} failed:`, errorMessage);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: errorMessage,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });

    console.error('[MCP Memory Server] Request handlers set up successfully');
  }

  /**
   * 从环境变量初始化嵌入配置
   */
  private async initializeEmbeddingFromEnv(): Promise<void> {
    const provider = process.env.MCP_EMBEDDING_PROVIDER;
    const apiKey = process.env.MCP_EMBEDDING_API_KEY;

    console.error(`[MCP Memory Server] Embedding config - Provider: ${provider || 'none'}, API Key: ${apiKey ? 'set' : 'not set'}`);

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

        console.error('[MCP Memory Server] Configuring embedding provider...');
        // 配置嵌入提供商
        await this.memoryManager.configureEmbedding(config);
        console.error('[MCP Memory Server] Embedding provider configured successfully');
      } catch (error) {
        console.error('[MCP Memory Server] Failed to configure embedding provider:', error);
      }
    } else {
      console.error('[MCP Memory Server] No embedding configuration found, vector search will not be available');
    }
  }

  async start(): Promise<void> {
    console.error('[MCP Memory Server] Starting server with stdio transport...');
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('[MCP Memory Server] Server connected successfully');
    } catch (error) {
      console.error('[MCP Memory Server] Failed to start server:', error);
      throw error;
    }
  }
}

// 启动服务器
async function main() {
  console.error('[MCP Memory Server] Main function starting...');

  try {
    const server = new MemoryMCPServer();
    console.error('[MCP Memory Server] Server instance created');

    await server.start();
    console.error('[MCP Memory Server] Server started successfully');

    // 定期输出状态信息
    setInterval(() => {
      console.error('[MCP Memory Server] Server process is still running...');
    }, 30000); // 每30秒输出一次，减少日志噪音

  } catch (error) {
    console.error('[MCP Memory Server] Failed to start:', error);
    process.exit(1);
  }
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

// 检查是否直接运行此文件
const isMainModule = process.argv[1] && (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith('index.js')
);

console.error(`[MCP Memory Server] Module check - import.meta.url: ${import.meta.url}`);
console.error(`[MCP Memory Server] Module check - process.argv[1]: ${process.argv[1]}`);
console.error(`[MCP Memory Server] Module check - isMainModule: ${isMainModule}`);

if (isMainModule) {
  console.error('[MCP Memory Server] Running as main module, starting server...');
  main().catch((error) => {
    console.error('[MCP Memory Server] Main function failed:', error);
    process.exit(1);
  });
} else {
  console.error('[MCP Memory Server] Not running as main module, skipping startup');
}

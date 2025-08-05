# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2025-01-08

### Fixed
- **Critical Bug Fix**: Fixed MCP server initialization issue that caused "No tools are available" error
- **Module Detection**: Improved main module detection logic to ensure server starts correctly
- **Error Handling**: Enhanced error handling and logging throughout the initialization process
- **Stdio Transport**: Fixed stdio transport connection issues that prevented proper MCP communication

### Added
- **Enhanced Logging**: Added comprehensive debug logging for better troubleshooting
- **Initialization Validation**: Added proper validation to ensure all components are initialized before handling requests
- **Status Monitoring**: Added server status monitoring and health checks

### Changed
- **Server Startup**: Improved server startup sequence and reliability
- **Tool Registration**: Enhanced tool registration process with better error recovery
- **Debug Output**: More informative debug messages for easier troubleshooting

### Technical Details
- Fixed import.meta.url module detection that was causing immediate server exit
- Added isInitialized flag to prevent handling requests before server is ready
- Improved error messages and logging for better debugging experience
- Enhanced compatibility with different MCP clients (Augment, Claude Desktop, etc.)

## [1.1.4] - Previous Release

### Features
- Memory management with CRUD operations
- Vector search capabilities with multiple embedding providers
- Support for Ollama, Gemini, and OpenAI embedding models
- Semantic search and similarity calculations
- Multiple memory types (global, conversation, temporary)
- Performance monitoring and statistics
- File-based storage with JSON format

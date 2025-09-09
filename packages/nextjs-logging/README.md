- [NextJS Logging](#nextjs-logging)
  - [Features](#features)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [1. Create a Logger Instance](#1-create-a-logger-instance)
    - [2. Setup API Routes](#2-setup-api-routes)
    - [3. Use in Components](#3-use-in-components)
    - [4. Use in Server Components/Actions](#4-use-in-server-componentsactions)
  - [Advanced Usage](#advanced-usage)
    - [Logger Configuration Management](#logger-configuration-management)
    - [Custom Storage Backend](#custom-storage-backend)
    - [Module-Level Log Control](#module-level-log-control)
    - [Error Verbose Mode](#error-verbose-mode)
    - [Trace-Level Logging with Caller Info](#trace-level-logging-with-caller-info)
  - [Configuration Options](#configuration-options)
    - [Logger Constructor Options](#logger-constructor-options)
    - [Log Levels](#log-levels)
    - [Logger Types](#logger-types)
    - [Storage Configuration](#storage-configuration)
  - [API Reference](#api-reference)
    - [Logger Class](#logger-class)
    - [Client Store (Zustand)](#client-store-zustand)
    - [Server Registry](#server-registry)
    - [API Handlers](#api-handlers)
    - [Storage Interface](#storage-interface)
  - [Best Practices](#best-practices)
  - [Examples](#examples)
    - [Example: Complete Application Setup](#example-complete-application-setup)
  - [Contributing](#contributing)
  - [License](#license)

# NextJS Logging

A comprehensive logging package for Next.js applications with client-side Zustand store, server-side registry, and real-time configuration management.

## Features

- 📝 **Multi-Level Logging**: Support for 8 log levels (debug, info, warn, error, fatal, success, trace, start)
- 🏪 **Zustand Store**: Type-safe client-side state management with automatic persistence
- 🔄 **Real-time Config**: Dynamic log level changes with immediate effect
- 🌐 **API Integration**: Built-in API routes for log configuration management
- 🎨 **Color-Coded Output**: ANSI and CSS color coding for different log levels
- 🗂️ **Registry System**: Server-side logger registry with singleton pattern
- 📦 **Multiple Storage**: In-memory, file-based, and Redis storage backends
- ⚡ **Performance Optimized**: Efficient filtering and conditional logging
- 🔍 **Trace Mode**: Automatic caller information for trace-level logs
- 🎯 **TypeScript**: Full type safety with comprehensive interfaces
- 🏷️ **Logger Types**: Categorized loggers (service, component, hook, class, api, package, store)
- 🌍 **Universal**: Works seamlessly in both client and server environments

## Installation

```bash
npm install @core-mfg/nextjs-logging
# or
yarn add @core-mfg/nextjs-logging
# or
pnpm add @core-mfg/nextjs-logging
```

## Quick Start

### 1. Create a Logger Instance

```typescript
// lib/logger.ts
import { Logger } from '@core-mfg/nextjs-logging';

export const appLogger = new Logger('MyApp', 'service', 'info');
export const componentLogger = new Logger('UserComponent', 'component', 'debug');
```

### 2. Setup API Routes

```typescript
// app/api/logging/route.ts
import {
  getServerLoggersHandler,
  postServerLoggerHandler,
  putServerLoggerHandler,
  putServerLoggersBatchHandler
} from '@core-mfg/nextjs-logging';

export const GET = getServerLoggersHandler;
export const POST = postServerLoggerHandler;
export const PUT = putServerLoggerHandler;

// For batch operations
export const PATCH = putServerLoggersBatchHandler;
```

### 3. Use in Components

```typescript
// components/UserProfile.tsx
'use client';

import React, { useEffect } from 'react';
import { componentLogger } from '../lib/logger';

export function UserProfile({ userId }: { userId: string }) {
  useEffect(() => {
    componentLogger.start('Loading user profile', { userId });
  }, [userId]);

  const handleSave = async (userData: any) => {
    try {
      componentLogger.info('Saving user data', { userId });
      // ... save logic
      componentLogger.success('User data saved successfully');
    } catch (error) {
      componentLogger.error('Failed to save user data', { userId }, error);
    }
  };

  return (
    <div>
      <h2>User Profile</h2>
      {/* Your component JSX */}
    </div>
  );
}
```

### 4. Use in Server Components/Actions

```typescript
// app/actions/userActions.ts
'use server';

import { Logger } from '@core-mfg/nextjs-logging';

const serverLogger = new Logger('UserActions', 'api', 'info');

export async function updateUser(userId: string, data: any) {
  serverLogger.start('Updating user', { userId });

  try {
    // ... update logic
    serverLogger.success('User updated successfully', { userId });
    return { success: true };
  } catch (error) {
    serverLogger.error('Failed to update user', { userId }, error);
    throw error;
  }
}
```

## Advanced Usage

### Logger Configuration Management

```typescript
// components/LoggerConfig.tsx
'use client';

import React from 'react';
import { useLoggerStore } from '@core-mfg/nextjs-logging/client';

export function LoggerConfig() {
  const loggers = useLoggerStore(state => state.getAll());
  const setLogger = useLoggerStore(state => state.setLogger);

  const updateLoggerLevel = (name: string, level: string) => {
    const logger = loggers.find(l => l.name === name);
    if (logger) {
      setLogger({
        ...logger,
        level: level as any
      });
    }
  };

  return (
    <div>
      <h3>Logger Configuration</h3>
      {loggers.map(logger => (
        <div key={logger.name}>
          <span>{logger.name}</span>
          <select
            value={logger.level}
            onChange={(e) => updateLoggerLevel(logger.name, e.target.value)}
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>
      ))}
    </div>
  );
}
```

### Custom Storage Backend

```typescript
// lib/customStorage.ts
import { ILoggingStorage, LogConfig, LogConfigEntry } from '@core-mfg/nextjs-logging';

export class CustomLoggingStorage implements ILoggingStorage {
  async getConfig(): Promise<LogConfig> {
    // Custom logic to retrieve config
    return [];
  }

  async setConfig(config: LogConfig): Promise<void> {
    // Custom logic to store config
  }

  async set(logger: LogConfigEntry): Promise<void> {
    // Custom logic to store single logger
  }

  async get(loggerName: string): Promise<LogConfigEntry> {
    // Custom logic to retrieve single logger
    throw new Error('Logger not found');
  }
}
```

### Module-Level Log Control

```typescript
// lib/logging.ts
import { Logger } from '@core-mfg/nextjs-logging';

// Set package-wide log level
Logger.setPackageGlobalLevel('warn');

// Set module-specific log level (overrides package level)
Logger.setModuleGlobalLevel('debug');

// Create loggers that respect these levels
export const apiLogger = new Logger('API', 'api', 'info');
export const dbLogger = new Logger('Database', 'service', 'debug');
```

### Error Verbose Mode

```typescript
// Enable detailed error information
const errorLogger = new Logger('ErrorHandler', 'service', 'error', true);

try {
  // Some operation that might fail
  riskyOperation();
} catch (error) {
  // With errorVerbose=true, the full error object will be logged
  errorLogger.error('Operation failed', { context: 'user-action' }, error);
}
```

### Trace-Level Logging with Caller Info

```typescript
const traceLogger = new Logger('DebugHelper', 'component', 'trace');

function complexFunction() {
  traceLogger.trace('Entering complex function');
  // This will automatically include caller information
  // Output: "TRACE [DebugHelper] Entering complex function  <-- at complexFunction (file.ts:42:13)"
}
```

## Configuration Options

### Logger Constructor Options

```typescript
interface LoggerOptions {
  name: string;                    // Unique logger identifier
  type?: LogType;                  // Logger category (service, component, hook, class, api, package, store, unknown)
  level?: LogLevel;                // Initial log level
  errorVerbose?: boolean;          // Include full error objects in logs (default: false)
  enabled?: boolean;               // Enable/disable logging (default: true)
  register?: boolean;              // Register with server registry (default: true)
}

const logger = new Logger('MyLogger', 'service', 'info', true, true);
```

### Log Levels

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'success' | 'trace' | 'start';

// Priority order (higher numbers = more verbose):
const LOG_LEVELS = {
  fatal: 0,     // Most critical
  error: 1,
  warn: 2,
  success: 3,
  info: 4,
  start: 4,     // Same priority as info
  debug: 5,
  trace: 6      // Most verbose
};
```

### Logger Types

```typescript
type LogType = 'service' | 'component' | 'hook' | 'class' | 'api' | 'package' | 'store' | 'unknown';

// Usage examples:
const serviceLogger = new Logger('AuthService', 'service');
const componentLogger = new Logger('UserForm', 'component');
const hookLogger = new Logger('useAuth', 'hook');
const apiLogger = new Logger('UserAPI', 'api');
```

### Storage Configuration

```typescript
// Environment variable configuration
process.env.LOGGING_STORAGE_TYPE = 'file';  // 'memory' | 'file' | 'redis'

// For file storage, logs are persisted to disk
// For redis, additional REDIS_URL environment variable is required
```

## API Reference

### Logger Class

```typescript
class Logger {
  constructor(
    name: string,
    type?: LogType,
    level?: LogLevel,
    errorVerbose?: boolean,
    enabled?: boolean,
    register?: boolean
  );

  // Properties
  readonly name: string;
  readonly type: LogType;
  level: LogLevel;
  errorVerbose: boolean;
  enabled: boolean;

  // Logging methods
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown, error?: unknown): void;
  fatal(message: string, data?: unknown): void;
  success(message: string, data?: unknown): void;
  trace(message: string, data?: unknown): void;
  start(message: string, data?: unknown): void;

  // Utility methods
  destroy(): void;                                    // Clean up subscriptions
  toJSON(): LogConfigEntry;                          // Serialize to JSON
  static fromJSON(data: LogConfigEntry): Logger;     // Deserialize from JSON

  // Global control methods
  static setPackageGlobalLevel(level: LogLevel): void;
  static getPackageGlobalLevel(): LogLevel;
  static setModuleGlobalLevel(level: LogLevel | null): void;
  static getModuleGlobalLevel(): LogLevel | null;
  static setModuleGlobalStorageMedium(medium: "file" | "redis" | "memory"): void;
  static getModuleGlobalStorageMedium(): "file" | "redis" | "memory";
}
```

### Client Store (Zustand)

```typescript
interface LoggerRegistry {
  loggers: Record<string, LogConfigEntry>;
  setLogger: (entry: Partial<LogConfigEntry>) => void;
  getLogger: (name: string) => LogConfigEntry | undefined;
  getAll: () => LogConfigEntry[];
}

const useLoggerStore = create<LoggerRegistry>()(...);
```

### Server Registry

```typescript
class Registry<T extends Registrable> {
  register(item: T): void;
  list(): Record<string, T>;
  get(name: string): T | undefined;
  update(item: T): void;
}

// Global server registry instance
export const registry: Registry<Logger>;
```

### API Handlers

```typescript
// GET /api/logging - Retrieve all loggers
export const GET = getServerLoggersHandler;

// POST /api/logging - Create new logger
export const POST = postServerLoggerHandler;

// PUT /api/logging - Update single logger
export const PUT = putServerLoggerHandler;

// PATCH /api/logging - Batch update loggers
export const PATCH = putServerLoggersBatchHandler;
```

### Storage Interface

```typescript
interface ILoggingStorage {
  getConfig(): Promise<LogConfig>;
  setConfig(config: LogConfig): Promise<void>;
  set(logger: LogConfigEntry): Promise<void>;
  get(loggerName: string): Promise<LogConfigEntry>;
}
```

## Best Practices

1. **Consistent Naming**: Use descriptive, hierarchical logger names (e.g., "AuthService.Login", "UserAPI.FetchProfile")
2. **Appropriate Log Levels**: Use error/fatal for failures, warn for potential issues, info for important events, debug for development
3. **Structured Data**: Include relevant context data in log messages for better debugging
4. **Error Verbose Mode**: Enable in development, disable in production for cleaner logs
5. **Logger Types**: Categorize loggers appropriately (service for backend, component for React components, api for endpoints)
6. **Resource Cleanup**: Call `logger.destroy()` when components unmount to prevent memory leaks
7. **Global Controls**: Use package/module global levels for environment-specific log verbosity
8. **Performance**: Log levels are checked before message formatting, so verbose logging has minimal performance impact when disabled
9. **Server Registration**: Let loggers auto-register on server startup for centralized management
10. **Configuration Persistence**: Use the client store for runtime config changes, API routes for persistence

## Examples

Check out the [test directory](./test/) for comprehensive usage examples:

- Basic logger creation and usage patterns
- Client-side store integration
- Server-side registry management
- API route implementation
- Error handling and verbose logging
- Module-level log control
- Trace-level debugging with caller info

### Example: Complete Application Setup

```typescript
// lib/logging/index.ts
import { Logger } from '@core-mfg/nextjs-logging';

export const createLogger = (name: string, type: LogType = 'service') => {
  return new Logger(name, type, process.env.NODE_ENV === 'development' ? 'debug' : 'info');
};

// Pre-configured loggers
export const authLogger = createLogger('AuthService', 'service');
export const apiLogger = createLogger('APIService', 'api');
export const dbLogger = createLogger('Database', 'service');
```

```typescript
// app/api/logging/route.ts
import {
  getServerLoggersHandler,
  postServerLoggerHandler,
  putServerLoggerHandler,
  putServerLoggersBatchHandler
} from '@core-mfg/nextjs-logging';

export const GET = getServerLoggersHandler;
export const POST = postServerLoggerHandler;
export const PUT = putServerLoggerHandler;
export const PATCH = putServerLoggersBatchHandler;
```

```typescript
// components/LoggerDashboard.tsx
'use client';

import { useLoggerStore } from '@core-mfg/nextjs-logging/client';

export function LoggerDashboard() {
  const loggers = useLoggerStore(state => state.getAll());
  const setLogger = useLoggerStore(state => state.setLogger);

  return (
    <div className="logger-dashboard">
      <h2>Logger Configuration</h2>
      <div className="logger-grid">
        {loggers.map(logger => (
          <div key={logger.name} className="logger-item">
            <div className="logger-info">
              <strong>{logger.name}</strong>
              <span className="logger-type">{logger.type}</span>
            </div>
            <select
              value={logger.level}
              onChange={(e) => setLogger({
                name: logger.name,
                level: e.target.value as any
              })}
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={logger.enabled}
                onChange={(e) => setLogger({
                  name: logger.name,
                  enabled: e.target.checked
                })}
              />
              Enabled
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see LICENSE file for details.
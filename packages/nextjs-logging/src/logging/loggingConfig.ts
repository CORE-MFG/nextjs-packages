// /src/lib/logging/loggingConfig.ts

import { ILoggingStorage } from './loggingStorage';
import { LogConfig, LogConfigEntry, LogLevel, LogType } from '../levels';

export class LoggingConfig {
  private storagePromise: Promise<ILoggingStorage>;

  constructor(storagePromise: Promise<ILoggingStorage>) {
    this.storagePromise = storagePromise;
  }

  private async store(): Promise<ILoggingStorage> {
    return await this.storagePromise;
  }

  async get(loggerName: string): Promise<LogConfigEntry> {
    const storage = await this.store();
    const entryFromConfig = await storage.get(loggerName);
    
    const loggerConfigEntry: LogConfigEntry = {
      name: loggerName,
      level: entryFromConfig?.level || 'info',
      type: entryFromConfig?.type || 'unknown',
      errorVerbose: entryFromConfig?.errorVerbose ?? false,
    };
  
    return loggerConfigEntry;
  }

  async set(logger: LogConfigEntry): Promise<void> {
    const storage = await this.store();
    await storage.set(logger);
  }

  async getConfig(): Promise<LogConfig> {
    const storage = await this.store();
    return await storage.getConfig();
  }

  async setConfig(config: LogConfig): Promise<void> {
    const storage = await this.store();
    if (storage.setConfig) {
      await storage.setConfig(config);
    }
  }

  // New method to merge partial config with existing config
  async mergeConfig(partialConfig: LogConfig): Promise<void> {
    const storage = await this.store();
    const existingConfig = await storage.getConfig();
    const mergedConfig = { ...existingConfig, ...partialConfig };
    if (storage.setConfig) {
      await storage.setConfig(mergedConfig);
    }
  }
}

export async function createLoggingConfig() {
  const { createLoggingStorage } = await import('./loggingStorageFactory');
  return new LoggingConfig(createLoggingStorage());
}

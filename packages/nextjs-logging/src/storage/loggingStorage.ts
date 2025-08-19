// lib/logging/loggingStorage.ts

import { LogConfig, LogConfigEntry, LogLevel, LogType} from "@/levels";

/**
 * Interface for logging storage
 */
export interface ILoggingStorage {
  getConfig(): Promise<LogConfig>;
  setConfig(config: LogConfig): Promise<void>;
  set(logger: LogConfigEntry): Promise<void>;
  get(loggerName: string): Promise<LogConfigEntry>;
}

/**
 * In-memory logging storage implementation
 */
export class InMemoryLoggingStorage implements ILoggingStorage {
  private config: LogConfig = [];

  /**
   * Get the current logging configuration
   * @returns The current logging configuration
   */
  async getConfig(): Promise<LogConfig> {
    return this.config;
  }

  /**
   * Set the current logging configuration
   * @param config The new logging configuration
   */
  async setConfig(config: LogConfig): Promise<void> {
    this.config = config;
  }

  /**
   * Set a new logger configuration
   * @param logger The new logger configuration
   */
  async set(logger: LogConfigEntry): Promise<void> {
    this.config.push(logger);
  }

  /**
   * Get a logger configuration
   * @param loggerName The name of the logger to get
   * @returns The logger configuration
   */
  async get(loggerName: string): Promise<LogConfigEntry> {
    const loggerConfig = this.config.find(logger => logger.name === loggerName);
    if (!loggerConfig) {
      throw new Error(`Logger ${loggerName} not found`);
    }
    return loggerConfig;
  }
}

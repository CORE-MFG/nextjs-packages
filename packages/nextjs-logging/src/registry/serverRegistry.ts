// src/server/registry.ts
import { Logger } from "../logger";

class LoggerRegistry {
  private loggers = new Map<string, Logger>();

  register(logger: Logger) {
    if (!this.loggers.has(logger.name)) {
      this.loggers.set(logger.name, logger);
    }
  }

  update(logger: Logger) {
    if (this.loggers.has(logger.name)) {
      this.loggers.set(logger.name, logger);
    }
  }

  get(name: string): Logger | undefined {
    return this.loggers.get(name);
  }

  enable(name: string) {
    const logger = this.loggers.get(name);
    if (logger) logger.enabled = true;
  }

  disable(name: string) {
    const logger = this.loggers.get(name);
    if (logger) logger.enabled = false;
  }

  list(): Record<string, Logger> {
    return Object.fromEntries(this.loggers);
  }
}

export const registry = new LoggerRegistry();

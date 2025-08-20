// src/server/registry.ts
// import { Logger } from "../logger";

// src/server/registry.ts
import { Registry } from "./baseRegistry";
import type { Logger } from "../logger";


// concrete instance for loggers
// export const registry = new Registry<Logger>();

/**
 * Singleton Registry accessor for server
 */
if (!globalThis.__coreMfgServerRegistry__) {
  globalThis.__coreMfgServerRegistry__ = new Registry<Logger>();
}

export const registry: Registry<Logger> = globalThis.__coreMfgServerRegistry__;


// class LoggerRegistry {
//   private loggers = new Map<string, LoggerLike>();

//   register(logger: LoggerLike) {
//     if (!this.loggers.has(logger.name)) {
//       this.loggers.set(logger.name, logger);
//     }
//   }

//   update(logger: LoggerLike) {
//     if (this.loggers.has(logger.name)) {
//       this.loggers.set(logger.name, logger);
//     }
//   }

//   get(name: string): LoggerLike | undefined {
//     return this.loggers.get(name);
//   }

//   enable(name: string) {
//     const logger = this.loggers.get(name);
//     if (logger) logger.enabled = true;
//   }

//   disable(name: string) {
//     const logger = this.loggers.get(name);
//     if (logger) logger.enabled = false;
//   }

//   list(): Record<string, LoggerLike> {
//     return Object.fromEntries(this.loggers);
//   }
// }

// export const registry = new LoggerRegistry();

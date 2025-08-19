// /src/lib/logging/logger.ts

import {
  LogLevel,
  COLORS_ANSI,
  LOG_LEVELS,
  LOG_LEVEL_COLORS_ANSI,
  LogConfigEntry,
  LogType,
  LogConfig,
} from "./levels";
import { isClient } from "./utils/isclient";

// // Client-side cached config & fetch helper
// let clientConfigCache: LogConfig | null = null;
// let clientConfigFetchPromise: Promise<void> | null = null;

// type ConfigListener = (config: LogConfig) => void;

// let clientConfigListeners: ConfigListener[] = [];

// export function subscribeToLoggerConfig(listener: ConfigListener) {
//   clientConfigListeners.push(listener);
//   return () => {
//     clientConfigListeners = clientConfigListeners.filter(l => l !== listener);
//   };
// }

// function updateClientCache(newConfig: LogConfig) {
//   clientConfigCache = newConfig;
//   clientConfigListeners.forEach(l => l(clientConfigCache!));
// }

// async function fetchClientLoggingConfig() {
//   if (clientConfigCache) return; // cached

//   if (!clientConfigFetchPromise) {
//     clientConfigFetchPromise = fetch("/ui/config/logging")
//       .then((res) => res.json())
//       .then((data) => {
//         clientConfigCache = data.value || [];
//         updateClientCache(clientConfigCache!);
//       })
//       .catch(() => {
//         clientConfigCache = [];
//         updateClientCache(clientConfigCache!);
//       })
//       .finally(() => {
//         clientConfigFetchPromise = null;
//       });
//   }

//   await clientConfigFetchPromise;
// }

// Module-instance scoped "global config" per package
let moduleGlobalLogLevel: LogLevel | null = null;

export class Logger {
  private _name: string;
  private _type: LogType;
  private _errorVerbose: boolean;
  private _level: LogLevel;

  constructor(
    name: string,
    type: LogType = "unknown",
    level: LogLevel = "info",
    errorVerbose = false
  ) {
    this._name = name;
    this._type = type;
    this._errorVerbose = errorVerbose;
    this._level = level;
  }

  get name(): string {
    return this._name;
  }
  get type(): LogType {
    return this._type;
  }
  get errorVerbose(): boolean {
    return this._errorVerbose;
  }
  get level(): LogLevel {
    return this._level;
  }

  // Module-instance global control
  static setModuleGlobalLevel(level: LogLevel | null) {
    moduleGlobalLogLevel = level;
  }

  static getModuleGlobalLevel(): LogLevel | null {
    return moduleGlobalLogLevel;
  }

  ensureEntryExists(entry: LogConfigEntry) {
    // TODO: implement a single function that ensures the entry exists in the config
  }

  // Call this on logger creation to ensure feature exists in config
  // async init(): Promise<void> {
  //   if (!isClient()) {
  //     // Server: import loggingConfig and check/set
  //     const { createLoggingConfig } = await import(
  //       "./loggingConfig"
  //     );
  //     const loggingConfig = await createLoggingConfig();
  //     const config = await loggingConfig.getConfig();

  //     const existingEntry = config.find(entry => entry.name === this.name);
  //     if (!existingEntry) {
  //       await loggingConfig.set({
  //         name: this.name,
  //         level: this.level,
  //         type: this.type,
  //         errorVerbose: this.errorVerbose
  //       });
  //     }
  //   } else {
  //     // Client: fetch current config
  //     await fetchClientLoggingConfig();

  //     const existingEntry = clientConfigCache?.find(entry => entry.name === this.name);
  //     if (!existingEntry) {
  //       try {
  //         const logConfigEntry = {
  //           name: this.name,
  //           level: this.level,
  //           type: this.type,
  //           errorVerbose: this.errorVerbose,
  //         };

  //         await fetch("/ui/config/logging", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify(logConfigEntry),
  //         });

  //         // update client cache with new entry
  //         if (clientConfigCache) {
  //           const newEntry = { name: this.name, level: this.level, type: this.type, errorVerbose: this.errorVerbose };
  //           const existingIndex = clientConfigCache.findIndex(entry => entry.name === this.name);
  //           if (existingIndex >= 0) {
  //             clientConfigCache[existingIndex] = newEntry;
  //           } else {
  //             clientConfigCache.push(newEntry);
  //           }
  //           updateClientCache(clientConfigCache);
  //         }
  //       } catch {
  //         // fail silently
  //       }
  //     }

  //     // Subscribe to config changes for this logger
  //     subscribeToLoggerConfig((config) => {
  //       const entry = config.find((entry) => entry.name === this.name);
  //       if (entry) {
  //         this.level = entry.level;
  //       }
  //     });
  //   }
  // }

  // private async getCurrentLevel(): Promise<LogLevel> {
  //   if (!isClient()) {
  //     // Server: dynamically import loggingConfig only when needed
  //     const { createLoggingConfig } = await import(
  //       "./loggingConfig"
  //     );
  //     const loggingConfig = await createLoggingConfig();
  //     const config = await loggingConfig.getConfig();
  //     const entry = config.find(entry => entry.name === this.name);
  //     return entry?.level || "info";
  //   }

  //   // Client: fetch config from API if needed
  //   await fetchClientLoggingConfig();
  //   const entry = clientConfigCache?.find((entry) => entry.name === this.name);
  //   return (entry?.level || "info") as LogLevel;
  // }

  // public async getLevel(): Promise<LogLevel> {
  //   return await this.getCurrentLevel();
  // }

  private async shouldLog(level: LogLevel): Promise<boolean> {
    const effectiveLevel = moduleGlobalLogLevel ?? this._level;
    const shouldLog =  LOG_LEVELS[level] <= LOG_LEVELS[effectiveLevel];
    return shouldLog;
  }

  private colorForLevel(level: LogLevel): string {
    return LOG_LEVEL_COLORS_ANSI[level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const color = this.colorForLevel(level);
    return `${color}${level.toUpperCase()}${COLORS_ANSI.reset}\t[${
      this.name
    }] ${message}`;
  }

  private getCallerLine(): string {
    const err = new Error();
    if (!err.stack) return "unknown caller";
    const stackLines = err.stack.split("\n").map((line) => line.trim());

    // stackLines[0] = 'Error'
    // stackLines[1] = this function itself
    // stackLines[2] = the caller of this function — usually Logger.log
    // stackLines[3] = the actual external caller of Logger.log (what you want)

    // Defensive check for minimum length
    if (stackLines.length < 4) return "unknown caller";

    // This line usually looks like:
    // at FunctionName (path/to/file.ts:line:column)
    // or at path/to/file.ts:line:column

    return stackLines[3] || "unknown caller";
  }

  private log = async (
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: unknown
  ) => {
    if (!(await this.shouldLog(level))) return;

    let formattedMsg = this.formatMessage(level, message);

    if (level === "trace") {
      const callerLine = this.getCallerLine();
      formattedMsg += `  <-- ${callerLine}`;
    }

    const consoleFn =
      level === "error" || level === "fatal"
        ? console.error
        : level === "warn"
        ? console.warn
        : console.log;

    if (error && this.errorVerbose && error instanceof Error) {
      consoleFn(formattedMsg, error, data ?? "");
    } else if (data) {
      consoleFn(formattedMsg, data);
    } else {
      consoleFn(formattedMsg);
    }
  };

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }
  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }
  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }
  error(message: string, data?: unknown, error?: unknown) {
    this.log("error", message, data, error);
  }
  fatal(message: string, data?: unknown) {
    this.log("fatal", message, data);
  }
  success(message: string, data?: unknown) {
    this.log("success", message, data);
  }
  trace(message: string, data?: unknown) {
    this.log("trace", message, data);
  }
  start(message: string, data?: unknown) {
    this.log("start", message, data);
  }
}

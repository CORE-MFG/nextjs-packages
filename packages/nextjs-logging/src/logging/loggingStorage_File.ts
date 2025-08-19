// /src/logging/loggingStorage_File.ts

import { isClient } from "../utils/isclient";
import { LogConfig, LogConfigEntry, LogLevel, LogType } from "../levels";
import { ILoggingStorage } from "./loggingStorage";

export class FileLoggingStorage implements ILoggingStorage {
  private filePath!: string;
  private ready: Promise<void>;


  constructor(filePath?: string) {
    if (isClient()) {
      throw new Error("FileLoggingStorage is not available in the browser");
    }

    // Dynamically import 'path' here to avoid bundling in client code and keep eslint happy
    this.ready = (async () => {
      const path = await import("path");
      this.filePath = filePath || path.resolve(process.cwd(), "config", "logging-config.json");

      this.ensureFileExists().catch((err) => {
        console.error("[FileLoggingStorage] Error ensuring file exists:", err);
      });
    })();
  }

  private async ensureFileExists() {
    const fs = await import("fs/promises");
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, "{}", "utf-8");
      // console.log(
      //   `[FileLoggingStorage] Created new config file at ${this.filePath}`
      // );
    }
  }

  async getConfig(): Promise<LogConfig> {
    await this.ready; // wait for init to complete
    const fs = await import("fs/promises");
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data) as LogConfig;
    } catch {
      return [];
    }
  }

  async set(logger: LogConfigEntry): Promise<void> {
    await this.ready;
    const config = await this.getConfig();
    const entry = config.find(entry => entry.name === logger.name);
    if (!entry) {
      config.push({ 
        name: logger.name,
        level: logger.level, 
        type: logger.type, 
        errorVerbose: logger.errorVerbose 
      });
    } else {
      entry.level = logger.level;
      entry.type = logger.type;
      entry.errorVerbose = logger.errorVerbose;
    }
    await this.setConfig(config);
  }

  async get(loggerName: string): Promise<LogConfigEntry> {
    await this.ready;
    const config = await this.getConfig();
    const entry = config.find(entry => entry.name === loggerName);
    if (!entry) {
      config.push({ 
        name: loggerName,
        level: "debug", 
        type: "service", 
        errorVerbose: false 
      });
    }
    return entry!;
  }

  async setConfig(config: LogConfig): Promise<void> {
    await this.ready;
    const fs = await import("fs/promises");
    await fs.writeFile(this.filePath, JSON.stringify(config, null, 2), "utf-8");
  }
}

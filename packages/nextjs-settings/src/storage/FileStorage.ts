import fs from "fs/promises";
import path from "path";

import { Settings } from "../settings";
import { ISettingsStorage, ISettingsStorageOptions } from "./ISettingsStorage";

import { Logger } from "@core-mfg/nextjs-logging";

const logger = new Logger("FileStorage", "service", "debug", true, true);

export interface FileStorageOptions extends ISettingsStorageOptions {
  /** Path to the settings file, absolute or relative */
  filePath: string;
}

export class FileStorage<T extends Settings = Settings>
  implements ISettingsStorage<T, FileStorageOptions>
{
  private filePath: string;

  constructor(options: FileStorageOptions) {
    logger.start("constructing");
    if (!options.filePath) {
      throw new Error("FileStorage requires a filePath");
    }
    this.filePath = path.resolve(options.filePath);
    logger.debug(`FileStorage initialized with filePath: ${this.filePath}`);
  }

  /** Ensure folder and file exist */
  async init(): Promise<void> {
    logger.start("init");
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(this.filePath);
      logger.debug("settings file already exists");
    } catch (err: any) {
      if (err.code === "ENOENT") {
        logger.debug("settings file not found, creating empty JSON");
        await fs.writeFile(this.filePath, "{}", "utf-8");
      } else {
        throw err;
      }
    }

    logger.success("FileStorage initialized successfully");
  }

  /** Load full settings from file */
  async load(): Promise<T> {
    logger.start("load");
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      const result = JSON.parse(data) as T;
      logger.success(`FileStorage loaded with ${Object.keys(result).length} keys`);
      logger.debug("loaded settings", result);
      return result;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        logger.warn("settings file missing during load, returning empty object");
        return {} as T;
      }
      throw err;
    }
  }

  /** Save full settings to file; ensures file exists if missing */
  async save(settings: T): Promise<void> {
    logger.start("save");
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(settings, null, 2), "utf-8");
      logger.success(`FileStorage saved with ${Object.keys(settings).length} keys`);
      logger.debug("saved settings", settings);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        logger.warn("file missing on save, re-running init()");
        await this.init();
        await fs.writeFile(this.filePath, JSON.stringify(settings, null, 2), "utf-8");
      } else {
        throw err;
      }
    }
  }

  async get(key: keyof T): Promise<T[keyof T] | undefined> {
    const settings = await this.load();
    return settings[key];
  }

  async set(key: keyof T, value: T[keyof T]): Promise<void> {
    const settings = await this.load();
    settings[key] = value;
    await this.save(settings);
  }

  async delete(key: keyof T): Promise<void> {
    const settings = await this.load();
    delete settings[key];
    await this.save(settings);
  }

  async exists(key: keyof T): Promise<boolean> {
    const settings = await this.load();
    return key in settings;
  }

  async close(): Promise<void> {}
}

import fs from "fs/promises";
import path from "path";

import { Settings } from "@/settings";
import { ISettingsStorage } from "@/storage/ISettingsStorage";

export interface FileStorageOptions {
  filePath?: string;
  defaults?: Settings;
}

export class FileStorage<T extends Settings = Settings> implements ISettingsStorage<T> {
  private filePath: string;
  private defaults: T;

  constructor(options: FileStorageOptions & { defaults?: T }) {
    const { filePath = "./config/settings.json", defaults = {} as T } = options;
    this.filePath = path.resolve(filePath);
    this.defaults = defaults as T;
  }

  async load(): Promise<T> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return { ...this.defaults, ...JSON.parse(data) } as T;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // File does not exist → return defaults
        return { ...this.defaults } as T;
      }
      throw err;
    }
  }

  async save(settings: T): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(settings, null, 2), "utf-8");
  }
}

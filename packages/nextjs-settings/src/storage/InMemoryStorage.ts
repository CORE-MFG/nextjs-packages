import { Settings } from "@/settings";
import { ISettingsStorage } from "@/storage/ISettingsStorage";

export interface InMemoryStorageOptions {
  defaults?: Settings;
}

export class InMemoryStorage<T extends Settings = Settings> implements ISettingsStorage<T> {
  private defaults: T;

  constructor(options: InMemoryStorageOptions & { defaults?: T }) {
    const { defaults = {} as T } = options;
    this.defaults = defaults as T;
  }

  async load(): Promise<T> {
    return { ...this.defaults } as T;
  }

  async save(settings: T): Promise<void> {
    this.defaults = { ...this.defaults, ...settings };
  }
}

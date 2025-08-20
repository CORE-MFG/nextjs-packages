import { Settings } from "../settings";
import { ISettingsStorage, ISettingsStorageOptions } from "./ISettingsStorage";

export interface InMemoryStorageOptions extends ISettingsStorageOptions {}

export class InMemoryStorage<T extends Settings = Settings>
  implements ISettingsStorage<T, InMemoryStorageOptions>
{
  private store: Partial<T> = {};

  constructor(private options?: InMemoryStorageOptions) {}

  async init(): Promise<void> {}

  async load(): Promise<T> {
    return { ...this.store } as T;
  }

  async save(settings: T): Promise<void> {
    this.store = { ...this.store, ...settings };
  }

  async get(key: keyof T): Promise<T[keyof T] | undefined> {
    return this.store[key];
  }

  async set(key: keyof T, value: T[keyof T]): Promise<void> {
    this.store[key] = value;
  }

  async delete(key: keyof T): Promise<void> {
    delete this.store[key];
  }

  async exists(key: keyof T): Promise<boolean> {
    return key in this.store;
  }

  async close(): Promise<void> {}
}

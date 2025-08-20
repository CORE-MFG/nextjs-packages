import { Settings } from "../settings";

export interface ISettingsStorageOptions {
  // common options for all storage backends, e.g., namespace, TTL, encryption
  namespace?: string;
  ttl?: number; // milliseconds
}

export interface ISettingsStorage<T extends Settings, O extends ISettingsStorageOptions = ISettingsStorageOptions> {
  /** Initialize storage (optional for in-memory, required for remote storage like Redis or Consul) */
  init?(options?: O): Promise<void>;

  /** Get a single setting by key */
  get(key: keyof T): Promise<T[keyof T] | undefined>;

  /** Set a single setting by key (may or may not persist immediately) */
  set(key: keyof T, value: T[keyof T]): Promise<void>;

  /** Remove a key from storage */
  delete?(key: keyof T): Promise<void>;

  /** Check if a key exists */
  exists?(key: keyof T): Promise<boolean>;

  /** Load the full settings object from storage */
  load(): Promise<T>;

  /** Persist the full settings object to storage */
  save(settings: T): Promise<void>;

  /** Close or cleanup resources (optional, e.g., disconnect Redis/Consul) */
  close?(): Promise<void>;
}

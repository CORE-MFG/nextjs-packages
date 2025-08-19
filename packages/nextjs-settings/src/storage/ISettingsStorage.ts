import { Settings } from "../settings";

export interface ISettingsStorage<T extends Settings> {
    load(): Promise<T | null>;
    save(settings: T): Promise<void>;
  }
  
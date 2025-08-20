// /src/settings.ts

import { Logger, LogLevel } from "@core-mfg/nextjs-logging";

import { ISettingsStorage } from "./storage/ISettingsStorage";
import { InMemoryStorage } from "./storage/InMemoryStorage";

Logger.setModuleGlobalLevel("warn");

export interface Settings {
  [key: string]: any; // generic key-value for app-specific settings
}

/**
 * Options for the SettingsManager class.
 * @param name - The name of the settings manager.
 * @param defaults - The default settings for the application.
 * @param storage - The storage for the settings.
 * @param settingsPrefix - The prefix for the settings in the environment variables (trimmed from the beginning of the environment variable during initialization).
 * @param allowExtra - Whether to allow extra settings to be set in the environment variables.
 * @param logLevel - The global log level for the nextjs-settings package.
 */
export interface SettingsManagerOptions<T extends Settings = Settings> {
  name: string;
  storage?: ISettingsStorage<T>;
  defaults?: T;
  settingsPrefix?: string;
  allowExtra?: boolean;
  logLevel?: LogLevel;
}

/**
 * SettingsSingleton is a singleton class that manages the settings for the application.
 *
 */
export class SettingsManager<T extends Settings = Settings> {
  private _settings: T = {} as T;
  private _storage: ISettingsStorage<T>;
  private _name: string;
  private _allowExtra: boolean;
  private _settingsPrefix: string;
  private _envVarsLoaded: boolean = false;
  private _logger: Logger;

  constructor(options: SettingsManagerOptions<T>) {
    const {
      name,
      storage,
      defaults = {} as T,
      settingsPrefix = "",
      allowExtra = false,
      logLevel = "warn",
    } = options;

    Logger.setModuleGlobalLevel(logLevel);
    this._logger = new Logger(name, "class", logLevel, true, true);

    this.log.start("constructor");
    this.log.debug("options", options);

    this._name = name;
    this._storage = storage ?? new InMemoryStorage();
    this._settings = { ...defaults };
    this._settingsPrefix = settingsPrefix;
    this._allowExtra = allowExtra;
  }

  get name(): string {
    return this._name;
  }

  get storage(): ISettingsStorage<T> {
    return this._storage;
  }

  get envVarsLoaded(): boolean {
    return this._envVarsLoaded;
  }

  get log(): Logger {
    return this._logger;
  }

  async initialize() {
    this.log.start("initializing", this.name);

    // Step 1: Apply env vars
    this.loadFromEnvVars();

    // Step 2: Overlay storage settings
    const loaded = await this._storage.load();
    this._settings = { ...this._settings, ...(loaded ?? {}) };

    this.log.success("initialized", this.name);
  }

  get(): T {
    return this._settings;
  }

  /** Return a single setting */
  getValue<K extends keyof T>(key: K): T[K] {
    return this._settings[key];
  }

  /** Set a single setting */
  setValue<K extends keyof T>(key: K, value: T[K]) {
    this._settings[key] = value;
    this._storage.save(this._settings);
  }

  async set(newSettings: Partial<T>) {
    this._settings = { ...this._settings, ...newSettings };
    await this._storage.save(this._settings);
  }

  /** Re-sync from env + storage */
  async refresh() {
    this.log.start("refreshing", this.name);

    this.loadFromEnvVars();
    const loaded = await this._storage.load();
    this._settings = { ...this._settings, ...(loaded ?? {}) };

    this.log.success("refreshed", this.name);
  }

  /** Internal: assign env vars to matching keys in settings */
  private loadFromEnvVars() {
    this.log.start("loading from env vars", this.name);
    const prefix = this._settingsPrefix.toUpperCase();

    if (this._allowExtra && prefix) {
      // Apply all env vars that start with the prefix
      const fullPrefix = prefix + "_";
      for (const [envVar, value] of Object.entries(process.env)) {
        if (envVar.startsWith(fullPrefix)) {
          const key = envVar.slice(fullPrefix.length).toLowerCase();
          this.assignEnvValue(key as keyof T, value!);
        }
      }
    } else {
      // Only update existing keys
      for (const key of Object.keys(this._settings) as (keyof T)[]) {
        const envVarName = this.getEnvVarName(key as string);
        if (process.env[envVarName]) {
          this.assignEnvValue(key, process.env[envVarName]!);
        }
      }
    }
    this._envVarsLoaded = true;
    this.log.success("loaded settings from env vars");
  }

  /** Helper to parse and assign env var values */
  // private assignEnvValue(key: keyof T, value: string) {
  //   try {
  //     this._settings[key] = JSON.parse(value);
  //   } catch {
  //     this._settings[key] = value as any;
  //   }
  // }
  /** Helper to parse and assign env var values */
  private assignEnvValue(key: keyof T, raw: string) {
    let parsed: any = raw;

    // Heuristic parsing before JSON
    if (raw === "true" || raw === "false") {
      parsed = raw === "true";
    } else if (!isNaN(Number(raw))) {
      parsed = Number(raw);
    } else {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
    }

    this._settings[key] = parsed;
  }

  /** Returns the env var name for a given key, using prefix if set */
  private getEnvVarName(key: string) {
    if (this._settingsPrefix) {
      return `${this._settingsPrefix}_${key}`.toUpperCase();
    }
    return key.toUpperCase();
  }
}

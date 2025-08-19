// /src/settings.ts

import { ISettingsStorage } from "./storage/ISettingsStorage";
import { Logger, LogLevel } from "nextjs-logging";

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
  storage: ISettingsStorage<T>;
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
  private _storage: ISettingsStorage<T> = {} as ISettingsStorage<T>;
  private _name: string = "";
  private _allowExtra: boolean = false;
  private settings_prefix: string = "";
  private _syncedFromEnv: boolean = false;
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
    this._logger = new Logger(name, "class", logLevel, true);

    this.log.start("constructor");
    this.log.debug("options", options);

    this._name = name;
    this._storage = storage;

    this._settings = { ...defaults };
    this.settings_prefix = settingsPrefix;
    this._allowExtra = allowExtra;


    this.initialize();
  }

  get name(): string {
    return this._name;
  }

  get storage(): ISettingsStorage<T> {
    return this._storage;
  }

  get syncedFromEnv(): boolean {
    return this._syncedFromEnv;
  }

  get log(): Logger {
    return this._logger;
  }

  async initialize() {
    this.log.start("initializing", this.name);

    if (this._storage && this.syncedFromEnv) {
      const loaded = await this._storage.load();
      this._settings = { ...this._settings, ...(loaded ?? {}) };
    } else {
      this.loadFromEnvVars();
    }

    this.log.success("initialized", this.name);
  }

  get(): T {
    return this._settings;
  }

  async set(newSettings: Partial<T>) {
    this._settings = { ...this._settings, ...newSettings };
    if (this._storage) {
      await this._storage.save(this._settings);
    }
  }

  async refresh() {
    this.log.start("refreshing", this.name);
    if (this._storage && !this.syncedFromEnv) {
      const loaded = await this._storage.load();
      this._settings = { ...this._settings, ...(loaded ?? {}) };
    } else {
      this.loadFromEnvVars();
    }
    this.log.success("refreshed", this.name);
  }

  /** Internal: assign env vars to matching keys in settings */
  private loadFromEnvVars() {
    this.log.start("loading from env vars", this.name);
    const prefix = this.settings_prefix.toUpperCase();
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
    this._syncedFromEnv = true;
    this.log.success("loaded from env vars", this.name);
  }

  /** Helper to parse and assign env var values */
  private assignEnvValue(key: keyof T, value: string) {
    try {
      this._settings[key] = JSON.parse(value);
    } catch {
      this._settings[key] = value as any;
    }
  }

  /** Returns the env var name for a given key, using prefix if set */
  private getEnvVarName(key: string) {
    if (this.settings_prefix) {
      return `${this.settings_prefix}_${key}`.toUpperCase();
    }
    return key.toUpperCase();
  }
}

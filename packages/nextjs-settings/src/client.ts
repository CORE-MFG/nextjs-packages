// /src/client.ts

// Client-side only exports (no Node.js dependencies)
export { 
  createClientSettings as createSettingsStore,
  type ClientSettingsOptions as SettingsOptions,
  type SettingsApiClient,
  DefaultSettingsApiClient 
} from './store/clientSettings';

export * from './hooks/useSettingsRefresh';

// Re-export only the types we need from settings
export type { Settings, SettingsManagerOptions } from './settings';

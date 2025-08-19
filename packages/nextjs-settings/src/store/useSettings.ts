// /src/store/useSettings.ts

'use client';

import { create } from 'zustand';
import { SettingsManager, SettingsManagerOptions, Settings } from '../settings';
import { useEffect } from 'react';

// Generic Zustand store type
interface SettingsStore<T extends Settings = Settings> {
  settings: T;
  setSettings: (partial: Partial<T>) => void;
  refreshSettings: () => Promise<void>;
  manager: SettingsManager<T>;
}

// Factory for creating a useSettings hook
export function createUseSettings<T extends Settings = Settings>(
  options: SettingsManagerOptions<T>
) {
  const manager = new SettingsManager<T>(options);

  const useSettings = create<SettingsStore<T>>((set) => ({
    settings: manager.get(),
    manager,
    setSettings: async (partial: Partial<T>) => {
      set((state) => ({ settings: { ...state.settings, ...partial } }));
      await manager.set(partial);
    },
    refreshSettings: async () => {
      await manager.refresh();
      set({ settings: manager.get() });
    },
  }));

  // Initialize from env / Redis once on mount
  const useSettingsInit = () => {
    useEffect(() => {
      (async () => {
        await manager.initialize();
        useSettings.setState({ settings: manager.get() });
      })();
    }, []);
  };

  return { useSettings, useSettingsInit };
}

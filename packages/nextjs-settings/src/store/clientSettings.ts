// /src/store/clientSettings.ts

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Only import types from settings, not the actual class
import type { SettingsManagerOptions, Settings } from '../settings';
import { useEffect, useCallback } from 'react';
// import { ClientSettingsStore } from './useSettings';

// Client-side settings API interface
export interface SettingsApiClient {
  fetchSettings: () => Promise<any>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

// Default API client implementation
export class DefaultSettingsApiClient implements SettingsApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async fetchSettings(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/ui/config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }
    return response.json();
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ui/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update settings: ${response.statusText}`);
    }
  }
}

// Generic Zustand store type with enhanced client-side features
export interface ClientSettingsStore<T extends Settings = Settings> {
  settings: T;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  setSettings: (partial: Partial<T>, persistToServer?: boolean) => Promise<void>;
  refreshSettings: () => Promise<void>;
  fetchFromServer: () => Promise<void>;
  clearError: () => void;
  
  // API client only (no server-side manager in client)
  apiClient: SettingsApiClient;
}
// Options for client-side settings store
export interface ClientSettingsOptions<T extends Settings = Settings> extends SettingsManagerOptions<T> {
  apiClient?: SettingsApiClient;
  localStorageKey?: string;
  enableLocalStorage?: boolean;
  autoRefreshInterval?: number;
}

// Simple hook factory that returns a typed store
export function createClientSettings<T extends Settings = Settings>(
  options: ClientSettingsOptions<T>
) {
  const {
    apiClient = new DefaultSettingsApiClient(),
    localStorageKey = `settings-${options.name}`,
    enableLocalStorage = true,
    autoRefreshInterval,
    defaults = {} as T,
    ...managerOptions
  } = options;

  // Store creator function to avoid duplication
  const storeCreator = (set: any, get: any) => ({
    settings: defaults,
    isLoading: false,
    error: null,
    lastFetched: null,
    apiClient,

    setSettings: async (partial: Partial<T>, persistToServer: boolean = false) => {
      try {
        set((state: ClientSettingsStore<T>) => ({
          ...state,
          settings: { ...state.settings, ...partial },
          error: null,
        }));

        if (persistToServer) {
          await apiClient.updateSettings(partial);
        }
      } catch (error) {
        set((state: ClientSettingsStore<T>) => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to update settings'
        }));
        throw error;
      }
    },

    refreshSettings: async () => {
      try {
        set((state: ClientSettingsStore<T>) => ({ ...state, isLoading: true, error: null }));
        // In client-only mode, refreshing means fetching from server
        await get().fetchFromServer();
      } catch (error) {
        set((state: ClientSettingsStore<T>) => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to refresh settings',
          isLoading: false
        }));
        throw error;
      }
    },

    fetchFromServer: async () => {
      try {
        set((state: ClientSettingsStore<T>) => ({ ...state, isLoading: true, error: null }));
        const serverResponse = await apiClient.fetchSettings();
        
        // Extract settings from server response (handle both {settings: ...} and direct settings format)
        const serverSettings = serverResponse.settings || serverResponse;
        
        // Merge server settings with current defaults
        const mergedSettings = { ...defaults, ...serverSettings };
        
        set((state: ClientSettingsStore<T>) => ({
          ...state,
          settings: mergedSettings,
          isLoading: false,
          lastFetched: Date.now()
        }));
      } catch (error) {
        set((state: ClientSettingsStore<T>) => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to fetch settings from server',
          isLoading: false
        }));
        throw error;
      }
    },

    clearError: () => {
      set((state: ClientSettingsStore<T>) => ({ ...state, error: null }));
    },
  });

  // Create the store
  const store = enableLocalStorage
    ? (create(
        persist(storeCreator as any, {
          name: localStorageKey,
          storage: createJSONStorage(() => localStorage),
          partialize: (state: ClientSettingsStore<T>) => ({
            settings: state.settings,
            lastFetched: state.lastFetched
          }),
        }) as any
      ) as any)
    : create(storeCreator);
  
  // Type-safe store reference
  const typedStore = store as { getState: () => ClientSettingsStore<T>; setState: any; subscribe: any };

  // Initialization hook
  const useInit = () => {
    useEffect(() => {
      (async () => {
        try {
          // Try to fetch from server on first load
          const state = typedStore.getState();
          if (!state.lastFetched || Date.now() - state.lastFetched > 60000) { // 1 minute
            await state.fetchFromServer();
          }
        } catch (error) {
          console.warn('Settings initialization failed:', error);
        }
      })();
    }, []);

    useEffect(() => {
      if (!autoRefreshInterval) return;
      
      const interval = setInterval(() => {
        typedStore.getState().fetchFromServer().catch(console.warn);
      }, autoRefreshInterval);
      
      return () => clearInterval(interval);
    }, []);
  };

  // Refresh function (not a hook)
  const refreshSettings = async (fromServer: boolean = true) => {
    const state = typedStore.getState();
    if (fromServer) {
      await state.fetchFromServer();
    } else {
      await state.refreshSettings();
    }
  };

  return {
    useStore: store,
    useInit,
    refresh: refreshSettings
  };
}

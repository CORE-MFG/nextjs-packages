// Simple example usage of the nextjs-settings package

import React from 'react';
import { createClientSettings } from '../src/store/clientSettings';
import { InMemoryStorage } from '../src/storage/InMemoryStorage';

// 1. Define your settings interface
interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  autoSave: boolean;
}

const defaults: AppSettings = {
  theme: 'light',
  language: 'en',
  notifications: true,
  autoSave: true,
};

// 2. Create the settings store
const { useStore, useInit, refresh} = createClientSettings<AppSettings>({
  name: 'nextjs-settings',
  defaults,
  storage: new InMemoryStorage<AppSettings>({ defaults }),
  enableLocalStorage: true,
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
});

// 3. Component using the settings
export function SimpleSettingsExample() {
  // Initialize settings
  useInit();

  // Get settings and actions
  const settings = useStore((state: any) => state.settings);
  const setSettings = useStore((state: any) => state.setSettings);
  const isLoading = useStore((state: any) => state.isLoading);
  const error = useStore((state: any) => state.error);
  const clearError = useStore((state: any) => state.clearError);

  const toggleTheme = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    await setSettings({ theme: newTheme }, true); // true = persist to server
  };

  const toggleNotifications = async () => {
    await setSettings({ notifications: !settings.notifications });
  };

  const handleRefresh = async () => {
    try {
      await refresh(true); // true = fetch from server
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  return (
    <div className={`settings-panel theme-${settings.theme}`}>
      <h2>App Settings</h2>
      
      {error && (
        <div className="error">
          Error: {error}
          <button onClick={clearError}>Clear</button>
        </div>
      )}

      {isLoading && <div className="loading">Loading settings...</div>}

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.theme === 'dark'}
            onChange={toggleTheme}
          />
          Dark Mode
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={toggleNotifications}
          />
          Enable Notifications
        </label>
      </div>

      <div className="setting-group">
        <label>
          Language:
          <select
            value={settings.language}
            onChange={(e) => setSettings({ language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </label>
      </div>

      <div className="actions">
        <button onClick={handleRefresh} disabled={isLoading}>
          Refresh Settings
        </button>
      </div>

      <div className="debug">
        <h3>Current Settings:</h3>
        <pre>{JSON.stringify(settings, null, 2)}</pre>
      </div>
    </div>
  );
}

// 4. Example server-side API route setup
/* 
// app/api/ui/config/route.ts
import { createNextApiRoute, SettingsManager } from 'nextjs-settings';

const settingsManager = new SettingsManager<AppSettings>({
  name: 'myapp',
  defaults: {
    theme: 'light',
    language: 'en',
    notifications: true,
    autoSave: true,
  },
  redisUrl: process.env.REDIS_URL,
});

export const { GET, POST } = createNextApiRoute(settingsManager);
*/

// 5. Usage in your app
/*
// app/layout.tsx or app/page.tsx
import { SimpleSettingsExample } from '../components/SimpleSettingsExample';

export default function Layout() {
  return (
    <div>
      <SimpleSettingsExample />
    </div>
  );
}
*/

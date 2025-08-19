# NextJS Settings

A comprehensive settings management package for Next.js applications with client-side Zustand store, localStorage persistence, and server-side API integration.

## Features

- 🏪 **Zustand Store**: Type-safe client-side state management
- 💾 **LocalStorage Persistence**: Automatic settings persistence with Zustand middleware
- 🔄 **Auto Refresh**: Configurable refresh triggers (page focus, visibility change, intervals)
- 🌐 **API Integration**: Built-in API client for server synchronization
- ⚡ **Real-time Updates**: Optimistic updates with server persistence
- 🔒 **RBAC Ready**: Extensible permission system (coming soon)
- 📦 **Server Manager**: Redis/JSON/in-memory server-side storage
- 🎯 **TypeScript**: Full type safety with generic interfaces

## Installation

```bash
npm install nextjs-settings
# or
yarn add nextjs-settings
# or
pnpm add nextjs-settings
```

## Quick Start

### 1. Define Your Settings Interface

```typescript
interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  autoSave: boolean;
}
```

### 2. Create Settings Store

```typescript
// lib/settings.ts
import { createClientSettings } from 'nextjs-settings';

export const { useStore, useInit, useRefresh } = createClientSettings<AppSettings>({
  name: 'myapp',
  defaults: {
    theme: 'light',
    language: 'en',
    notifications: true,
    autoSave: true,
  },
  enableLocalStorage: true,
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
});
```

### 3. Setup API Route

```typescript
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
  redisUrl: process.env.REDIS_URL, // Optional
});

export const { GET, POST } = createNextApiRoute(settingsManager);
```

### 4. Use in Components

```typescript
// components/Settings.tsx
import React from 'react';
import { useStore, useInit, useRefresh } from '../lib/settings';

export function Settings() {
  // Initialize settings on component mount
  useInit();

  // Get settings and actions
  const settings = useStore(state => state.settings);
  const setSettings = useStore(state => state.setSettings);
  const isLoading = useStore(state => state.isLoading);
  const error = useStore(state => state.error);

  // Manual refresh function
  const refresh = useRefresh();

  const toggleTheme = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    await setSettings({ theme: newTheme }, true); // true = persist to server
  };

  const handleRefresh = async () => {
    await refresh(true); // true = fetch from server
  };

  return (
    <div className={`app theme-${settings.theme}`}>
      <h2>Settings</h2>
      
      {error && <div className="error">{error}</div>}
      {isLoading && <div className="loading">Loading...</div>}
      
      <button onClick={toggleTheme}>
        Switch to {settings.theme === 'light' ? 'dark' : 'light'} mode
      </button>
      
      <button onClick={handleRefresh}>
        Refresh Settings
      </button>
    </div>
  );
}
```

## Advanced Usage

### Custom API Client

```typescript
import { SettingsApiClient } from 'nextjs-settings';

class CustomApiClient implements SettingsApiClient {
  constructor(private baseUrl: string, private authToken?: string) {}

  async fetchSettings() {
    const response = await fetch(`${this.baseUrl}/ui/config`, {
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
      },
    });
    return response.json();
  }

  async updateSettings(settings: Partial<AppSettings>) {
    await fetch(`${this.baseUrl}/ui/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
      },
      body: JSON.stringify(settings),
    });
  }
}

const { useStore } = createClientSettings({
  name: 'myapp',
  defaults: { theme: 'light' },
  apiClient: new CustomApiClient('/api', 'your-auth-token'),
});
```

### Server-Side with Validation

```typescript
// app/api/ui/config/route.ts
import { createSettingsApiHandler } from 'nextjs-settings';

export const { GET, POST } = createSettingsApiHandler({
  settingsManager,
  validateUpdate: async (settings, request) => {
    // Add your validation logic
    const user = await getUserFromRequest(request);
    return user?.hasPermission('settings:write') || false;
  },
  onSettingsUpdate: async (oldSettings, newSettings, request) => {
    // Log changes, send notifications, etc.
    console.log('Settings updated:', { oldSettings, newSettings });
  },
  transformResponse: (settings) => {
    // Filter sensitive data before sending to client
    const { internal, ...publicSettings } = settings;
    return publicSettings;
  },
});
```

### Refresh Triggers

```typescript
import { useRefreshTrigger } from 'nextjs-settings';
import { useRefresh } from '../lib/settings';

function MyComponent() {
  const refresh = useRefresh();
  const buttonRefresh = useRefreshTrigger(() => refresh(true));

  // Automatic triggers are set up by useInit()
  // - Page visibility change
  // - Window focus
  // - Network reconnection
  // - Configurable intervals

  return (
    <button onClick={buttonRefresh}>
      Manual Refresh
    </button>
  );
}
```

## Configuration Options

### Client Settings Options

```typescript
interface ClientSettingsOptions<T> {
  name: string;                    // Unique identifier for the settings
  defaults?: T;                    // Default settings values
  apiClient?: SettingsApiClient;   // Custom API client
  localStorageKey?: string;        // localStorage key (default: "settings-{name}")
  enableLocalStorage?: boolean;    // Enable localStorage persistence (default: true)
  autoRefreshInterval?: number;    // Auto refresh interval in ms
  settingsPrefix?: string;         // Environment variable prefix
  allowExtra?: boolean;            // Allow extra settings from env vars
  redisUrl?: string;              // Redis connection URL
}
```

### Server Settings Options

```typescript
interface SettingsManagerOptions<T> {
  name: string;                    // Settings manager name
  defaults?: T;                    // Default settings
  settingsPrefix?: string;         // Environment variable prefix
  allowExtra?: boolean;            // Allow extra environment variables
  redisUrl?: string;              // Redis connection URL
}
```

## API Reference

### Client-Side Store

```typescript
interface ClientSettingsStore<T> {
  settings: T;                     // Current settings
  isLoading: boolean;              // Loading state
  error: string | null;            // Error message
  lastFetched: number | null;      // Last fetch timestamp
  
  setSettings: (partial: Partial<T>, persistToServer?: boolean) => Promise<void>;
  refreshSettings: () => Promise<void>;     // Refresh from manager
  fetchFromServer: () => Promise<void>;     // Fetch from API
  clearError: () => void;                   // Clear error state
}
```

### Hooks

- `useInit()`: Initialize settings on component mount
- `useRefresh()`: Get refresh function with automatic triggers
- `useRefreshTrigger(fn)`: Create manual refresh trigger
- `useIntervalRefresh(fn, ms)`: Set up interval-based refresh
- `useNetworkRefresh(fn)`: Refresh on network reconnection

## Best Practices

1. **Initialize Once**: Call `useSettingsInit()` in your root component or layout
2. **Selective Subscriptions**: Subscribe to specific parts of the store to avoid unnecessary re-renders
3. **Error Handling**: Always handle errors in your UI
4. **Server Persistence**: Use `persistToServer: true` for important settings changes
5. **Type Safety**: Define strict interfaces for your settings
6. **Validation**: Implement server-side validation for security
7. **Performance**: Use `partialize` in localStorage config for large settings objects

## Examples

Check out the [examples directory](./src/examples/) for complete implementation examples:

- Basic usage with React components
- Custom API client implementation
- Server-side validation and RBAC
- Advanced refresh patterns

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see LICENSE file for details.
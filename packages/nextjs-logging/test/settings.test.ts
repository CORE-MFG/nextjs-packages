import 'dotenv/config'; // automatically loads .env from root into process.env
import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsManager } from '../src/settings';
import { InMemoryStorage } from '../src/storage/InMemoryStorage';

interface MySettings {
  connection_count: number;
};

let settings: SettingsManager<MySettings>;

describe('SettingsManager', () => {
  beforeEach(() => {
    const inMemoryStorage = new InMemoryStorage({
      defaults: { connection_count: 0 } as MySettings,
    });
    
    settings = new SettingsManager({
      name: 'test',
      defaults: { connection_count: 0 } as MySettings,
      settingsPrefix: 'api',
      storage: inMemoryStorage,
    });
  
    settings.initialize();
  });


  it('initializes with default settings', () => {
    expect(settings.get()).toHaveProperty('connection_count');
  });

  it('can update settings in memory', async () => {
    await settings.set({ connection_count: 1 });
    expect(settings.get().connection_count).toBe(1);
  });

  it('applies env variables if present', () => {
    settings.refresh();
    expect(settings.get().connection_count).toBe(3);
  });
});

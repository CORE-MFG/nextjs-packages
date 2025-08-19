import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingsManager, SettingsManagerOptions } from '../src/settings';
import { RedisStorage } from '../src/storage/RedisStorage';

interface MySettings {
  connection_count: number;
  foo: string;
  bar: number;
  baz: boolean;
}

const defaults: MySettings = {
  connection_count: 0,
  foo: 'foo',
  bar: 1,
  baz: true,
}

let settings: SettingsManager<MySettings>;
let redisStorage: RedisStorage<MySettings>;

describe('SettingsManager with RedisStorage', () => {
  beforeEach(async () => {
    const appName = 'nextjs-settings';
    
    // Create a fresh RedisStorage instance
    redisStorage = new RedisStorage({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      key: `${appName}:settings`,
    });

    // Clear Redis key before each test
    await redisStorage.save(defaults);

    // Initialize SettingsManager with RedisStorage
    settings = new SettingsManager({
      name: appName,
      storage: redisStorage,
      defaults,
      settingsPrefix: 'api',
      logLevel: "warn",
    } as SettingsManagerOptions<MySettings>);

    // Wait for async initialization
    await settings.initialize();
  });

  afterEach(async () => {
    // Optional: clean up Redis key
    await redisStorage.save(defaults);
  });

  it('initializes with default settings', () => {
    expect(settings.get()).toHaveProperty('connection_count');
    expect(settings.get().connection_count).toBe(0);
  });

  it('can update settings in memory and persist to Redis', async () => {
    await settings.set({ connection_count: 5 });

    // Verify in memory
    expect(settings.get().connection_count).toBe(5);

    // Verify persisted in Redis
    const loaded = await redisStorage.load();
    expect(loaded?.connection_count).toBe(5);
  });

  it('applies env variables if present', async () => {
    process.env.API_CONNECTION_COUNT = '3';
    await settings.refresh();
    expect(settings.get().connection_count).toBe(3);
    delete process.env.API_CONNECTION_COUNT;
  });
});

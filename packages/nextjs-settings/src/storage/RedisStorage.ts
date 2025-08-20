import Redis from "ioredis";

import { Settings } from "../settings";
import { ISettingsStorage, ISettingsStorageOptions } from "./ISettingsStorage";

import { Logger } from "@core-mfg/nextjs-logging";

const logger = new Logger("RedisStorage", "unknown", "debug", true);

export interface RedisStorageOptions extends ISettingsStorageOptions {
  redisUrl: string;
  key: string; // Redis key under which settings are stored
}

export class RedisStorage<
  T extends Settings = Settings
> implements ISettingsStorage<T, RedisStorageOptions> {
  private redis: Redis;
  private key: string;
  private namespace: string;
  private ttl: number;

  constructor(options: RedisStorageOptions) {
    const { redisUrl, key, namespace, ttl } = options;
    this.redis = new Redis(redisUrl);
    this.key = key;
    this.namespace = namespace ?? "";
    this.ttl = ttl ?? 0;
  }

  async init(): Promise<void> {
    logger.start("init", this.key);
    // Optionally: ping to ensure connection
    await this.redis.ping();
    logger.success("initialized", this.key);
  }

  private fullKey(): string {
    return this.namespace ? `${this.namespace}:${this.key}` : this.key;
  }

  async get<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    logger.start("get", String(key));
    const data = await this.redis.hget(this.fullKey(), String(key));
    if (data === null) return undefined;
    try {
      return JSON.parse(data) as T[K];
    } catch {
      return data as any;
    }
  }

  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    logger.start("set", String(key));
    await this.redis.hset(
      this.fullKey(),
      String(key),
      JSON.stringify(value)
    );
    if (this.ttl) {
      await this.redis.pexpire(this.fullKey(), this.ttl);
    }
    logger.success("set", String(key));
  }

  async delete<K extends keyof T>(key: K): Promise<void> {
    logger.start("delete", String(key));
    await this.redis.hdel(this.fullKey(), String(key));
    logger.success("deleted", String(key));
  }

  async exists<K extends keyof T>(key: K): Promise<boolean> {
    logger.start("exists", String(key));
    const res = await this.redis.hexists(this.fullKey(), String(key));
    return res === 1;
  }

  async load(): Promise<T> {
    logger.start("load", this.key);
    const data = await this.redis.hgetall(this.fullKey());
    if (!data || Object.keys(data).length === 0) {
      return {} as T; // safe empty object
    }
    const result: Partial<T> = {};
    for (const [k, v] of Object.entries(data)) {
      try {
        result[k as keyof T] = JSON.parse(v);
      } catch {
        result[k as keyof T] = v as any;
      }
    }
    logger.success("loaded", this.key);
    logger.debug("result", result);
    return result as T;
  }

  async save(settings: T): Promise<void> {
    logger.start("save", this.key);
    const entries: [string, string][] = Object.entries(settings).map(
      ([k, v]) => [k, JSON.stringify(v)]
    );
    if (entries.length > 0) {
      await this.redis.hset(this.fullKey(), ...entries.flat());
    }
    if (this.ttl) {
      await this.redis.pexpire(this.fullKey(), this.ttl);
    }
    logger.success("saved", this.key);
  }

  async close(): Promise<void> {
    logger.start("close", this.key);
    await this.redis.quit();
    logger.success("closed", this.key);
  }
}

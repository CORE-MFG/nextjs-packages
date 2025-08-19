import { ISettingsStorage } from "./ISettingsStorage";
import { Settings } from "../settings";
import Redis from "ioredis";
import { Logger } from "@core-mfg/nextjs-logging";

const logger = new Logger("RedisStorage", "unknown", "debug", true);

export interface RedisStorageOptions {
  redisUrl: string;
  key: string; // Redis key under which settings are stored
}

export class RedisStorage<T extends Settings = Settings> implements ISettingsStorage<T> {
  private redis: Redis;
  private key: string;

  constructor(options: RedisStorageOptions) {
    const { redisUrl, key} = options;
    this.redis = new Redis(redisUrl);
    this.key = key;
  }

  async load(): Promise<T | null> {
    logger.start("loading", this.key);
    const data = await this.redis.get(this.key);
    let result: T | null = null;
    if (!data) return null; // just indicate nothing is stored
    try {
      result = JSON.parse(data) as T;
    } catch (err) {
      logger.error("Failed to parse Redis data:", err);
      result = null; // let the caller handle defaults
    }
    logger.success("loaded", this.key);
    logger.debug("result", result);
    return result;
  }

  async save(settings: T): Promise<void> {
    logger.start("saving", this.key);
    await this.redis.set(this.key, JSON.stringify(settings));
    logger.success("saved", this.key);
  }
}

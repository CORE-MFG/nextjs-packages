// /src/lib/logging/loggingStorageFactory.ts

'use server';

import { ILoggingStorage } from './loggingStorage';

export async function createLoggingStorage(): Promise<ILoggingStorage> {
  const type = process.env.LOGGING_STORAGE_TYPE || 'settings';

  if (type === 'file') {
    if (typeof window !== 'undefined') {
      throw new Error('FileLoggingStorage is not available in the browser');
    }
    const { FileLoggingStorage } = await import('./loggingStorage_File');
    return new FileLoggingStorage();
  }

  if (type === 'redis') {
    // const { RedisLoggingStorage } = await import('./redisLoggingStorage');
    throw new Error('RedisLoggingStorage not implemented yet');
  }

  throw new Error(`Unknown LOGGING_STORAGE_TYPE: ${type}`);
}

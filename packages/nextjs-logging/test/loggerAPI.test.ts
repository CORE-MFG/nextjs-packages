import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '../src/logger';
import {
  getServerLoggersHandler,
  postServerLoggerHandler,
  putServerLoggerHandler,
  putServerLoggersBatchHandler,
  validateLoggerUpdate
} from '../src/api/loggingRoutes';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn(),
  },
}));

// Mock the registry - define inline to avoid hoisting issues
vi.mock('../src/registry/serverRegistry', () => ({
  registry: {
    register: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  },
}));

// Import the mocked registry after mocking
import { registry } from '../src/registry/serverRegistry';

// Get the mocked version for test manipulation
const mockRegistry = vi.mocked(registry);

describe('Logger API Route Handlers', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset module global level before each test
    Logger.setModuleGlobalLevel(null);
    
    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };

    // Reset registry mocks
    mockRegistry.register.mockReset();
    mockRegistry.list.mockReset();
    mockRegistry.get.mockReset();
    mockRegistry.update.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getServerLoggersHandler', () => {
    it('should return list of loggers successfully', async () => {
      const mockLoggers = {
        'logger1': new Logger('logger1', 'service', 'info', false, true, false),
        'logger2': new Logger('logger2', 'component', 'warn', true, true, false),
      };

      mockRegistry.list.mockReturnValue(mockLoggers);

      const mockRequest = {};
      const mockResponse = { status: 200 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await getServerLoggersHandler(mockRequest as NextRequest);

      expect(mockRegistry.list).toHaveBeenCalledTimes(1);
      expect(NextResponse.json).toHaveBeenCalledWith({
        loggingConfig: expect.any(Array),
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle errors and return 500', async () => {
      mockRegistry.list.mockImplementation(() => {
        throw new Error('Database error');
      });

      const mockRequest = {};
      const mockResponse = { status: 500 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await getServerLoggersHandler(mockRequest as NextRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Failed to fetch loggers" },
        { status: 500 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('postServerLoggerHandler', () => {
    it('should create a new logger successfully', async () => {
      const loggerData = {
        name: 'new-logger',
        level: 'debug' as const,
        type: 'service' as const,
        errorVerbose: true,
        enabled: true,
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(loggerData),
      };

      mockRegistry.register.mockResolvedValue(undefined);

      const mockResponse = { status: 200 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await postServerLoggerHandler(mockRequest as any);

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockRegistry.register).toHaveBeenCalledTimes(1);
      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        config: expect.any(Object),
      });
      expect(result).toBe(mockResponse);
    });

    it('should validate logger name', async () => {
      const loggerData = {
        name: '',
        level: 'debug' as const,
        type: 'service' as const,
        errorVerbose: true,
        enabled: true,
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(loggerData),
      };

      const mockResponse = { status: 400 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await postServerLoggerHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Invalid 'name'" },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should validate logger level', async () => {
      const loggerData = {
        name: 'test-logger',
        level: 'invalid-level' as any,
        type: 'service' as const,
        errorVerbose: true,
        enabled: true,
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(loggerData),
      };

      const mockResponse = { status: 400 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await postServerLoggerHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: expect.stringContaining("Invalid 'level'") },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should validate logger type', async () => {
      const loggerData = {
        name: 'test-logger',
        level: 'debug' as const,
        type: 'invalid-type' as any,
        errorVerbose: true,
        enabled: true,
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(loggerData),
      };

      const mockResponse = { status: 400 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await postServerLoggerHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: expect.stringContaining("'type' must be one of") },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should validate errorVerbose boolean', async () => {
      const loggerData = {
        name: 'test-logger',
        level: 'debug' as const,
        type: 'service' as const,
        errorVerbose: 'not-boolean' as any,
        enabled: true,
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(loggerData),
      };

      const mockResponse = { status: 400 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await postServerLoggerHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "'errorVerbose' must be a boolean" },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('putServerLoggerHandler', () => {
    it('should update an existing logger successfully', async () => {
      const updateData = {
        name: 'existing-logger',
        level: 'error' as const,
        errorVerbose: false,
        enabled: false,
      };

      const existingLogger = new Logger('existing-logger', 'service', 'info', true, true, false);

      const mockRequest = {
        json: vi.fn().mockResolvedValue(updateData),
      };

      mockRegistry.get.mockReturnValue(existingLogger);
      mockRegistry.update.mockResolvedValue(undefined);

      const mockResponse = { status: 200 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await putServerLoggerHandler(mockRequest as any);

      expect(mockRegistry.get).toHaveBeenCalledWith('existing-logger');
      expect(mockRegistry.update).toHaveBeenCalledTimes(1);
      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        config: expect.any(Object),
      });
      expect(result).toBe(mockResponse);
    });

    it('should return 404 for non-existent logger', async () => {
      const updateData = {
        name: 'non-existent-logger',
        level: 'error' as const,
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(updateData),
      };

      mockRegistry.get.mockReturnValue(undefined);

      const mockResponse = { status: 404 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await putServerLoggerHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Logger 'non-existent-logger' not found in registry" },
        { status: 404 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle validation errors', async () => {
      const updateData = {
        name: '',
        level: 'invalid' as any,
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(updateData),
      };

      const mockResponse = { status: 400 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await putServerLoggerHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Invalid logger 'name'" },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('putServerLoggersBatchHandler', () => {
    it('should process batch updates successfully', async () => {
      const batchData = [
        {
          name: 'logger1',
          level: 'error' as const,
          errorVerbose: false,
        },
        {
          name: 'logger2',
          level: 'debug' as const,
          enabled: false,
        },
      ];

      const logger1 = new Logger('logger1', 'service', 'info', true, true, false);
      const logger2 = new Logger('logger2', 'component', 'warn', false, true, false);

      const mockRequest = {
        json: vi.fn().mockResolvedValue(batchData),
      };

      mockRegistry.get
        .mockReturnValueOnce(logger1)
        .mockReturnValueOnce(logger2);

      mockRegistry.update.mockResolvedValue(undefined);

      const mockResponse = { status: 200 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await putServerLoggersBatchHandler(mockRequest as any);

      expect(mockRegistry.get).toHaveBeenCalledTimes(2);
      expect(mockRegistry.update).toHaveBeenCalledTimes(2);
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          totalProcessed: 2,
          successCount: 2,
          failureCount: 0,
        }),
        { status: 200 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle partial failures in batch update', async () => {
      const batchData = [
        {
          name: 'logger1',
          level: 'error' as const,
        },
        {
          name: 'non-existent',
          level: 'debug' as const,
        },
      ];

      const logger1 = new Logger('logger1', 'service', 'info', true, true, false);

      const mockRequest = {
        json: vi.fn().mockResolvedValue(batchData),
      };

      mockRegistry.get
        .mockReturnValueOnce(logger1)
        .mockReturnValueOnce(undefined);

      mockRegistry.update.mockResolvedValue(undefined);

      const mockResponse = { status: 207 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await putServerLoggersBatchHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          totalProcessed: 2,
          successCount: 1,
          failureCount: 1,
          errors: expect.any(Array),
        }),
        { status: 207 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should validate that request body is an array', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ not: 'an-array' }),
      };

      const mockResponse = { status: 400 };
      (NextResponse.json as Mock).mockReturnValue(mockResponse);

      const result = await putServerLoggersBatchHandler(mockRequest as any);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Request body must be an array of logger configurations" },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('validateLoggerUpdate', () => {
    it('should validate valid logger update data', () => {
      const validData = {
        name: 'test-logger',
        level: 'debug' as const,
        type: 'service' as const,
        errorVerbose: true,
        enabled: false,
      };

      const result = validateLoggerUpdate(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid name', () => {
      const invalidData = {
        name: '',
        level: 'debug' as const,
      };

      const result = validateLoggerUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid logger 'name'");
    });

    it('should reject invalid level', () => {
      const invalidData = {
        name: 'test-logger',
        level: 'invalid-level' as any,
      };

      const result = validateLoggerUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid 'level'");
    });

    it('should reject invalid type', () => {
      const invalidData = {
        name: 'test-logger',
        type: 'invalid-type' as any,
      };

      const result = validateLoggerUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("'type' must be one of");
    });

    it('should reject invalid errorVerbose', () => {
      const invalidData = {
        name: 'test-logger',
        errorVerbose: 'not-boolean' as any,
      };

      const result = validateLoggerUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("'errorVerbose' must be a boolean");
    });

    it('should reject invalid enabled', () => {
      const invalidData = {
        name: 'test-logger',
        enabled: 'not-boolean' as any,
      };

      const result = validateLoggerUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("'enabled' must be a boolean");
    });
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../src/logger';

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Reset module global level before each test
    Logger.setModuleGlobalLevel(null);
    
    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger Creation', () => {
    it('should create logger with default values', () => {
      const logger = new Logger('test-logger', 'unknown', 'info', false, true, false);
      expect(logger.name).toBe('test-logger');
      expect(logger.type).toBe('unknown');
      expect(logger.level).toBe('info');
      expect(logger.errorVerbose).toBe(false);
    });

    it('should create logger with custom values', () => {
      const logger = new Logger('custom-logger', 'service', 'warn', true, true, false);
      expect(logger.name).toBe('custom-logger');
      expect(logger.type).toBe('service');
      expect(logger.level).toBe('warn');
      expect(logger.errorVerbose).toBe(true);
    });
  });

  describe('All Log Levels', () => {
    it('should log all levels when logger is set to trace', async () => {
      const logger = new Logger('trace-logger', 'component', 'trace', false, true, false);

      await logger.fatal('Fatal message');
      await logger.error('Error message');
      await logger.warn('Warn message');
      await logger.success('Success message');
      await logger.info('Info message');
      await logger.start('Start message');
      await logger.debug('Debug message');
      await logger.trace('Trace message');

      // Check that appropriate console methods were called
      expect(consoleSpy.error).toHaveBeenCalledTimes(2); // fatal + error
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);  // warn
      expect(consoleSpy.log).toHaveBeenCalledTimes(5);   // success, info, start, debug, trace
    });

    it('should respect log level filtering', async () => {
      const logger = new Logger('warn-logger', 'component', 'warn', false, true, false);

      await logger.debug('Debug message');  // Should not log
      await logger.info('Info message');    // Should not log
      await logger.warn('Warn message');    // Should log
      await logger.error('Error message');  // Should log

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Formatting', () => {
    it('should format messages with logger name and level', async () => {
      const logger = new Logger('test-component', 'component', 'info', false, true, false);
      
      await logger.info('Test message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/INFO.*\[test-component\].*Test message/)
      );
    });

    it('should include data when provided', async () => {
      const logger = new Logger('data-logger', 'component', 'info', false, true, false);
      const testData = { key: 'value' };
      
      await logger.info('Message with data', testData);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        testData
      );
    });
  });

  describe('Console Method Selection', () => {
    it('should use correct console methods for each level', async () => {
      const logger = new Logger('console-logger', 'component', 'trace', false, true, false);

      // Test error console methods
      await logger.fatal('Fatal');
      await logger.error('Error');
      expect(consoleSpy.error).toHaveBeenCalledTimes(2);

      // Test warn console method
      await logger.warn('Warning');
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);

      // Test log console method  
      await logger.info('Info');
      await logger.debug('Debug');
      await logger.success('Success');
      await logger.start('Start');
      await logger.trace('Trace');
      expect(consoleSpy.log).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Verbose Mode', () => {
    it('should include error object when errorVerbose is true', async () => {
      const logger = new Logger('verbose-logger', 'component', 'error', true, true, false);
      const testError = new Error('Test error');
      const testData = { context: 'test' };
      
      await logger.error('Error occurred', testData, testError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        testError,
        testData
      );
    });

    it('should not include error object when errorVerbose is false', async () => {
      const logger = new Logger('non-verbose-logger', 'component', 'error', false, true, false);
      const testError = new Error('Test error');
      const testData = { context: 'test' };
      
      await logger.error('Error occurred', testData, testError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        testData
      );
    });
  });

  describe('Module Global Level', () => {
    it('should override instance level with module global level', async () => {
      const logger = new Logger('global-test', 'component', 'debug', false, true, false);
      
      // Set global level to error
      Logger.setModuleGlobalLevel('error');
      
      await logger.debug('Debug message');  // Should not log
      await logger.info('Info message');    // Should not log
      await logger.warn('Warn message');    // Should not log
      await logger.error('Error message');  // Should log
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should manage global level state', () => {
      expect(Logger.getModuleGlobalLevel()).toBeNull();
      
      Logger.setModuleGlobalLevel('warn');
      expect(Logger.getModuleGlobalLevel()).toBe('warn');
      
      Logger.setModuleGlobalLevel(null);
      expect(Logger.getModuleGlobalLevel()).toBeNull();
    });
  });

  describe('Trace Level Special Behavior', () => {
    it('should include caller information for trace level', async () => {
      const logger = new Logger('trace-logger', 'component', 'trace', false, true, false);
      
      await logger.trace('Trace with caller info');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/TRACE.*<--/)
      );
    });
  });
});
// @core-mfg/nextjs-logging/handlers.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidLogLevel, LOG_LEVELS, LogConfigEntry, VALID_LOG_TYPES } from '../levels';
import { registry } from '../registry/serverRegistry';
import { Logger } from '../logger';

const log = new Logger("LoggingRoutes", "api", Logger.getPackageGlobalLevel(), true, Logger.getPackageGlobalLogEnabled(), false);

/**
 * GET /api/logging - Retrieves all loggers from the server registry
 *
 * @param req - The NextRequest object (no body required for GET)
 * @returns Promise<NextResponse> - Response containing all logger configurations
 *
 * Request: No body required
 *
 * Response (200):
 * {
 *   "loggingConfig": [
 *     {
 *       "name": "string",
 *       "level": "debug" | "info" | "warn" | "error" | "fatal" | "success" | "trace" | "start",
 *       "type": "service" | "component" | "hook" | "class" | "api" | "package" | "store" | "provider" | "unknown",
 *       "errorVerbose": boolean,
 *       "enabled": boolean
 *     }
 *   ]
 * }
 *
 * Error Response (500):
 * {
 *   "error": "Failed to fetch loggers"
 * }
 *
 * @example
 * GET /api/logging
 * Response: { "loggingConfig": [...] }
 */
export async function getServerLoggersHandler(req: NextRequest) {
  try {
    log.start("Getting loggers from server registry");
    const loggers = registry.list();
    log.debug("Loggers", loggers);
    log.info("Count of loggers", Object.values(loggers).length);
    const res = NextResponse.json({
      loggingConfig: Object.values(loggers).map(
        (logger) => (logger as Logger).toJSON()
      ),
    });
    log.success("Loggers fetched", res.status);
    log.debug("Response", res);
    return res;
  } catch (error) {
    log.error("Failed to fetch loggers", error);
    return NextResponse.json({ error: "Failed to fetch loggers" }, { status: 500 });
  }
}

/**
 * POST /api/logging - Creates a new logger in the server registry
 *
 * @param req - The NextRequest object containing logger configuration
 * @returns Promise<NextResponse> - Response containing the created logger configuration
 *
 * Request Body (required):
 * {
 *   "name": "string",           // Required: Unique identifier for the logger
 *   "level": "debug" | "info" | "warn" | "error" | "fatal" | "success" | "trace" | "start", // Required: Log level
 *   "type": "service" | "component" | "hook" | "class" | "api" | "package" | "store" | "provider" | "unknown", // Required: Logger type
 *   "errorVerbose": boolean,    // Required: Whether to include verbose error details
 *   "enabled": boolean         // Required: Whether the logger is enabled
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "config": {
 *     "name": "string",
 *     "level": "debug" | "info" | "warn" | "error" | "fatal" | "success" | "trace" | "start",
 *     "type": "service" | "component" | "hook" | "class" | "api" | "package" | "store" | "provider" | "unknown",
 *     "errorVerbose": boolean,
 *     "enabled": boolean
 *   }
 * }
 *
 * Error Response (400):
 * {
 *   "error": "Invalid 'name'" |
 *           "Invalid 'level': must be one of debug, info, warn, error, fatal, success, trace, start" |
 *           "'type' must be one of service, component, hook, class, api, package, store, provider, unknown" |
 *           "'errorVerbose' must be a boolean"
 * }
 *
 * Error Response (500):
 * {
 *   "error": "Failed to update logging config"
 * }
 *
 * @example
 * POST /api/logging
 * Body: {
 *   "name": "user-service",
 *   "level": "debug",
 *   "type": "service",
 *   "errorVerbose": true,
 *   "enabled": true
 * }
 *
 * Response: {
 *   "success": true,
 *   "config": {
 *     "name": "user-service",
 *     "level": "debug",
 *     "type": "service",
 *     "errorVerbose": true,
 *     "enabled": true
 *   }
 * }
 */
export async function postServerLoggerHandler(req: NextRequest) {
  try {
    log.start("Creating new logger");
    const body = await req.json();
    const logConfigEntry: LogConfigEntry = body;
    const { name, level, type, errorVerbose, enabled } = logConfigEntry;

    if (typeof name !== 'string' || !name.trim()) {
      log.error("Invalid 'name'", name);
      return NextResponse.json({ error: "Invalid 'name'" }, { status: 400 });
    }

    if (!level || !isValidLogLevel(level)) {
      log.error("Invalid 'level'", level);
      return NextResponse.json({
        error: `Invalid 'level': must be one of ${Object.keys(LOG_LEVELS).join(', ')}`
      }, { status: 400 });
    }

    if (!VALID_LOG_TYPES.includes(type)) {
      log.error("Invalid 'type'", type);
      return NextResponse.json({ error: `'type' must be one of ${VALID_LOG_TYPES.join(', ')}` }, { status: 400 });
    }

    if (typeof errorVerbose !== 'boolean') {
      log.error("Invalid 'errorVerbose'", errorVerbose);
      return NextResponse.json({ error: "'errorVerbose' must be a boolean" }, { status: 400 });
    }

    const newLogger = Logger.fromJSON({ name, level, type, errorVerbose, enabled }, false);
    await registry.register(newLogger);

    const res = NextResponse.json({ success: true, config: newLogger.toJSON() });
    log.success("Logger created", res.status);
    log.debug("Response", res);
    return res;
  } catch (error) {
    log.error("Failed to create logger", error);
    return NextResponse.json({ error: "Failed to update logging config" }, { status: 500 });
  }
}

/**
 * Validates a partial logger configuration for update operations
 *
 * @param logConfigEntry - Partial logger configuration to validate
 * @returns Object indicating if validation passed and any error message
 *
 * Validation Rules:
 * - name: Required, must be a non-empty string
 * - level: Optional, must be one of: debug, info, warn, error, fatal, success, trace, start
 * - type: Optional, must be one of: service, component, hook, class, api, package, store, provider, unknown
 * - errorVerbose: Optional, must be a boolean
 * - enabled: Optional, must be a boolean
 *
 * @example
 * const result = validateLoggerUpdate({
 *   name: "user-service",
 *   level: "debug",
 *   errorVerbose: true
 * });
 * // Returns: { isValid: true }
 *
 * const invalidResult = validateLoggerUpdate({
 *   name: "",
 *   level: "invalid-level"
 * });
 * // Returns: { isValid: false, error: "Invalid logger 'name'" }
 */
export function validateLoggerUpdate(logConfigEntry: Partial<LogConfigEntry>): { isValid: boolean; error?: string } {
  const { name, level, type, errorVerbose, enabled } = logConfigEntry;

  if (typeof name !== 'string' || !name.trim()) {
    return { isValid: false, error: "Invalid logger 'name'" };
  }

  if (level !== undefined && !isValidLogLevel(level)) {
    return { 
      isValid: false, 
      error: `Invalid 'level': must be one of ${Object.keys(LOG_LEVELS).join(', ')}` 
    };
  }

  if (type !== undefined && !VALID_LOG_TYPES.includes(type)) {
    return { isValid: false, error: `'type' must be one of ${VALID_LOG_TYPES.join(', ')}` };
  }

  if (errorVerbose !== undefined && typeof errorVerbose !== 'boolean') {
    return { isValid: false, error: "'errorVerbose' must be a boolean" };
  }

  if (enabled !== undefined && typeof enabled !== 'boolean') {
    return { isValid: false, error: "'enabled' must be a boolean" };
  }

  return { isValid: true };
}

/**
 * PUT /api/logging - Updates an existing logger in the server registry
 *
 * @param req - The NextRequest object containing partial logger configuration
 * @returns Promise<NextResponse> - Response containing the updated logger configuration
 *
 * Request Body (required):
 * {
 *   "name": "string",           // Required: Name of the logger to update (must exist)
 *   "level": "debug" | "info" | "warn" | "error" | "fatal" | "success" | "trace" | "start", // Optional: New log level
 *   "errorVerbose": boolean,    // Optional: Whether to include verbose error details
 *   "enabled": boolean         // Optional: Whether the logger is enabled
 *   // Note: 'type' field is not supported for updates
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "config": {
 *     "name": "string",
 *     "level": "debug" | "info" | "warn" | "error" | "fatal" | "success" | "trace" | "start",
 *     "type": "service" | "component" | "hook" | "class" | "api" | "package" | "store" | "provider" | "unknown",
 *     "errorVerbose": boolean,
 *     "enabled": boolean
 *   }
 * }
 *
 * Error Response (400):
 * {
 *   "error": "Invalid logger 'name'" |
 *           "Invalid 'level': must be one of debug, info, warn, error, fatal, success, trace, start" |
 *           "'type' must be one of service, component, hook, class, api, package, store, provider, unknown" |
 *           "'errorVerbose' must be a boolean" |
 *           "'enabled' must be a boolean"
 * }
 *
 * Error Response (404):
 * {
 *   "error": "Logger 'logger-name' not found in registry"
 * }
 *
 * Error Response (500):
 * {
 *   "error": "Failed to update logging config"
 * }
 *
 * @example
 * PUT /api/logging
 * Body: {
 *   "name": "user-service",
 *   "level": "error",
 *   "errorVerbose": false,
 *   "enabled": false
 * }
 *
 * Response: {
 *   "success": true,
 *   "config": {
 *     "name": "user-service",
 *     "level": "error",
 *     "type": "service",
 *     "errorVerbose": false,
 *     "enabled": false
 *   }
 * }
 */
export async function putServerLoggerHandler(req: NextRequest) {
  try {
    log.start("Updating logger");
    const body = await req.json();
    const logConfigEntry: Partial<LogConfigEntry> = body;
    const { name } = logConfigEntry;

    // Validate input
    const validation = validateLoggerUpdate(logConfigEntry);
    if (!validation.isValid) {
      log.error("Validation failed", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if logger exists
    const existingLogger = registry.get(name!);
    if (!existingLogger) {
      log.error("Logger not found", name);
      return NextResponse.json({ error: `Logger '${name}' not found in registry` }, { status: 404 });
    }

    // Update logger properties
    if (logConfigEntry.level !== undefined) existingLogger.level = logConfigEntry.level;
    if (logConfigEntry.errorVerbose !== undefined) existingLogger.errorVerbose = logConfigEntry.errorVerbose;
    if (logConfigEntry.enabled !== undefined) existingLogger.enabled = logConfigEntry.enabled;
    // Note: type is commented out in original code, keeping that behavior

    await registry.update(existingLogger);

    const res = NextResponse.json({ success: true, config: existingLogger.toJSON() });
    log.success("Logger updated", res.status);
    log.debug("Response", res);
    return res;

  } catch (error) {
    log.error("Failed to update logging config", error);
    return NextResponse.json({ error: "Failed to update logging config" }, { status: 500 });
  }
}

/**
 * PUT /api/logging/batch - Batch updates multiple loggers in the server registry
 *
 * @param req - The NextRequest object containing an array of logger configurations
 * @returns Promise<NextResponse> - Response containing batch update results
 *
 * Request Body (required): Array of logger configurations
 * - name: string (Required) - Name of the logger to update (must exist)
 * - level: LogLevel (Optional) - New log level (debug, info, warn, error, fatal, success, trace, start)
 * - errorVerbose: boolean (Optional) - Whether to include verbose error details
 * - enabled: boolean (Optional) - Whether the logger is enabled
 * - Note: 'type' field is not supported for updates
 *
 * Response (200 - All successful):
 * {
 *   "success": true,
 *   "totalProcessed": number,
 *   "successCount": number,
 *   "failureCount": 0,
 *   "results": [
 *     {
 *       "name": string,
 *       "success": true,
 *       "config": LoggerConfig
 *     }
 *   ]
 * }
 *
 * Response (207 - Partial success):
 * {
 *   "success": false,
 *   "totalProcessed": number,
 *   "successCount": number,
 *   "failureCount": number,
 *   "results": [BatchResultItem],
 *   "errors": string[]
 * }
 *
 * Error Response (400):
 * {"error": "Request body must be an array of logger configurations"}
 *
 * Error Response (500):
 * {"error": "Failed to process batch logger update", "details": string}
 *
 * @example
 * // Request body example:
 * [
 *   {"name": "user-service", "level": "error", "errorVerbose": false},
 *   {"name": "auth-service", "level": "debug", "enabled": false},
 *   {"name": "non-existent-service", "level": "info"}
 * ]
 *
 * // Response example (partial success):
 * {
 *   "success": false,
 *   "totalProcessed": 3,
 *   "successCount": 2,
 *   "failureCount": 1,
 *   "results": [
 *     {"name": "user-service", "success": true, "config": {...}},
 *     {"name": "auth-service", "success": true, "config": {...}},
 *     {"name": "non-existent-service", "success": false, "error": "Logger not found"}
 *   ],
 *   "errors": ["Entry 2: Logger 'non-existent-service' not found in registry"]
 * }
 */
export async function putServerLoggersBatchHandler(req: NextRequest) {
  try {
    log.start("Batch updating loggers");
    const body = await req.json();
    
    // Validate input is an array
    if (!Array.isArray(body)) {
      log.error("Invalid input: expected array", typeof body);
      return NextResponse.json({ error: "Request body must be an array of logger configurations" }, { status: 400 });
    }

    const logConfigEntries: Partial<LogConfigEntry>[] = body;
    const results: Array<{ name: string; success: boolean; error?: string; config?: any }> = [];
    const errors: string[] = [];

    log.info("Processing batch update", `${logConfigEntries.length} loggers`);

    // Process each logger update
    for (let i = 0; i < logConfigEntries.length; i++) {
      const logConfigEntry = logConfigEntries[i];
      if (!logConfigEntry) {
        results.push({ name: `entry-${i}`, success: false, error: "Invalid entry: null or undefined" });
        errors.push(`Entry ${i}: Invalid entry`);
        continue;
      }
      const { name } = logConfigEntry;

      try {
        // Validate individual entry
        const validation = validateLoggerUpdate(logConfigEntry);
        if (!validation.isValid) {
          const error = `Entry ${i}: ${validation.error}`;
          log.error("Validation failed for entry", error);
          results.push({ name: name || `entry-${i}`, success: false, error: validation.error! });
          errors.push(error);
          continue;
        }

        // Check if logger exists
        const existingLogger = registry.get(name!);
        if (!existingLogger) {
          const error = `Logger '${name}' not found in registry`;
          log.error("Logger not found", name);
          results.push({ name: name!, success: false, error });
          errors.push(`Entry ${i}: ${error}`);
          continue;
        }

        // Update logger properties
        if (logConfigEntry.level !== undefined) existingLogger.level = logConfigEntry.level;
        if (logConfigEntry.errorVerbose !== undefined) existingLogger.errorVerbose = logConfigEntry.errorVerbose;
        if (logConfigEntry.enabled !== undefined) existingLogger.enabled = logConfigEntry.enabled;
        // Note: type is commented out in original code, keeping that behavior

        await registry.update(existingLogger);

        results.push({ 
          name: name!, 
          success: true, 
          config: existingLogger.toJSON() 
        });
        
        log.debug("Logger updated successfully", name);

      } catch (error) {
        const errorMsg = `Failed to update logger '${name}': ${error}`;
        log.error("Individual logger update failed", errorMsg);
        results.push({ name: name || `entry-${i}`, success: false, error: errorMsg });
        errors.push(`Entry ${i}: ${errorMsg}`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    log.info("Batch update completed", `${successCount} successful, ${failureCount} failed`);

    const response = {
      success: errors.length === 0,
      totalProcessed: logConfigEntries.length,
      successCount,
      failureCount,
      results,
      ...(errors.length > 0 && { errors })
    };

    const statusCode = errors.length === 0 ? 200 : (successCount > 0 ? 207 : 400); // 207 = Multi-Status
    const res = NextResponse.json(response, { status: statusCode });
    
    if (errors.length === 0) {
      log.success("Batch update completed successfully", res.status);
    } else {
      log.warn("Batch update completed with errors", `${errors.length} errors`);
    }
    
    log.debug("Batch response", res);
    return res;

  } catch (error) {
    log.error("Failed to process batch logger update", error);
    return NextResponse.json({ 
      error: "Failed to process batch logger update",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
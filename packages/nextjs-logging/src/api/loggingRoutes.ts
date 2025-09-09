// @core-mfg/nextjs-logging/handlers.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidLogLevel, LOG_LEVELS, LogConfigEntry, VALID_LOG_TYPES } from '../levels';
import { registry } from '../registry/serverRegistry';
import { Logger } from '../logger';

const log = new Logger("LoggingRoutes", "api", Logger.getPackageGlobalLevel(), true, Logger.getPackageGlobalLogEnabled(), false);

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

// Validation helper function for single logger update (follows SRP)
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
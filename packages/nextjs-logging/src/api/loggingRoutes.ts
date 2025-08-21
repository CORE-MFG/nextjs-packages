// @core-mfg/nextjs-logging/handlers.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidLogLevel, LOG_LEVELS, LogConfigEntry, VALID_LOG_TYPES } from '../levels';
import { registry } from '../registry/serverRegistry';
import { Logger } from '../logger';

const log = new Logger("LoggingRoutes", "api", Logger.getPackageGlobalLevel(), true, true);

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

    const newLogger = Logger.fromJSON({ name, level, type, errorVerbose, enabled });
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

export async function putServerLoggerHandler(req: NextRequest) {
  try {
    log.start("Updating logger");
    const body = await req.json();
    const logConfigEntry: Partial<LogConfigEntry> = body;
    const { name, level, type, errorVerbose, enabled } = logConfigEntry;

    if (typeof name !== 'string' || !name.trim()) {
      log.error("Invalid 'name'", name);
      return NextResponse.json({ error: "Invalid logger 'name'" }, { status: 400 });
    }

    const existingLogger = registry.get(name);
    if (!existingLogger) {
      log.error("Logger not found", name);
      return NextResponse.json({ error: `Logger '${name}' not found in registry` }, { status: 404 });
    }

    if (!level || !isValidLogLevel(level)) {
      log.error("Invalid 'level'", level);
      return NextResponse.json({ 
        error: `Invalid 'level': must be one of ${Object.keys(LOG_LEVELS).join(', ')}` 
      }, { status: 400 });
    }

    if (type && !VALID_LOG_TYPES.includes(type)) {
      log.error("Invalid 'type'", type);
      return NextResponse.json({ error: `'type' must be one of ${VALID_LOG_TYPES.join(', ')}` }, { status: 400 });
    }

    if (typeof errorVerbose !== 'boolean') {
      log.error("Invalid 'errorVerbose'", errorVerbose);
      return NextResponse.json({ error: "'errorVerbose' must be a boolean" }, { status: 400 });
    }

    if (typeof enabled !== 'boolean') {
      log.error("Invalid 'enabled'", enabled);
      return NextResponse.json({ error: "'enabled' must be a boolean" }, { status: 400 });
    }

    existingLogger.level = level || existingLogger.level;
    // existingLogger.type = type || existingLogger.type;
    existingLogger.errorVerbose = errorVerbose || existingLogger.errorVerbose;
    existingLogger.enabled = enabled || existingLogger.enabled;

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
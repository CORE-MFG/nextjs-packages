// @core-mfg/nextjs-logging/handlers.ts
import { NextRequest, NextResponse } from 'next/server';
import { createLoggingConfig } from '../config';
import { isValidLogLevel, LOG_LEVELS, LogConfigEntry, VALID_LOG_TYPES } from '../levels';
import { registry } from '../registry/serverRegistry';
import { Logger } from '../logger';

export async function getServerLoggersHandler(req: NextRequest) {
  try {
    const loggers = registry.list();
    if (!loggers) {
      return NextResponse.json({ loggingConfig: [] });
    }
    return NextResponse.json({ loggingConfig: Object.values(loggers).map((logger: Logger) => logger.toJSON()) });
  } catch (error) {
    console.error('Failed to get logging config:', error);
    return NextResponse.json({ error: 'Failed to get logging config' }, { status: 500 });
  }
}

export async function postServerLoggerHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const logConfigEntry: LogConfigEntry = body;
    const { name, level, type, errorVerbose, enabled } = logConfigEntry;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: "Invalid 'name'" }, { status: 400 });
    }

    if (!level || !isValidLogLevel(level)) {
      return NextResponse.json({ 
        error: `Invalid 'level': must be one of ${Object.keys(LOG_LEVELS).join(', ')}` 
      }, { status: 400 });
    }

    if (!VALID_LOG_TYPES.includes(type)) {
      return NextResponse.json({ error: `'type' must be one of ${VALID_LOG_TYPES.join(', ')}` }, { status: 400 });
    }

    if (typeof errorVerbose !== 'boolean') {
      return NextResponse.json({ error: "'errorVerbose' must be a boolean" }, { status: 400 });
    }

    const newLogger = Logger.fromJSON({ name, level, type, errorVerbose, enabled });
    await registry.register(newLogger);

    return NextResponse.json({ success: true, config: newLogger.toJSON() });
  } catch (error) {
    console.error('Failed to update logging config:', error);
    return NextResponse.json({ error: "Failed to update logging config" }, { status: 500 });
  }
}

export async function putServerLoggerHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const logConfigEntry: Partial<LogConfigEntry> = body;
    const { name, level, type, errorVerbose, enabled } = logConfigEntry;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: "Invalid logger 'name'" }, { status: 400 });
    }

    const existingLogger = registry.get(name);
    if (!existingLogger) {
      return NextResponse.json({ error: `Logger '${name}' not found in registry` }, { status: 404 });
    }

    if (!level || !isValidLogLevel(level)) {
      return NextResponse.json({ 
        error: `Invalid 'level': must be one of ${Object.keys(LOG_LEVELS).join(', ')}` 
      }, { status: 400 });
    }

    if (type && !VALID_LOG_TYPES.includes(type)) {
      return NextResponse.json({ error: `'type' must be one of ${VALID_LOG_TYPES.join(', ')}` }, { status: 400 });
    }

    if (typeof errorVerbose !== 'boolean') {
      return NextResponse.json({ error: "'errorVerbose' must be a boolean" }, { status: 400 });
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: "'enabled' must be a boolean" }, { status: 400 });
    }

    existingLogger.level = level || existingLogger.level;
    // existingLogger.type = type || existingLogger.type;
    existingLogger.errorVerbose = errorVerbose || existingLogger.errorVerbose;
    existingLogger.enabled = enabled || existingLogger.enabled;

    await registry.update(existingLogger);

    return NextResponse.json({ success: true, config: existingLogger.toJSON() });

  } catch (error) {
    console.error('Failed to update logging config:', error);
    return NextResponse.json({ error: "Failed to update logging config" }, { status: 500 });
  }
}
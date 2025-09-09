export type LogType = "service" | "component" | "hook" | "class" | "api" | "package" | "store" | "provider" | "unknown";

export const VALID_LOG_TYPES: LogType[] = ["service", "component", "hook", "class", "api", "package", "store", "provider", "unknown"];

export type LogConfigEntry = {
  name: string;
  level: LogLevel;
  type: LogType;
  errorVerbose: boolean;
  enabled: boolean;
}

export type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"
  | "success"
  | "trace"
  | "start";

// export interface LogConfig {
//   [name: string]: Omit<LogConfigEntry, "name">;
// }
export type LogConfig = LogConfigEntry[];

export const LOG_LEVELS: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  success: 3,
  info: 4,
  start: 4,
  debug: 5,
  trace: 6,
};

export function isValidLogLevel(level: unknown): level is LogLevel {
  return typeof level === "string" && level in LOG_LEVELS;
}

export const COLORS = {
  red: "#ef4444",    // Tailwind red-500
  green: "#22c55e",  // Tailwind green-500
  yellow: "#eab308", // Tailwind yellow-500
  cyan: "#06b6d4",   // Tailwind cyan-500
  magenta: "#d946ef",// Tailwind pink/purple-ish
  blue: "#3b82f6",   // Tailwind blue-500
  orange: "#f97316", // Tailwind orange-500 (new for "start")
};

// ANSI colors for manual console fallback
export const COLORS_ANSI = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  orange: "\x1b[33;1m", // bright yellow/orange ANSI approximation
};

// Map log levels to colors
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  fatal: COLORS.red,
  error: COLORS.red,
  warn: COLORS.yellow,
  success: COLORS.green,
  info: COLORS.cyan,
  start: COLORS.orange, // new color
  debug: COLORS.blue,
  trace: COLORS.magenta,
};

// Map log levels to ANSI colors
export const LOG_LEVEL_COLORS_ANSI: Record<LogLevel, string> = {
  fatal: COLORS_ANSI.red,
  error: COLORS_ANSI.red,
  warn: COLORS_ANSI.yellow,
  success: COLORS_ANSI.green,
  info: COLORS_ANSI.cyan,
  start: COLORS_ANSI.orange, // new color
  debug: COLORS_ANSI.blue,
  trace: COLORS_ANSI.magenta,
};

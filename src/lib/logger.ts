type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, data: Record<string, unknown> | string) {
  const entry = {
    level,
    time: new Date().toISOString(),
    ...(typeof data === "string" ? { msg: data } : data),
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (data: Record<string, unknown> | string) => log("debug", data),
  info: (data: Record<string, unknown> | string) => log("info", data),
  warn: (data: Record<string, unknown> | string) => log("warn", data),
  error: (data: Record<string, unknown> | string) => log("error", data),
};

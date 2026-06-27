type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class Logger {
  private context: string;
  private isDev: boolean;

  constructor(context: string) {
    this.context = context;
    this.isDev = process.env.NODE_ENV === "development";
  }

  private formatEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry = this.formatEntry(level, message, data);

    if (!this.isDev && level === "debug") return;

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.context}]`;

    switch (level) {
      case "debug":
        console.debug(prefix, message, data ?? "");
        break;
      case "info":
        console.info(prefix, message, data ?? "");
        break;
      case "warn":
        console.warn(prefix, message, data ?? "");
        break;
      case "error":
        console.error(prefix, message, data ?? "");
        // Placeholder: Send to error tracking service (e.g., Sentry)
        // errorTracker.captureException(data instanceof Error ? data : new Error(message));
        break;
    }
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown) {
    this.log("error", message, data);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export const logger = createLogger("EduFundX");

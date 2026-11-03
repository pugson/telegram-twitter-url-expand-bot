import { configure, getConsoleSink, getLogger, getTextFormatter, isLogLevel } from "@logtape/logtape";

/**
 * Hide the bot token in text that leaves the process. Network errors from
 * grammY quote the request URL, which is api.telegram.org/bot<token>/...
 */
export function redactToken(text: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return token ? text.replaceAll(token, "<redacted>") : text;
}

/**
 * Log errors as their stack trace instead of inspecting the whole object.
 * Axios and grammY errors carry request configs, headers and message payloads,
 * which are huge and can contain secrets or user content.
 */
function formatError(error: Error): string {
  let text = error.stack ?? `${error.name}: ${error.message}`;
  // grammY wraps the underlying error in BotError/HttpError's `error` property
  const { error: wrapped, cause } = error as { error?: unknown; cause?: unknown };
  const inner = wrapped ?? cause;
  if (inner instanceof Error) text += `\nCaused by: ${inner.stack ?? inner.message}`;
  return text;
}

export async function setupLogger() {
  // LogTape calls this level "warning", so accept the common "warn" spelling too
  const level = process.env.LOG_LEVEL === "warn" ? "warning" : process.env.LOG_LEVEL;

  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: getTextFormatter({
          timestamp: "time",
          value: (value, inspect) => redactToken(value instanceof Error ? formatError(value) : inspect(value)),
        }),
      }),
    },
    loggers: [
      {
        category: ["bot"],
        lowestLevel: level && isLogLevel(level) ? level : process.env.DEV ? "debug" : "info",
        sinks: ["console"],
      },
    ],
  });
}

export const logger = getLogger(["bot"]);

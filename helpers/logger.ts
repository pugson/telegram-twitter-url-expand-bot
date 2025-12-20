import { configure, getConsoleSink, getLogger } from "@logtape/logtape";

export async function setupLogger() {
  await configure({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      {
        category: ["bot"],
        lowestLevel: "debug",
        sinks: ["console"],
      },
    ],
  });
}

export const logger = getLogger(["bot"]);

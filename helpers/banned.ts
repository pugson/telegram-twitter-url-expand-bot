import axios from "axios";
import { notifyAdmin } from "./notifier";
import * as dotenv from "dotenv";
dotenv.config();

// List of malicious chats that were trying to crash the bot.
const banList: number[] = [
  1947938299, -1001226058268, -1002124315683, -1001149568794, -1001493829609, 6908519864, -1001859238543,
  -1001709570096, -1002092544541, -1001998434278, -1001270461188, -1002120182372, 132539597, 5153608517, -1001142717501,
  -1001895119273, 6414405787, 2003350723, 829781933, 6164550093, -1001973927780, -1001863770641, -1002061175932,
  1606851084, -1002091775588, -1001930094542, -1001857512657, -1002045266906, -1001538336813,6650455873,5870000919,1612412747,
  -1001288121000,-1002030679797,-1001793155472,1305106216,-1001198539389,-1001660176192
];

export const isBanned = (chatId: number) => banList.includes(Number(chatId));

export async function triggerWorkflow(chatId: number) {
  const owner = "pugson";
  const repo = "telegram-twitter-url-expand-bot";
  const workflowId = "ban.yml";
  const githubToken = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        ref: "main",
        inputs: {
          chatId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    notifyAdmin("Workflow dispatched successfully.");
  } catch (error) {
    notifyAdmin("Error dispatching workflow");
    // @ts-ignore
    console.error("Error dispatching workflow:", error.response?.data || error.message);
  }
}

import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "link-expander";
export default defineRailway(() => {
  const LinkExpander = service("Link Expander", {
    source: github("pugson/telegram-twitter-url-expand-bot", { branch: "main", checkSuites: false }),
    build: { builder: "RAILPACK" },
    start: "yarn start",
    replicas: { "us-west2": 1 },
    deploy: {
      restartPolicyType: "ALWAYS",
      // On redeploy the old instance gets SIGTERM and finishes the updates it
      // already took from Telegram (see stop() in index.ts) before SIGKILL
      drainingSeconds: 10,
    },
    networking: { privateNetworkEndpoint: "link-expander" },
  });

  return project("telegram-bots", {
    variables: { managed: false },
    resources: [LinkExpander],
  });
});

declare namespace NodeJS {
  interface ProcessEnv {
    ADMIN_TELEGRAM_ID: string;
    ANALYTICS_ENDPOINT?: string;
    ANALYTICS_KEY?: string;
    DEV?: boolean;
    TELEGRAM_BOT_TOKEN: string;
    XATA_API_KEY: string;
    XATA_BRANCH: string;
  }
}

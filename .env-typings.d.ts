declare namespace NodeJS {
  interface ProcessEnv {
    API_URL: string;
    API_TOKEN: string;
    TELEGRAM_BOT_TOKEN: string;
    ADMIN_TELEGRAM_ID: string;
    TWITTER_TOKEN: string;
    XATA_API_KEY?: string;
    XATA_FALLBACK_BRANCH?: string;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    TELEGRAM_BOT_TOKEN: string;
    ADMIN_TELEGRAM_ID: string;
    PASSKEY: string;
    XATA_API_KEY?: string;
    XATA_FALLBACK_BRANCH?: string;
  }
}

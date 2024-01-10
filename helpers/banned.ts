// List of malicious chats that were trying to crash the bot.
const banList: number[] = [1947938299, 1001226058268];

export const isBanned = (chatId: number) => banList.includes(chatId);

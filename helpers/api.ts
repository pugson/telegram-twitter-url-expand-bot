import fetch from "isomorphic-unfetch";
import { Chats, getXataClient } from "./xata";

// @ts-ignore
globalThis.fetch = fetch;

const xata = getXataClient();

/**
 * Get chat settings from the database.
 * @param chatId Telegram Chat ID
 * @returns Chat settings record
 */
export const getSettings = async (chatId: number) => {
  try {
    console.log("Getting settings for chat ID:", chatId);
    const record = await xata.db.chats
      .filter({
        chat_id: chatId.toString(),
      })
      .getFirst({
        // cache: 1 * 60 * 1000, // TTL: 1 minute
      });

    return record;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Create a new chat settings record in the database.
 * @param chatId Telegram Chat ID
 * @param autoexpandValue Autoexpand value boolean
 * @param changelogValue Changelog value boolean
 * @param settingsLockValue Settings lock value boolean
 * @returns Chat settings record
 */
export const createSettings = async (
  chatId: number,
  autoexpandValue: boolean,
  changelogValue: boolean,
  settingsLockValue: boolean
) => {
  try {
    console.log("Creating settings for chat ID:", chatId);
    const record = await xata.db.chats.create({
      chat_id: chatId.toString(),
      autoexpand: autoexpandValue,
      changelog: changelogValue,
      settings_lock: settingsLockValue,
    });

    return record;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Update settings for this chat in the database.
 * @param id Telegram Chat ID
 * @param property Column name
 * @param value New value
 * @returns
 */
export const updateSettings = async (id: number, property: keyof Chats, value: Chats[keyof Chats]) => {
  try {
    console.log("Updating settings for chat ID:", id);
    const record = await xata.db.chats
      .filter({ chat_id: id.toString() })
      .getFirst()
      .then((record) => {
        if (record) {
          record.update({
            [`${property}`]: value,
          });
        }
      });

    return record;
  } catch (error) {
    console.error(error);
  }
};

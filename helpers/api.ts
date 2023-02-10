import fetch from "isomorphic-unfetch";
import { Chats, getXataClient } from "./xata";

// @ts-ignore
globalThis.fetch = fetch;

const xata = getXataClient();

export const getSettings = async (chatId: number) => {
  try {
    const record = await xata.db.chats
      .filter({
        chat_id: chatId.toString(),
      })
      .getFirst();

    return record;
  } catch (error) {
    console.error(error);
  }
};

export const createSettings = async (chatId: number, status: boolean) => {
  try {
    const record = await xata.db.chats.create({
      chat_id: chatId.toString(),
      autoexpand: status,
      release_notes_notification: false,
    });

    return record;
  } catch (error) {
    console.error(error);
  }
};

export const updateSettings = async (id: number, property: keyof Chats, value: Chats[keyof Chats]) => {
  try {
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

export const createEvent = async (name: string, timestamp: string, note?: string) => {
  try {
    const record = await xata.db.events.create({
      name,
      timestamp,
      note,
    });

    return record;
  } catch (error) {
    console.error(error);
  }
};

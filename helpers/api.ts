// Generated with CLI
import { getXataClient } from "./xata";
const xata = getXataClient();

export const getSettings = async (chatId: string) => {
  try {
    const record = await xata.db.chats
      .filter({
        chat_id: chatId,
      })
      .getMany();
    console.log(record);
    return record;
  } catch (error) {
    console.error(error);
  }
};

export const createSettings = async (chatId: string, status: boolean) => {
  try {
    const record = await xata.db.chats.create({
      chat_id: chatId,
      autoexpand: status,
      release_notes_notification: false,
    });
    console.log(record);
    return record;
  } catch (error) {
    console.error(error);
  }
};

export const updateSettings = async (id: string, status: boolean) => {
  try {
    const record = await xata.db.chats.update(id, {
      autoexpand: status,
    });
    console.log(record);
    return record;
  } catch (error) {
    console.error(error);
  }
};

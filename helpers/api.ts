import axios from "axios";

export const API_ENDPOINT = `${process.env.API_URL}?access_token=${process.env.API_TOKEN}`;

export const getSettings = async (chatId: string) => {
  const response = await axios
    .get(API_ENDPOINT, {
      params: {
        filter: {
          chatId: {
            _eq: chatId,
          },
        },
      },
    })
    .then((response) => response)
    .catch((error) => console.error(error.response.data.errors));
  return response?.data?.data[0];
};

export const createSettings = async (chatId: string, status: boolean) => {
  const response = await axios
    .post(API_ENDPOINT, [
      {
        chatId,
        autoexpand: status,
      },
    ])
    .then((response) => response)
    .catch((error) => console.error(error.response.data.errors));

  return response?.data;
};

export const updateSettings = async (id: string, status: boolean) => {
  const response = await axios
    .patch(API_ENDPOINT, {
      keys: [id],
      data: {
        autoexpand: status,
      },
    })
    .then((response) => response)
    .catch((error) => console.error(error.response.data.errors));

  return response?.data;
};

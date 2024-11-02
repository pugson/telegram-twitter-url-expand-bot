import axios from "axios";

export const getOGMetadata = async (link: string) => {
  if (!link) return;

  try {
    const response = await axios.get(`https://og.metadata.vision/${link}`, {
      timeout: 60_000,
    });
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
};

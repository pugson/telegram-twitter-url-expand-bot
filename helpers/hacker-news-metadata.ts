import axios from "axios";

export const getHackerNewsMetadata = async (postId: string | undefined) => {
  if (!postId) return;

  try {
    const response = await axios.get(`https://hn-metadata-api.vercel.app/${postId}`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

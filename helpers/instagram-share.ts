import axios from "axios";

interface MetadataResponse {
  data: {
    url: string;
    [key: string]: any;
  };
}

/**
 * Resolves an Instagram share link to its full URL
 * @param shareUrl Instagram share URL to resolve
 * @returns Resolved Instagram URL with original instagram.com domain
 */
export async function resolveInstagramShare(shareUrl: string): Promise<string | null> {
  try {
    const response = await axios.get<MetadataResponse>(
      `https://og.metadata.vision/${encodeURIComponent(shareUrl)}`
    );

    if (response.data?.data?.url) {
      return response.data.data.url;
    }

    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Error] Failed to resolve Instagram share URL:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: shareUrl
      });
    } else {
      console.error("[Error] Unexpected error resolving Instagram share URL:", error);
    }
    return null;
  }
}

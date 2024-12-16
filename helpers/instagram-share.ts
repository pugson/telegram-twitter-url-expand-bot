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
    console.log("[Debug] Resolving Instagram share URL:", shareUrl);
    
    const metadataUrl = `https://og.metadata.vision/${encodeURIComponent(shareUrl)}`;
    console.log("[Debug] Metadata URL:", metadataUrl);
    
    const response = await axios.get<MetadataResponse>(metadataUrl);
    console.log("[Debug] Metadata response:", JSON.stringify(response.data, null, 2));

    if (response.data?.data?.url) {
      const resolvedUrl = response.data.data.url;
      console.log("[Debug] Resolved URL:", resolvedUrl);
      return resolvedUrl;
    }

    console.log("[Debug] No URL found in metadata response");
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Error] Failed to resolve Instagram share URL:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: shareUrl
      });
    } else {
      console.error("[Error] Unexpected error resolving Instagram share URL:", error);
    }
    return null;
  }
}

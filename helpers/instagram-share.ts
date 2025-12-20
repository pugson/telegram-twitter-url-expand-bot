import axios from "axios";
import { logger } from "./logger";

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
    // Ensure the URL ends with a trailing slash to avoid unnecessary redirects
    // (e.g., "https://www.instagram.com/share/xxx" might redirect to "https://www.instagram.com/share/xxx/").
    const normalizedShareUrl = shareUrl.replace(/\/?$/, '/');

    const response = await axios.get<MetadataResponse>(
      `https://og.metadata.vision/${encodeURIComponent(normalizedShareUrl)}`
    );

    if (response.data?.data?.url) {
      return response.data.data.url;
    }

    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error("Failed to resolve Instagram share URL: {status} {statusText} {url}", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: shareUrl
      });
    } else {
      logger.error("Unexpected error resolving Instagram share URL: {error}", { error });
    }
    return null;
  }
}

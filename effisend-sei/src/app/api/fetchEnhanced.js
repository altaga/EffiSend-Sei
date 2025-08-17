import { fetch } from "expo/fetch";
export async function fetchEnhanced(input, options = {}, retryOptions = {}) {
  const {retries = 3, delay = 1000, backoff = 2} = retryOptions;

  const urls = Array.isArray(input) ? input : [input]; // Normalize input

  for (const url of urls) {
    let attempts = 0;
    let currentDelay = delay;

    while (attempts < retries) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          console.warn(
            `Request to ${url} failed with status ${response.status}. Retry ${
              attempts + 1
            }/${retries}`,
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`✅ Successful response from ${url}`);
        return response; // Return response and stop trying further URLs
      } catch (error) {
        attempts++;
        console.error(
          `❌ Attempt ${attempts} to ${url} failed: ${error.message}`,
        );

        if (attempts < retries) {
          console.log(`🔄 Retrying ${url} in ${currentDelay}ms...`);
          await new Promise(res => setTimeout(res, currentDelay));
          currentDelay *= backoff;
        } else {
          console.log(`⚠️ All retries failed for ${url}. Trying next...`);
        }
      }
    }
  }

  throw new Error(
    `🚫 All URLs failed after retries. Tried: ${urls.join(', ')}`,
  );
}

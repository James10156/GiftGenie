import fetch from 'node-fetch';

interface MetaTag {
  property?: string;
  name?: string;
  content?: string;
}

export async function extractBestProductImage(url: string): Promise<string | null> {
  try {
    console.log(`[IMAGE_EXTRACTOR] Attempting to extract image from: ${url}`);
    
    // Skip search URLs as they don't have specific product images
    if (url.includes('/s?k=') || url.includes('/search')) {
      console.log(`[IMAGE_EXTRACTOR] Skipping search URL: ${url}`);
      return null;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`[IMAGE_EXTRACTOR] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Try Open Graph image first (most reliable for product pages)
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const imageUrl = ogImageMatch[1];
      console.log(`[IMAGE_EXTRACTOR] Found Open Graph image: ${imageUrl}`);
      return imageUrl;
    }

    // Try Twitter Card image
    const twitterImageMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
    if (twitterImageMatch && twitterImageMatch[1]) {
      const imageUrl = twitterImageMatch[1];
      console.log(`[IMAGE_EXTRACTOR] Found Twitter Card image: ${imageUrl}`);
      return imageUrl;
    }

    // Try JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        const image = extractImageFromJsonLd(jsonData);
        if (image) {
          console.log(`[IMAGE_EXTRACTOR] Found JSON-LD image: ${image}`);
          return image;
        }
      } catch (e) {
        // JSON parsing failed, continue to next method
      }
    }

    console.log(`[IMAGE_EXTRACTOR] No suitable image found for: ${url}`);
    return null;

  } catch (error) {
    console.error(`[IMAGE_EXTRACTOR] Error extracting image from ${url}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function extractImageFromJsonLd(data: any): string | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const image = extractImageFromJsonLd(item);
      if (image) return image;
    }
    return null;
  }

  if (typeof data === 'object' && data !== null) {
    // Look for image property
    if (data.image) {
      if (typeof data.image === 'string') {
        return data.image;
      }
      if (Array.isArray(data.image) && data.image.length > 0) {
        return typeof data.image[0] === 'string' ? data.image[0] : data.image[0].url;
      }
      if (typeof data.image === 'object' && data.image.url) {
        return data.image.url;
      }
    }

    // Look for offers with images
    if (data.offers && Array.isArray(data.offers)) {
      for (const offer of data.offers) {
        if (offer.image) {
          return typeof offer.image === 'string' ? offer.image : offer.image.url;
        }
      }
    }
  }

  return null;
}
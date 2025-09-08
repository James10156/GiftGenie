import crypto from 'crypto';
import fetch from 'node-fetch';

interface AmazonProductImage {
  url: string;
  width: number;
  height: number;
}

interface AmazonProduct {
  asin: string;
  title: string;
  images: {
    primary: AmazonProductImage;
    variants?: AmazonProductImage[];
  };
  offers: {
    listings: Array<{
      price: {
        displayAmount: string;
        amount: number;
        currency: string;
      };
    }>;
  };
  byLineInfo: {
    brand?: {
      displayValue: string;
    };
  };
}

interface AmazonSearchResponse {
  searchResult: {
    items: AmazonProduct[];
  };
}

// Amazon Product Advertising API credentials
const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const AMAZON_HOST = 'webservices.amazon.com';
const AMAZON_REGION = 'us-east-1';

export async function getAmazonProductImage(productName: string, maxPrice?: number): Promise<string | null> {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_PARTNER_TAG) {
    console.log(`[AMAZON_API] API credentials not configured, skipping Amazon image search`);
    return null;
  }

  try {
    console.log(`[AMAZON_API] Searching for product: ${productName}`);
    
    const searchParams = {
      Service: 'ProductAdvertisingAPI',
      Operation: 'SearchItems',
      Marketplace: 'www.amazon.com',
      PartnerTag: AMAZON_PARTNER_TAG,
      PartnerType: 'Associates',
      Keywords: productName,
      SearchIndex: 'All',
      ItemCount: 3,
      Resources: [
        'Images.Primary.Large',
        'Images.Variants.Large', 
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price'
      ]
    };

    const requestUrl = await createAmazonSignedRequest(searchParams);
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
      }
    });

    if (!response.ok) {
      console.log(`[AMAZON_API] HTTP error: ${response.status} - ${response.statusText}`);
      return null;
    }

    const data = await response.json() as AmazonSearchResponse;
    
    if (data.searchResult?.items?.length > 0) {
      // Find the best matching product within price range
      for (const item of data.searchResult.items) {
        if (maxPrice && item.offers?.listings?.[0]?.price?.amount > maxPrice) {
          continue; // Skip if over budget
        }

        if (item.images?.primary?.url) {
          console.log(`[AMAZON_API] Found Amazon product image: ${item.images.primary.url}`);
          console.log(`[AMAZON_API] Product: ${item.title} - Price: ${item.offers?.listings?.[0]?.price?.displayAmount || 'N/A'}`);
          return item.images.primary.url;
        }
      }
    }

    console.log(`[AMAZON_API] No suitable products found for: ${productName}`);
    return null;

  } catch (error) {
    console.error(`[AMAZON_API] Error searching Amazon for ${productName}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function createAmazonSignedRequest(params: Record<string, any>): Promise<string> {
  const method = 'POST';
  const uri = '/paapi5/searchitems';
  const payload = JSON.stringify(params);
  
  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const date = timestamp.substr(0, 8);

  // Create canonical request
  const canonicalHeaders = [
    `host:${AMAZON_HOST}`,
    `x-amz-date:${timestamp}`
  ].join('\n');

  const signedHeaders = 'host;x-amz-date';
  
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = [
    method,
    uri,
    '', // query string
    canonicalHeaders,
    '',
    signedHeaders,
    payloadHash
  ].join('\n');

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${date}/${AMAZON_REGION}/ProductAdvertisingAPI/aws4_request`;
  const stringToSign = [
    algorithm,
    timestamp,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');

  // Calculate signature
  const kDate = crypto.createHmac('sha256', `AWS4${AMAZON_SECRET_KEY}`).update(date).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(AMAZON_REGION).digest();
  const kService = crypto.createHmac('sha256', kRegion).update('ProductAdvertisingAPI').digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  // Create authorization header
  const authorization = `${algorithm} Credential=${AMAZON_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return `https://${AMAZON_HOST}${uri}`;
}

// Fallback: Try to extract Amazon ASIN from URLs and construct image URLs
export async function getAmazonImageFromUrl(amazonUrl: string): Promise<string | null> {
  try {
    // Extract ASIN from Amazon URL
    const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})|\/product\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    const asin = asinMatch?.[1] || asinMatch?.[2] || asinMatch?.[3];
    
    if (asin) {
      // Construct Amazon image URL (this is a common pattern, though not guaranteed)
      const imageUrl = `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`;
      console.log(`[AMAZON_API] Constructed image URL from ASIN ${asin}: ${imageUrl}`);
      
      // Validate the constructed URL
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`[AMAZON_API] ✅ Constructed URL is valid: ${imageUrl}`);
          return imageUrl;
        } else {
          console.log(`[AMAZON_API] ❌ Constructed URL returned ${response.status}, URL invalid: ${imageUrl}`);
          return null;
        }
      } catch (fetchError) {
        console.log(`[AMAZON_API] ❌ Failed to validate constructed URL: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        return null;
      }
    }

    console.log(`[AMAZON_API] Could not extract ASIN from URL: ${amazonUrl}`);
    return null;
  } catch (error) {
    console.error(`[AMAZON_API] Error extracting ASIN from URL:`, error);
    return null;
  }
}

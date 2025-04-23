export interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photo_url?: string;
  website?: string;
}

interface EnhancedPlaceResult extends PlaceResult {
  vendorInfo?: {
    name: string;
    logo: string;
    url: string;
  };
}

/**
 * Attempts to find a website for a place if not provided by Google Places
 */
async function findWebsite(placeName: string, address: string): Promise<string | null> {
  // This would ideally use a service like Bing Web Search API or similar
  // For now, return null as we'd need an additional API integration
  return null;
}

/**
 * Identifies the website vendor/platform (e.g., Wix, Shopify, WordPress)
 */
async function identifyWebsiteVendor(websiteUrl: string): Promise<{ name: string; logo: string; url: string } | null> {
  // This would analyze the website to detect the platform
  // For demo purposes, return null as we'd need additional integrations
  return null;
}

/**
 * Calls Supabase Edge Function to securely search Google Places API with a backend key.
 */
export async function findPlaces({
  query,
}: {
  query: string;
}): Promise<EnhancedPlaceResult[]> {
  const endpoint =
    "https://osstlpyfzvzjjcrdayvy.supabase.co/functions/v1/google-places-search";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    // Try to extract error message from the body
    let message = "Failed to fetch results";
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }

  const results = (await res.json()) as PlaceResult[];
  
  // Enhance results with website information and vendor detection
  const enhancedResults = await Promise.all(
    results.map(async (result) => {
      let website = result.website;
      let vendorInfo = null;

      if (!website) {
        website = await findWebsite(result.name, result.formatted_address);
        if (website) {
          result.website = website;
        }
      }

      if (website) {
        vendorInfo = await identifyWebsiteVendor(website);
      }

      return {
        ...result,
        vendorInfo,
      };
    })
  );

  return enhancedResults;
}

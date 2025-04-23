export interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photo_url?: string;
  website?: string;
  review_count?: number;
}

export interface EnhancedPlaceResult extends PlaceResult {
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
  try {
    // Use Bing Web Search API to find the website
    // This is a simplified example - in production you'd want to use a proper search API
    const searchQuery = `${placeName} ${address} official website`;
    const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(searchQuery)}`;
    
    const res = await fetch(searchUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': 'YOUR_BING_API_KEY' // This would need to be configured
      }
    });

    if (res.ok) {
      const data = await res.json();
      // Get the first result that looks like a business website
      const firstResult = data.webPages?.value?.[0];
      if (firstResult?.url && !firstResult.url.includes('facebook.com') && !firstResult.url.includes('yelp.com')) {
        return firstResult.url;
      }
    }
  } catch (error) {
    console.error('Error finding website:', error);
  }
  return null;
}

/**
 * Identifies the website vendor/platform (e.g., Wix, Shopify, WordPress)
 */
async function identifyWebsiteVendor(websiteUrl: string): Promise<{ name: string; logo: string; url: string } | null> {
  try {
    const res = await fetch(websiteUrl);
    const html = await res.text();

    // Check for common website platform signatures
    const platforms = [
      {
        name: 'Wix',
        signatures: ['wix.com', '_wixCss'],
        logo: 'https://static.wixstatic.com/media/e0678ef25486466ba65ef6ad47b559e1.png',
        url: 'https://www.wix.com'
      },
      {
        name: 'Shopify',
        signatures: ['cdn.shopify.com', 'Shopify.theme'],
        logo: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg',
        url: 'https://www.shopify.com'
      },
      {
        name: 'WordPress',
        signatures: ['wp-content', 'wp-includes'],
        logo: 'https://s.w.org/style/images/about/WordPress-logotype-standard.png',
        url: 'https://wordpress.org'
      },
      {
        name: 'Squarespace',
        signatures: ['squarespace.com', 'Static.Squarespace'],
        logo: 'https://static1.squarespace.com/static/ta/5134cbefe4b0c6fb04df8065/10515/assets/logos/squarespace-logo-horizontal-black.svg',
        url: 'https://www.squarespace.com'
      }
    ];

    for (const platform of platforms) {
      if (platform.signatures.some(sig => html.includes(sig))) {
        return {
          name: platform.name,
          logo: platform.logo,
          url: platform.url
        };
      }
    }
  } catch (error) {
    console.error('Error identifying website vendor:', error);
  }
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


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";

// Simple in-memory rate limiter
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  try(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter out timestamps outside the current window
    const recentTimestamps = timestamps.filter(time => time > now - this.windowMs);
    
    // Check if we're at the limit
    if (recentTimestamps.length >= this.limit) {
      return false;
    }
    
    // Add current timestamp and update
    recentTimestamps.push(now);
    this.requests.set(key, recentTimestamps);
    
    return true;
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(time => time > now - this.windowMs);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }
}

// Create rate limiter: 10 requests per minute
const limiter = new SimpleRateLimiter(10, 60000);

// Simple bot detection function
function isBotRequest(req: Request): boolean {
  const userAgent = req.headers.get("user-agent") || "";
  
  // Check for common bot signatures in user agent
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /headless/i, /puppeteer/i, 
    /selenium/i, /chrome-lighthouse/i, /phantom/i
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return true;
  }
  
  // Check for missing or suspicious headers commonly absent in bots
  const referer = req.headers.get("referer");
  const acceptLanguage = req.headers.get("accept-language");
  
  if (!referer && !acceptLanguage) {
    return true;
  }
  
  return false;
}

// Function to deduplicate results based on place_id
function deduplicateResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.place_id)) {
      return false;
    }
    seen.add(r.place_id);
    return true;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get client IP for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for") || "unknown";
    const clientIP = forwardedFor.split(",")[0].trim();
    
    // Check if request is from a bot
    if (isBotRequest(req)) {
      console.warn("Bot request detected and blocked:", clientIP);
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Apply rate limiting
    if (!limiter.try(clientIP)) {
      console.warn("Rate limit exceeded for IP:", clientIP);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429, // Too Many Requests
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": "60" // Suggest client to retry after 60 seconds
        },
      });
    }
    
    const { query } = await req.json();

    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY is not set." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let allResults: any[] = [];
    
    // 1. First try text search
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    let res = await fetch(textSearchUrl);
    let data = await res.json();
    
    if (Array.isArray(data.results)) {
      allResults.push(...data.results);
    }
    
    // 2. If the search looks like it might be for a website, try finding by name
    if (query.includes('.com') || query.includes('.org') || query.includes('.net') || query.includes('www.')) {
      // Extract potential business name from domain
      let businessName = query
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('.')[0];
        
      // Try a second search with just the business name
      if (businessName && businessName.length > 3) {
        const nameSearchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(businessName)}&inputtype=textquery&fields=place_id,name,formatted_address,photos,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
        
        const nameRes = await fetch(nameSearchUrl);
        const nameData = await nameRes.json();
        
        if (nameData.candidates && nameData.candidates.length > 0) {
          // For each candidate, get full details
          for (const candidate of nameData.candidates) {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=place_id,name,formatted_address,photos,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();
            
            if (detailsData.result) {
              allResults.push(detailsData.result);
            }
          }
        }
      }
    }
    
    // 3. If still not enough results, try a broader search
    if (allResults.length < 3 && !query.includes('.')) {
      const broadSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " business")}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const broadRes = await fetch(broadSearchUrl);
      const broadData = await broadRes.json();
      
      if (Array.isArray(broadData.results)) {
        allResults.push(...broadData.results);
      }
    }
    
    // Deduplicate results
    allResults = deduplicateResults(allResults);
    
    if (allResults.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format results
    const formattedResults = await Promise.all(
      allResults.map(async (r: any) => {
        let photo_url: string | undefined;
        if (r.photos?.[0]?.photo_reference) {
          photo_url =
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${r.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
        }

        return {
          name: r.name,
          formatted_address: r.formatted_address || r.vicinity || "",
          place_id: r.place_id,
          photo_url,
          review_count: r.user_ratings_total || 0,
        };
      })
    );

    return new Response(JSON.stringify(formattedResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("google-places-search error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

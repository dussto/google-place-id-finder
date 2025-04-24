
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RateLimiter } from "https://deno.land/x/rate_limiter@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";

// Create rate limiter: 10 requests per minute
const limiter = new RateLimiter({
  requests: 10,
  interval: 60000, // 60 seconds (1 minute)
});

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

    // 1. Fetch place results
    const baseUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json";
    const url = `${baseUrl}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data.results)) {
      return new Response(JSON.stringify({ error: data.error_message || "No results" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. For each result, build the info (including photo_url and review_count)
    const out = await Promise.all(
      data.results.map(async (r: any) => {
        let photo_url: string | undefined;
        if (r.photos?.[0]?.photo_reference) {
          photo_url =
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${r.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
        }

        return {
          name: r.name,
          formatted_address: r.formatted_address,
          place_id: r.place_id,
          photo_url,
          review_count: r.user_ratings_total || 0,
        };
      })
    );

    return new Response(JSON.stringify(out), {
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

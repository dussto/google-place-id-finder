
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";

// Enhanced search term processing
function processSearchTerm(query: string): string[] {
  const searchTerms = [];
  
  // Original query
  searchTerms.push(query);
  
  // Remove common TLDs and clean up
  const cleanQuery = query
    .toLowerCase()
    .replace(/\.(com|org|net|io|co|us|ca|app|ai|dev)$/i, '')
    .replace(/[^\w\s]/g, ' ')
    .trim();
  if (cleanQuery !== query.toLowerCase()) {
    searchTerms.push(cleanQuery);
  }
  
  // Add "company" or "business" for better context
  searchTerms.push(`${cleanQuery} company`);
  searchTerms.push(`${cleanQuery} business`);
  
  return [...new Set(searchTerms)]; // Remove duplicates
}

async function searchPlaces(searchTerm: string, apiKey: string): Promise<any[]> {
  const results = [];
  
  try {
    // 1. Try text search first
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${apiKey}`;
    const textRes = await fetch(textSearchUrl);
    const textData = await textRes.json();
    if (textData.results) {
      results.push(...textData.results);
    }
    
    // 2. Try findPlaceFromText for more specific matches
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchTerm)}&inputtype=textquery&fields=place_id,name,formatted_address,photos,website,user_ratings_total,geometry&key=${apiKey}`;
    const findRes = await fetch(findPlaceUrl);
    const findData = await findRes.json();
    
    if (findData.candidates?.length > 0) {
      // Get full details for each candidate
      for (const candidate of findData.candidates) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=place_id,name,formatted_address,photos,website,user_ratings_total&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        if (detailsData.result) {
          results.push(detailsData.result);
        }
      }
    }
    
    // 3. Try a broader search if we have few results
    if (results.length < 3) {
      const broadQuery = searchTerm.split(' ')[0]; // Use first word for broader search
      const broadUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(broadQuery)}&key=${apiKey}`;
      const broadRes = await fetch(broadUrl);
      const broadData = await broadRes.json();
      if (broadData.results) {
        results.push(...broadData.results);
      }
    }
  } catch (error) {
    console.error(`Error searching for "${searchTerm}":`, error);
  }
  
  return results;
}

// Deduplicate and format results
function formatAndDeduplicateResults(results: any[]): any[] {
  const seen = new Set();
  const formatted = [];
  
  for (const result of results) {
    if (!result || !result.place_id || seen.has(result.place_id)) continue;
    
    seen.add(result.place_id);
    let photo_url;
    if (result.photos?.[0]?.photo_reference) {
      photo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
    }
    
    formatted.push({
      name: result.name,
      formatted_address: result.formatted_address || result.vicinity || "",
      place_id: result.place_id,
      photo_url,
      website: result.website,
      review_count: result.user_ratings_total || 0,
    });
  }
  
  return formatted;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY is not set.");
    }
    
    const { query } = await req.json();
    console.log("Original search query:", query);
    
    // Process search terms
    const searchTerms = processSearchTerm(query);
    console.log("Processed search terms:", searchTerms);
    
    // Collect all results
    let allResults: any[] = [];
    for (const term of searchTerms) {
      const results = await searchPlaces(term, GOOGLE_PLACES_API_KEY);
      allResults.push(...results);
      console.log(`Found ${results.length} results for term "${term}"`);
    }
    
    // Format and deduplicate results
    const finalResults = formatAndDeduplicateResults(allResults);
    console.log("Total unique results:", finalResults.length);
    
    return new Response(JSON.stringify(finalResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (err: any) {
    console.error("Search error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

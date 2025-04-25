
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchPlaces } from "./places-api.ts";
import { processSearchTerm, formatAndDeduplicateResults } from "./search-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";

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
    let allResults = [];
    for (const term of searchTerms) {
      const results = await searchPlaces(term, GOOGLE_PLACES_API_KEY);
      allResults.push(...results);
      console.log(`Found ${results.length} results for term "${term}"`);
    }
    
    // Format and deduplicate results
    const finalResults = formatAndDeduplicateResults(allResults, GOOGLE_PLACES_API_KEY);
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

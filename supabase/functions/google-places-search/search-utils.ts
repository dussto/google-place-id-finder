
import { PlaceResult } from './types.ts';

export function processSearchTerm(query: string): string[] {
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

export function formatAndDeduplicateResults(results: PlaceResult[], apiKey: string): any[] {
  const seen = new Set();
  const formatted = [];
  
  for (const result of results) {
    if (!result || !result.place_id || seen.has(result.place_id)) continue;
    
    seen.add(result.place_id);
    let photo_url;
    if (result.photos?.[0]?.photo_reference) {
      photo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${apiKey}`;
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

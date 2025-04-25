
import { PlaceResult } from './types.ts';

export async function searchPlaces(searchTerm: string, apiKey: string): Promise<PlaceResult[]> {
  const results: PlaceResult[] = [];
  
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

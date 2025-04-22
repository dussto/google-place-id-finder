
export interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photo_url?: string;
}

export async function findPlaces({
  apiKey,
  query,
}: {
  apiKey: string;
  query: string;
}): Promise<PlaceResult[]> {
  // Use a CORS proxy to avoid direct client-side requests to Google API
  const proxyUrl = "https://corsproxy.io/?";
  const endpoint = `${proxyUrl}${encodeURIComponent(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${apiKey}`
  )}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Failed to fetch from Google Places API: ${res.status}`);
    
    const data = await res.json();
    
    if (!Array.isArray(data.results))
      throw new Error(data.error_message || "No results");

    // Build photo URL if available
    return data.results.map((r: any) => ({
      name: r.name,
      formatted_address: r.formatted_address,
      place_id: r.place_id,
      photo_url: r.photos?.[0]
        ? `${proxyUrl}${encodeURIComponent(
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${r.photos[0].photo_reference}&key=${apiKey}`
          )}`
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching from Google Places API:", error);
    throw error;
  }
}

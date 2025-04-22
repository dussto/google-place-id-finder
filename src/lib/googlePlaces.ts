
export interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photo_url?: string;
}

/**
 * Calls Supabase Edge Function to securely search Google Places API with a backend key.
 */
export async function findPlaces({
  query,
}: {
  query: string;
}): Promise<PlaceResult[]> {
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

  return (await res.json()) as PlaceResult[];
}

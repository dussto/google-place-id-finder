
import type { PlaceResult, EnhancedPlaceResult } from "@/lib/googlePlaces";

/**
 * WordPress-specific implementation for finding places
 * This uses WordPress's admin-ajax.php for the backend requests
 */
export async function findPlaces({
  query,
}: {
  query: string;
}): Promise<EnhancedPlaceResult[]> {
  // Default to using the WordPress AJAX API
  const endpoint = (window as any).placeidFinderData?.ajaxUrl || "/wp-admin/admin-ajax.php";
  const nonce = (window as any).placeidFinderData?.nonce || "";
  
  try {
    // Create form data for the WordPress AJAX request
    const formData = new FormData();
    formData.append('action', 'place_id_finder_search');
    formData.append('query', query);
    formData.append('nonce', nonce);
    
    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let message = "Failed to fetch results";
      try {
        const data = await res.json();
        message = data.error || data.message || message;
      } catch {}
      throw new Error(message);
    }

    const results = await res.json() as PlaceResult[];
    
    // Since we can't easily implement vendor detection in WordPress,
    // we'll return the basic results with empty vendorInfo
    const enhancedResults: EnhancedPlaceResult[] = results.map(result => ({
      ...result,
      vendorInfo: null,
    }));

    return enhancedResults;
  } catch (error) {
    console.error("WordPress Places API error:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
}

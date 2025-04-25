
export interface PlaceResult {
  name: string;
  formatted_address?: string;
  vicinity?: string;
  place_id: string;
  photos?: Array<{ photo_reference: string }>;
  website?: string;
  user_ratings_total?: number;
}

export interface FormattedPlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photo_url?: string;
  website?: string;
  review_count: number;
}


import React from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Globe, Copy, MessageSquare, Link } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EnhancedPlaceResult } from "@/lib/googlePlaces";

const PLACEHOLDER = "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=cover&w=400&q=80";

interface PlaceCardProps {
  result: EnhancedPlaceResult;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ result }) => {
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Place ID has been copied to your clipboard",
    });
  };

  const getGoogleMapsUrl = (placeId: string) => `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  const getGoogleReviewsUrl = (placeId: string) => `https://search.google.com/local/reviews?placeid=${placeId}`;

  return (
    <Card className="flex flex-row items-stretch p-0 border border-gray-100">
      <div className="w-[30%] min-w-0 bg-[#F8FAFC] flex items-center justify-center">
        <img
          src={result.photo_url || PLACEHOLDER}
          alt={result.name}
          className="object-cover w-full h-full aspect-video"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
      </div>
      <div className="w-[70%] flex flex-col gap-3 p-6 bg-white">
        <div className="font-semibold text-xl flex items-center gap-2 text-[#0F172A]">
          <MapPin className="w-5 h-5 text-[#0EA5E9]" />
          {result.name}
          <a
            href={getGoogleMapsUrl(result.place_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-[#0EA5E9]"
          >
            <Link className="w-4 h-4" />
          </a>
        </div>
        <a
          href={getGoogleReviewsUrl(result.place_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[#475569] hover:text-[#0EA5E9]"
        >
          <MessageSquare className="w-4 h-4" />
          {result.review_count ?? 0} reviews
        </a>
        <div className="text-[#475569]">{result.formatted_address}</div>
        {result.website && (
          <div className="flex items-center gap-2 text-[#0EA5E9]">
            <Globe className="w-4 h-4" />
            <a
              href={result.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-sm"
            >
              {result.website}
            </a>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 bg-[#F8FAFC] p-3 rounded-lg">
          <div className="flex-1">
            <div className="text-xs text-[#64748B] font-medium mb-1">Place ID</div>
            <div className="font-mono text-sm text-[#0F172A]">{result.place_id}</div>
          </div>
          <button
            onClick={() => copyToClipboard(result.place_id)}
            className="p-2 hover:bg-white rounded-md transition-colors"
            title="Copy Place ID"
          >
            <Copy className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>
        {result.vendorInfo && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[#64748B] border-t border-gray-100 pt-3">
            <span>Website powered by</span>
            <a
              href={result.vendorInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#0EA5E9]"
            >
              <img
                src={result.vendorInfo.logo}
                alt={result.vendorInfo.name}
                className="h-4 w-4 object-contain"
              />
              {result.vendorInfo.name}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};

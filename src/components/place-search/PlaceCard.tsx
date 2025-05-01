
import React from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Globe, Copy, MessageSquare, Link, ImageOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EnhancedPlaceResult } from "@/lib/googlePlaces";

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
    <Card className="flex flex-col sm:flex-row items-stretch p-0 border border-gray-100 overflow-hidden">
      <div className="w-full sm:w-[30%] min-w-0 bg-[#F8FAFC] flex items-center justify-center h-48 sm:h-auto p-[3px]">
        {result.photo_url ? (
          <img
            src={result.photo_url}
            alt={result.name}
            className="object-cover w-full h-full rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            <ImageOff className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      <div className="w-full sm:w-[70%] flex flex-col gap-3 p-4 sm:p-6 bg-white">
        <div className="font-semibold text-lg sm:text-xl flex flex-wrap items-center gap-2 text-[#0F172A]">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#0EA5E9] shrink-0" />
          <span className="break-words">{result.name}</span>
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
        <div className="text-sm sm:text-base text-[#475569] break-words">{result.formatted_address}</div>
        {result.website && (
          <div className="flex items-center gap-2 text-[#0EA5E9] break-all">
            <Globe className="w-4 h-4 shrink-0" />
            <a
              href={result.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-xs sm:text-sm"
            >
              {result.website}
            </a>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 bg-[#F8FAFC] p-3 rounded-lg">
          <div className="flex-1 overflow-hidden">
            <div className="text-xs text-[#64748B] font-medium mb-1">Place ID</div>
            <div className="font-mono text-xs sm:text-sm text-[#0F172A] break-all">{result.place_id}</div>
          </div>
          <button
            onClick={() => copyToClipboard(result.place_id)}
            className="p-2 hover:bg-white rounded-md transition-colors shrink-0"
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

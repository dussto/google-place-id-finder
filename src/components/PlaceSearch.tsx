
import React, { useState } from "react";
import { findPlaces, PlaceResult } from "@/lib/googlePlaces";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MapPin, AlertCircle, Globe, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=cover&w=400&q=80";

const PlaceCard: React.FC<{ result: PlaceResult }> = ({ result }) => {
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Place ID has been copied to your clipboard",
    });
  };

  return (
    <Card className="flex flex-row items-stretch p-0 border border-gray-200">
      <div className="w-[30%] min-w-0 bg-gray-100 flex items-center justify-center">
        <img
          src={result.photo_url || PLACEHOLDER}
          alt={result.name}
          className="object-cover w-full h-full aspect-video"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
      </div>
      <div className="w-[70%] flex flex-col gap-3 p-6">
        <div className="font-semibold text-xl flex items-center gap-2 text-gray-900">
          <MapPin className="w-5 h-5 text-primary" />
          {result.name}
        </div>
        <div className="text-gray-600">{result.formatted_address}</div>
        {result.website && (
          <div className="flex items-center gap-2 text-primary">
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
        <div className="flex items-center gap-2 mt-2 bg-gray-50 p-3 rounded-lg">
          <div className="flex-1">
            <div className="text-xs text-gray-500 font-medium mb-1">Place ID</div>
            <div className="font-mono text-sm text-gray-900">{result.place_id}</div>
          </div>
          <button
            onClick={() => copyToClipboard(result.place_id)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Copy Place ID"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </Card>
  );
};

const SearchHeader: React.FC = () => (
  <div className="mb-8 text-center">
    <h1 className="text-3xl font-semibold mb-2 text-gray-900">
      Google Place ID Finder
    </h1>
    <p className="text-gray-600">
      Enter a business or place name and get its Place ID — with photo and info!
    </p>
  </div>
);

export default function PlaceSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) {
      toast({
        title: "Query required",
        description: "Please enter a place or business to search for.",
      });
      return;
    }

    setLoading(true);
    setResults(null);
    setError(null);

    try {
      const res = await findPlaces({ query });
      setResults(res);
      if (res.length === 0)
        toast({
          title: "No results found",
          description: "Try refining your search.",
        });
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err?.message || "Failed to fetch results");
      toast({
        title: "Error",
        description: err?.message || "Failed to fetch results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SearchHeader />
      <form className="flex flex-col md:flex-row gap-3 mb-8" onSubmit={handleSearch}>
        <Input
          type="text"
          required
          placeholder="Search for a place (e.g., Starbucks, New York)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "px-6 py-2.5 font-medium rounded-lg shadow-sm",
            "bg-primary text-white hover:bg-primary/90 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {loading ? "Searching..." : "Find Place ID"}
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Error occurred</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="flex flex-col gap-4">
          {results.map((res) => (
            <PlaceCard key={res.place_id} result={res} />
          ))}
        </div>
      )}
    </div>
  );
}

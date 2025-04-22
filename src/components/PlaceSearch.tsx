
import React, { useState } from "react";
import { findPlaces, PlaceResult } from "@/lib/googlePlaces";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Image, MapPin, AlertCircle } from "lucide-react";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=cover&w=400&q=80";

// Lay out image left (30%), info right (70%) in each PlaceCard
const PlaceCard: React.FC<{ result: PlaceResult }> = ({ result }) => (
  <Card className="flex flex-row items-stretch p-0 shadow-lg group transition-all hover:scale-105 hover:shadow-xl h-full overflow-hidden">
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
    <div className="w-[70%] flex flex-col gap-1 p-4">
      <div className="font-semibold text-lg flex items-center gap-2">
        <MapPin className="w-4 h-4 text-blue-500" />
        {result.name}
      </div>
      <div className="text-gray-600 text-sm">{result.formatted_address}</div>
      <div className="text-xs mt-2 break-all text-purple-800 font-mono">
        <span className="font-bold">Place ID:</span> {result.place_id}
      </div>
    </div>
  </Card>
);

export default function PlaceSearch() {
  const [apiKey, setApiKey] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !query) {
      toast({
        title: "API Key and query required",
        description: "Enter both your Google Places API key and a place query.",
      });
      return;
    }
    
    setLoading(true);
    setResults(null);
    setError(null);
    
    try {
      const res = await findPlaces({ apiKey, query });
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
    <div className="max-w-2xl mx-auto mt-16 px-4">
      <h1 className="text-3xl font-extrabold mb-2 text-gray-900 text-center">
        Google Place ID Finder
      </h1>
      <p className="mb-8 text-center text-gray-600">
        Enter a business or place name and get its Place ID — with photo and info!
      </p>
      <form
        className="flex flex-col md:flex-row gap-3 mb-8"
        onSubmit={handleSearch}
      >
        <Input
          type="text"
          required
          placeholder="Your Google Places API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="md:max-w-xs"
        />
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
          className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold px-6 py-2 rounded-lg shadow-md disabled:opacity-60"
        >
          {loading ? "Searching..." : "Find Place ID"}
        </button>
      </form>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Error occurred</p>
            <p className="text-sm text-red-600">{error}</p>
            <p className="mt-2 text-xs text-gray-700">
              This may be due to API key restrictions or network issues. Make sure:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Your API key is valid and has Places API enabled</li>
                <li>You have billing enabled for your Google Cloud project</li>
                <li>Your internet connection is stable</li>
              </ul>
            </p>
          </div>
        </div>
      )}
      
      {results && (
        <div className="flex flex-col gap-5"> {/* Changed from grid to flex column */}
          {results.map((res) => (
            <PlaceCard key={res.place_id} result={res} />
          ))}
        </div>
      )}
    </div>
  );
}

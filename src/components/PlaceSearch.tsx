
import React, { useState } from "react";
import { findPlaces, EnhancedPlaceResult } from "@/lib/googlePlaces";
import { toast } from "@/hooks/use-toast";
import { SearchHeader } from "./place-search/SearchHeader";
import { SearchForm } from "./place-search/SearchForm";
import { SearchError } from "./place-search/SearchError";
import { SearchResults } from "./place-search/SearchResults";

const RESULTS_PER_PAGE = 10;

const PlaceSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState<EnhancedPlaceResult[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

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
    setAllResults(null);
    setError(null);
    setCurrentPage(1);
    setSearchPerformed(true);

    try {
      const res = await findPlaces({ query });
      setAllResults(res);
      if (res.length === 0)
        toast({
          title: "No results found",
          description: "Try refining your search or using a different keyword.",
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
      
      <SearchForm
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSearch}
        loading={loading}
      />

      <SearchError error={error || ""} />

      {searchPerformed && allResults && allResults.length === 0 && !loading && !error && (
        <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">We couldn't find any places matching "{query}"</p>
          <div className="text-sm text-gray-500">
            <p>Suggestions:</p>
            <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
              <li>Check the spelling of your search term</li>
              <li>Try a more general search term</li>
              <li>Try searching for the business name without the domain (.com, .org, etc)</li>
              <li>Include location information if searching for a physical business</li>
            </ul>
          </div>
        </div>
      )}

      {allResults && allResults.length > 0 && (
        <SearchResults
          allResults={allResults}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          resultsPerPage={RESULTS_PER_PAGE}
        />
      )}
    </div>
  );
};

export default PlaceSearch;

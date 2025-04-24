
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

    try {
      const res = await findPlaces({ query });
      setAllResults(res);
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
      
      <SearchForm
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSearch}
        loading={loading}
      />

      <SearchError error={error || ""} />

      {allResults && (
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

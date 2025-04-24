
import React from "react";
import { EnhancedPlaceResult } from "@/lib/googlePlaces";
import { PlaceCard } from "./PlaceCard";
import { SearchPagination } from "../SearchPagination";

interface SearchResultsProps {
  allResults: EnhancedPlaceResult[];
  currentPage: number;
  onPageChange: (page: number) => void;
  resultsPerPage: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  allResults,
  currentPage,
  onPageChange,
  resultsPerPage,
}) => {
  const paginatedResults = allResults.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  return (
    <div className="flex flex-col gap-4">
      {paginatedResults.map((result) => (
        <PlaceCard key={result.place_id} result={result} />
      ))}
      
      <SearchPagination
        currentPage={currentPage}
        totalResults={allResults.length}
        resultsPerPage={resultsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  );
};

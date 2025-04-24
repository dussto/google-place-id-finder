
import React from "react";
import { EnhancedPlaceResult } from "@/lib/googlePlaces";
import { PlaceCard } from "./PlaceCard";
import { SearchPagination } from "../SearchPagination";
import { AdPlaceholder } from "../AdPlaceholder";

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
      {paginatedResults.map((result, index) => (
        <React.Fragment key={result.place_id}>
          <PlaceCard result={result} />
          {(index + 1) % 5 === 0 && index !== paginatedResults.length - 1 && (
            <AdPlaceholder className="my-2" />
          )}
        </React.Fragment>
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

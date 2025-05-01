
import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  query,
  onQueryChange,
  onSubmit,
  loading,
}) => {
  return (
    <form className="flex flex-col md:flex-row gap-3 mb-8" onSubmit={onSubmit}>
      <Input
        type="text"
        required
        placeholder="Search for a place (e.g., Starbucks, New York)"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-1 border-[#E2E8F0] text-[#0F172A] h-11" // Increased height to match button
      />
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "px-6 py-2.5 font-medium rounded-lg h-11", // Fixed height
          "bg-[#0EA5E9] text-white hover:bg-[#0284C7] transition-colors",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {loading ? "Searching..." : "Find Place ID"}
      </button>
    </form>
  );
};

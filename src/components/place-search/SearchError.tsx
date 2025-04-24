
import React from "react";
import { AlertCircle } from "lucide-react";

interface SearchErrorProps {
  error: string;
}

export const SearchError: React.FC<SearchErrorProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-red-700">Error occurred</p>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    </div>
  );
};

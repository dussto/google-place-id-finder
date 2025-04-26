
import React from 'react';
import { Card } from "@/components/ui/card";

interface AdPlaceholderProps {
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ className }) => {
  return (
    <Card className={`bg-gray-50 p-4 text-center text-gray-500 ${className}`}>
      <div className="text-xs uppercase tracking-wide">Advertisement</div>
    </Card>
  );
};


import React, { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdPlaceholderProps {
  className?: string;
  adSlot?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ className, adSlot }) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only attempt to load ads if adsbygoogle is defined
    // This helps prevent errors during development
    if (window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log("Ad push attempted");
      } catch (e) {
        console.error("Ad push error:", e);
      }
    }
  }, []);

  if (adSlot) {
    // Return actual AdSense ad unit when slot ID is provided
    return (
      <div className={className} ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-9928472912828891"
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Return placeholder when no ad slot is provided
  return (
    <Card className={`bg-gray-50 p-4 text-center text-gray-500 ${className}`}>
      <div className="text-xs uppercase tracking-wide">Advertisement</div>
    </Card>
  );
};

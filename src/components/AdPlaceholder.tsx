
import React, { useEffect, useRef } from 'react';

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
    if (window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log("Ad push attempted");
      } catch (e) {
        console.error("Ad push error:", e);
      }
    }
  }, []);

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
};

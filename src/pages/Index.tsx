
import PlaceSearch from "@/components/PlaceSearch";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <PlaceSearch />
          <div className="mt-8">
            <AdPlaceholder className="h-16 w-full" adSlot="your-ad-slot-id" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

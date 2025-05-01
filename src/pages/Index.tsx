
import PlaceSearch from "@/components/PlaceSearch";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Check out our Blog</h2>
            <p className="mb-6 text-gray-600">
              Read the latest articles and updates on our blog.
            </p>
            <Button asChild>
              <Link to="/blog">Visit Our Blog</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

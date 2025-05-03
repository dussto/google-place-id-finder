
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  featured_image_url: string | null;
  publish_date: string | null;
  created_at: string;
  seo_description: string | null;
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      // Only fetch published posts
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, featured_image_url, publish_date, created_at, seo_description")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center">Our Blog</h1>
        <p className="text-xl text-center text-gray-600 mt-2">
          Latest articles and updates
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">No blog posts available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden flex flex-col w-[calc(100%+50px)]">
              {post.featured_image_url && (
                <Link to={`/blog/${post.id}`} className="block overflow-hidden h-[250px]">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </Link>
              )}
              <CardContent className="pt-6 flex-grow">
                <h2 className="text-xl font-bold mb-2">
                  <Link to={`/blog/${post.id}`} className="hover:text-blue-600 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-500 text-sm mb-3">
                  {formatDate(post.created_at)}
                </p>
                {post.seo_description && (
                  <p className="text-gray-700">
                    {post.seo_description.length > 120
                      ? `${post.seo_description.substring(0, 120)}...`
                      : post.seo_description}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost">
                  <Link to={`/blog/${post.id}`}>Read More</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  featured_image_url: string | null;
  seo_description: string | null;
  created_at: string;
}

export const BlogPreview = () => {
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
        .select("id, title, featured_image_url, seo_description, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error("Error fetching posts:", error.message);
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-4">Latest from our Blog</h2>
        <div className="text-center py-8">Loading posts...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-6">Latest from our Blog</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden flex flex-col h-full w-[calc(100%+50px)]">
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
              <h3 className="text-lg font-bold mb-2">
                <Link to={`/blog/${post.id}`} className="hover:text-blue-600 transition-colors">
                  {post.title}
                </Link>
              </h3>
              <p className="text-gray-500 text-sm mb-3">
                {formatDate(post.created_at)}
              </p>
              {post.seo_description && (
                <p className="text-gray-700 text-sm">
                  {post.seo_description.length > 100
                    ? `${post.seo_description.substring(0, 100)}...`
                    : post.seo_description}
                </p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild variant="ghost" size="sm">
                <Link to={`/blog/${post.id}`}>Read More</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="text-center mt-6">
        <Button asChild variant="outline">
          <Link to="/blog">View All Posts</Link>
        </Button>
      </div>
    </div>
  );
};


import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface BlogPostData {
  id: string;
  title: string;
  content: string;
  featured_image_url: string | null;
  publish_date: string | null;
  created_at: string;
  seo_title: string | null;
  seo_description: string | null;
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);
  
  useEffect(() => {
    // Set SEO meta tags when the post data is loaded
    if (post) {
      document.title = post.seo_title || post.title;
      
      // Update meta description if we have SEO description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && post.seo_description) {
        metaDescription.setAttribute("content", post.seo_description);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.title = "Google Place ID Finder – Search and Find Any Place ID";
    };
  }, [post]);

  const fetchPost = async (postId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error: any) {
      toast({
        title: "Error fetching post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-12">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-12">Post not found</p>
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Blog
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/blog" className="text-blue-600 hover:underline flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="text-gray-600 mb-8">
          <span>Published on {formatDate(post.created_at)}</span>
          
          {isAdmin && (
            <span className="ml-4">
              <Button asChild size="sm" variant="outline">
                <Link to={`/admin/posts/${post.id}`}>Edit Post</Link>
              </Button>
            </span>
          )}
        </div>
        
        {post.featured_image_url && (
          <div className="mb-8 overflow-hidden h-[250px]">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover rounded-lg shadow-md"
            />
          </div>
        )}
        
        <div className="prose max-w-none">
          {/* Display the content with proper formatting */}
          {post.content.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

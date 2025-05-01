
import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  featured_image_url: string;
  publish_date: string;
  
  // SEO fields
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_canonical_url: string;
  seo_og_image_url: string;
}

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const isNewPost = id === "new";
  
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    slug: "",
    content: "",
    status: "draft",
    featured_image_url: "",
    publish_date: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    seo_canonical_url: "",
    seo_og_image_url: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNewPost);

  useEffect(() => {
    if (!isNewPost && id) {
      fetchPost(id);
    } else {
      setIsLoading(false);
    }
  }, [id, isNewPost]);

  const fetchPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;
      
      // Format date for input field
      const formattedData = {
        ...data,
        publish_date: data.publish_date ? 
          new Date(data.publish_date).toISOString().slice(0, 16) : 
          ""
      };
      
      setFormData(formattedData);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as "draft" | "published" }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({ 
      ...prev, 
      title,
      slug: prev.slug || generateSlug(title),
      seo_title: prev.seo_title || title
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert data for database
      const postData = {
        ...formData,
        author_id: user?.id,
      };

      let result;

      if (isNewPost) {
        // Create new post
        result = await supabase.from("blog_posts").insert([postData]);
      } else {
        // Update existing post
        result = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", id);
      }

      if (result.error) throw result.error;

      toast({
        title: isNewPost ? "Post created" : "Post updated",
        description: isNewPost 
          ? "Your new post has been created successfully"
          : "Your post has been updated successfully",
      });

      navigate("/admin/dashboard");
    } catch (error: any) {
      toast({
        title: "Error saving post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not admin and not loading, redirect to login
  if (!loading && (!user || !isAdmin)) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Loading post...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isNewPost ? "Create New Post" : "Edit Post"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs defaultValue="content">
          <TabsList className="mb-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Post Title"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="post-slug"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="featured_image_url">Featured Image URL</Label>
              <Input
                id="featured_image_url"
                name="featured_image_url"
                value={formData.featured_image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your post content here..."
                className="mt-1 min-h-[300px]"
                required
              />
            </div>
          </TabsContent>
          
          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <div>
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                name="seo_title"
                value={formData.seo_title}
                onChange={handleChange}
                placeholder="SEO Title (for search engines)"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended length: 50-60 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                name="seo_description"
                value={formData.seo_description}
                onChange={handleChange}
                placeholder="Short description for search engines"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended length: 150-160 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="seo_keywords">SEO Keywords</Label>
              <Input
                id="seo_keywords"
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleChange}
                placeholder="keyword1, keyword2, keyword3"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="seo_canonical_url">Canonical URL</Label>
              <Input
                id="seo_canonical_url"
                name="seo_canonical_url"
                value={formData.seo_canonical_url}
                onChange={handleChange}
                placeholder="https://yourdomain.com/your-preferred-url"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="seo_og_image_url">Open Graph Image URL</Label>
              <Input
                id="seo_og_image_url"
                name="seo_og_image_url"
                value={formData.seo_og_image_url}
                onChange={handleChange}
                placeholder="https://example.com/og-image.jpg"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Image shown when sharing on social media (1200x630px recommended)
              </p>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="publish_date">Schedule Publish Date</Label>
              <Input
                id="publish_date"
                name="publish_date"
                type="datetime-local"
                value={formData.publish_date}
                onChange={handleChange}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to publish immediately when status is set to published
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isNewPost
                ? "Creating..."
                : "Saving..."
              : isNewPost
              ? "Create Post"
              : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

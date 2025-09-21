import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

function Blog() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Check authentication status
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(user => setCurrentUser(user))
      .catch(() => setCurrentUser(null));
  }, []);

  // Fetch blog posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async (): Promise<BlogPost[]> => {
      const response = await fetch("/api/blog/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return await response.json();
    },
  });

  const queryClient = useQueryClient();

  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <a className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Gift Genie
              </a>
            </Link>
            {currentUser?.isAdmin && (
              <button
                onClick={() => {
                  setEditingPost(null);
                  setShowEditor(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                New Post
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">
            About Gift Genie
          </h1>
          <p className="text-xl text-center text-gray-600 mb-12">
            Learn more about our mission and the latest updates
          </p>

          {/* Blog Posts */}
          <div className="space-y-8">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No blog posts yet. Check back soon for updates!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-sm border p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {post.title}
                      </h2>
                      <div className="text-sm text-gray-500">
                        By {post.author} • {formatDate(post.createdAt)}
                        {post.updatedAt !== post.createdAt && (
                          <span> • Updated {formatDate(post.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                    {currentUser?.isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setShowEditor(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this post?")) {
                              deletePost.mutate(post.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: post.content.replace(/\n/g, "<br />"),
                      }}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Blog Editor Modal */}
      {showEditor && (
        <BlogEditor
          post={editingPost}
          onClose={() => {
            setShowEditor(false);
            setEditingPost(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
            setShowEditor(false);
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
}

// Blog Editor Component
interface BlogEditorProps {
  post: BlogPost | null;
  onClose: () => void;
  onSave: () => void;
}

function BlogEditor({ post, onClose, onSave }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [published, setPublished] = useState(post?.published ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content");
      return;
    }

    setSaving(true);
    try {
      const url = post
        ? `/api/blog/posts/${post.id}`
        : "/api/blog/posts";
      
      const method = post ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          published,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save post");
      }

      onSave();
    } catch (error) {
      alert("Failed to save post. Please try again.");
      console.error("Error saving post:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            {post ? "Edit Post" : "Create New Post"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter post title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your post content here..."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="published" className="text-sm">
                Publish immediately
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : post ? "Update Post" : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Blog;
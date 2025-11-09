
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Type definitions
export type BlogPayload = {
  subject: string;
  description: string;
  tags: string;
};

export type CommentPayload = {
  sentiment: 'Positive' | 'Negative';
  description: string;
};

export type Blog = {
  blog_id: number;
  username: string;
  subject: string;
  description: string;
  tags: string[];
  created_at: string;
};

export type Comment = {
  comment_id: number;
  username: string;
  sentiment: 'Positive' | 'Negative';
  description: string;
  created_at: string;
};

export type BlogWithComments = Blog & {
  comments: Comment[];
};

/**
 * Creates a new blog post
 * @param {BlogPayload} payload - Blog data
 * @returns {Promise<Object>}
 */
export async function createBlog(payload: BlogPayload) {
  try {
    const res = await fetch(`${API_URL}/api/blog/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create blog");

    return data;
  } catch (err: any) {
    console.error("Create blog error:", err);
    return { error: err.message || "Network error" };
  }
}

/**
 * Searches for blogs by tag
 * @param {string} tag - Tag to search for
 * @returns {Promise<Object>}
 */
export async function searchBlogs(tag: string) {
  try {
    const res = await fetch(`${API_URL}/api/blog/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tag }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to search blogs");

    return data;
  } catch (err: any) {
    console.error("Search blogs error:", err);
    return { error: err.message || "Network error" };
  }
}

/**
 * Gets a specific blog with comments
 * @param {number} blogId - Blog ID
 * @returns {Promise<Object>}
 */
export async function getBlog(blogId: number) {
  try {
    const res = await fetch(`${API_URL}/api/blog/${blogId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to get blog");

    return data;
  } catch (err: any) {
    console.error("Get blog error:", err);
    return { error: err.message || "Network error" };
  }
}

/**
 * Adds a comment to a blog
 * @param {number} blogId - Blog ID
 * @param {CommentPayload} payload - Comment data
 * @returns {Promise<Object>}
 */
export async function addComment(blogId: number, payload: CommentPayload) {
  try {
    const res = await fetch(`${API_URL}/api/blog/${blogId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to add comment");

    return data;
  } catch (err: any) {
    console.error("Add comment error:", err);
    return { error: err.message || "Network error" };
  }
}

/**
 * Gets all blogs created by the current user
 * @returns {Promise<Object>}
 */
export async function getMyBlogs() {
  try {
    const res = await fetch(`${API_URL}/api/blog/my-blogs`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to get blogs");

    return data;
  } catch (err: any) {
    console.error("Get my blogs error:", err);
    return { error: err.message || "Network error" };
  }
}
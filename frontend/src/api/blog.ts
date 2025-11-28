
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

export type Query1User = {
  username: string;
  firstname: string;
  lastname: string;
};

export type Query1Result = {
  users: Query1User[];
  error?: string;
};

export type Query2User = {
  username: string;
  firstname: string;
  lastname: string;
  blog_count: number;
};

export type Query2Result = {
  date: string;          
  users: Query2User[];
  error?: string;
};

export type Query3User = {
  username: string;
  firstname: string;
  lastname: string;
};

export type Query3Result = {
  userX: string;
  userY: string;
  users: Query3User[];
  error?: string;
};

export type Query4User = {
  username: string;
  firstname: string;
  lastname: string;
};

export type Query4Result = {
  users: Query4User[];
  error?: string;
};

export type Query5Result = {
  username: string;
  blogs: Blog[];
  error?: string;
};

export type Query6User = {
  username: string;
  firstname: string;
  lastname: string;
};

export type Query6Result = {
  users: Query6User[];
  error?: string;
};

export type Query7User = {
  username: string;
  firstname: string;
  lastname: string;
};

export type Query7Result = {
  users: Query7User[];
  error?: string;
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

/**
 * Phase 3 – Query 1:
 * Users who posted at least two blogs on the same day, one with tagA and one with tagB.
 */
export async function fetchQuery1SameDayTags(
  tagA: string,
  tagB: string
): Promise<Query1Result> {
  try {
    const res = await fetch(`${API_URL}/api/blog/query1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tagA, tagB }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to run Query 1");
    }

    // Backend returns { users: [...] }
    return {
      users: (data.users as Query1User[]) || [],
    };
  } catch (err: any) {
    console.error("Query 1 error:", err);
    return {
      users: [],
      error: err.message || "Network error",
    };
  }
}

/**
 * Phase 3 – Query 2:
 * Users who posted the most blogs on a specific date (ties included).
 */
export async function fetchQuery2MostBlogsOnDate(
  date?: string
): Promise<Query2Result> {
  try {
    let url = `${API_URL}/api/blog/query2`;
    if (date && date.trim()) {
      url += `?date=${encodeURIComponent(date.trim())}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to run Query 2");
    }

    // Expecting backend response like: { date: "2025-10-10", users: [...] }
    return {
      date: data.date as string,
      users: (data.users as Query2User[]) || [],
    };
  } catch (err: any) {
    console.error("Query 2 error:", err);
    return {
      date: date || "",
      users: [],
      error: err.message || "Network error",
    };
  }
}

/**
 * Phase 3 – Query 3:
 * Users who are followed by both userX and userY.
 */
export async function fetchQuery3FollowedByBoth(
  userX: string,
  userY: string
): Promise<Query3Result> {
  try {
    const res = await fetch(`${API_URL}/api/blog/query3`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userX, userY }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to run Query 3");
    }

    // Backend returns { userX, userY, users: [...] }
    return {
      userX: data.userX as string,
      userY: data.userY as string,
      users: (data.users as Query3User[]) || [],
    };
  } catch (err: any) {
    console.error("Query 3 error:", err);
    return {
      userX,
      userY,
      users: [],
      error: err.message || "Network error",
    };
  }
}

/**
 * Phase 3 – Query 4:
 * Users who have never posted a blog.
 */
export async function fetchQuery4UsersNeverPosted(): Promise<Query4Result> {
  try {
    const res = await fetch(`${API_URL}/api/blog/query4`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to run Query 4");
    }

    // Backend returns { users: [...] }
    return {
      users: (data.users as Query4User[]) || [],
    };
  } catch (err: any) {
    console.error("Query 4 error:", err);
    return {
      users: [],
      error: err.message || "Network error",
    };
  }
}

/**
 * Phase 3 – Query 5:
 * Blogs of user X where:
 *  The blog has at least one comment and ALL comments are Positive
 */
export async function fetchQuery5BlogsAllPositive(
  username: string
): Promise<Query5Result> {
  try {
    const res = await fetch(`${API_URL}/api/blog/query5`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to run Query 5");
    }

    // Backend returns { username, blogs: [...] }
    return {
      username: data.username as string,
      blogs: (data.blogs as Blog[]) || [],
    };
  } catch (err: any) {
    console.error("Query 5 error:", err);
    return {
      username,
      blogs: [],
      error: err.message || "Network error",
    };
  }
}

/**
 * Phase 3 – Query 6:
 * Users who posted some comments, and every comment is Negative.
 */
export async function fetchQuery6UsersOnlyNegativeComments(): Promise<Query6Result> {
  try {
    const res = await fetch(`${API_URL}/api/blog/query6`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to run Query 6");
    }

    // Backend returns { users: [...] }
    return {
      users: (data.users as Query6User[]) || [],
    };
  } catch (err: any) {
    console.error("Query 6 error:", err);
    return {
      users: [],
      error: err.message || "Network error",
    };
  }
}

/**
 * Phase 3 – Query 7:
 * Users who have posted blogs, and none of their blogs have ever received a Negative comment.
 */
export async function fetchQuery7UsersNoNegativeOnBlogs(): Promise<Query7Result> {
  try {
    const res = await fetch(`${API_URL}/api/blog/query7`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to run Query 7");
    }

    // Backend returns { users: [...] }
    return {
      users: (data.users as Query7User[]) || [],
    };
  } catch (err: any) {
    console.error("Query 7 error:", err);
    return {
      users: [],
      error: err.message || "Network error",
    };
  }
}

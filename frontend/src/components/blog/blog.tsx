import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import "./blog.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Type definitions
type BlogPayload = {
  subject: string;
  description: string;
  tags: string;
};

type CommentPayload = {
  sentiment: "Positive" | "Negative";
  description: string;
};

type Blog = {
  blog_id: number;
  username: string;
  subject: string;
  description: string;
  tags: string[];
  created_at: string;
};

type Comment = {
  comment_id: number;
  username: string;
  sentiment: "Positive" | "Negative";
  description: string;
  created_at: string;
};

type BlogWithComments = Blog & {
  comments: Comment[];
};

// API Functions
async function createBlog(payload: BlogPayload) {
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

async function searchBlogs(tag: string) {
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

async function getBlog(blogId: number) {
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

async function addComment(blogId: number, payload: CommentPayload) {
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

// Helper function
const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

//=================================================================================================
// CREATE BLOG COMPONENT
//=================================================================================================

interface BlogForm {
  subject: string;
  description: string;
  tags: string;
}

function CreateBlogComponent() {
  const [form, setForm] = useState<BlogForm>({
    subject: "",
    description: "",
    tags: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | string[]>("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRedirect = (path: string) => {
    try {
      setLoading(true);
      navigate(path);
    } catch (err: any) {
      setError(err.message || "Redirect Failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!form.subject.trim()) {
      return setError("Subject is required.");
    }
    if (form.subject.length > 200) {
      return setError("Subject must be less than 200 characters.");
    }
    if (!form.description.trim()) {
      return setError("Description is required.");
    }
    if (!form.tags.trim()) {
      return setError("At least one tag is required.");
    }

    const payload = {
      subject: form.subject.trim(),
      description: form.description.trim(),
      tags: form.tags.trim(),
    };

    try {
      setLoading(true);
      const res = await createBlog(payload);

      if (res.error) {
        setError(Array.isArray(res.error) ? res.error : [res.error]);
        return;
      }

      setSuccess(`Blog created successfully!`);

      // Reset form
      setForm({
        subject: "",
        description: "",
        tags: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="blog-container" component="form" onSubmit={handleSubmit}>
      <Typography variant="h5">Create a New Blog</Typography>

      <Typography variant="body2" color="textSecondary">
        You can post up to 2 blogs per day.
      </Typography>

      <TextField
        label="Subject"
        name="subject"
        variant="outlined"
        value={form.subject}
        onChange={handleChange}
        placeholder="e.g., The future of blockchain"
        required
        fullWidth
      />

      <TextField
        label="Description"
        name="description"
        variant="outlined"
        value={form.description}
        onChange={handleChange}
        placeholder="Write your blog content here..."
        multiline
        rows={8}
        required
        fullWidth
      />

      <TextField
        label="Tags (comma-separated)"
        name="tags"
        variant="outlined"
        value={form.tags}
        onChange={handleChange}
        placeholder="e.g., blockchain, bitcoin, decentralized"
        required
        fullWidth
      />

      {Boolean(error) && (
        <Typography color="error" textAlign="center">
          {Array.isArray(error)
            ? error.map((msg, i) => <div key={i}>{msg}</div>)
            : error}
        </Typography>
      )}

      {success && (
        <Typography color="primary" textAlign="center">
          {success}
        </Typography>
      )}

      <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 1 }}>
        {loading ? "Creating..." : "Create Blog"}
      </Button>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
        <Button variant="text" onClick={() => handleRedirect("/blog/search")}>
          Search Blogs
        </Button>

        <Button variant="text" onClick={() => handleRedirect("/")}>
          Go to Home
        </Button>
      </Box>
    </Box>
  );
}

//=================================================================================================
// SEARCH BLOGS COMPONENT
//=================================================================================================

function SearchBlogsComponent() {
  const [tag, setTag] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTagChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTag(e.target.value);
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSearched(true);

    if (!tag.trim()) {
      setError("Please enter a tag to search");
      setLoading(false);
      return;
    }

    try {
      const res = await searchBlogs(tag.trim());

      if (res.error) {
        throw new Error(res.error);
      }

      setBlogs(res.blogs || []);
    } catch (err: any) {
      setError(err.message || "Failed to search blogs");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBlog = (blogId: number) => {
    navigate(`/blog/${blogId}`);
  };

  const handleRedirect = (path: string) => {
    try {
      setLoading(true);
      navigate(path);
    } catch (err: any) {
      setError(err.message || "Redirect Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="blog-container">
      <Typography variant="h5">Search Blogs by Tag</Typography>

      <Box component="form" onSubmit={handleSearch} className="search-form">
        <TextField
          label="Search Tag"
          name="tag"
          variant="outlined"
          value={tag}
          onChange={handleTagChange}
          placeholder="e.g., blockchain"
          required
        />

        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </Box>

      {error && (
        <Typography color="error" textAlign="center">
          {error}
        </Typography>
      )}

      {searched && (
        <Box sx={{ width: "100%" }}>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Search Results for "{tag}" ({blogs.length})
          </Typography>

          {blogs.length === 0 ? (
            <Typography color="textSecondary">
              No blogs found with the tag "{tag}".
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Tags</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.blog_id}>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {blog.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>{blog.username}</TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {blog.tags.map((t, idx) => (
                            <Chip
                              key={idx}
                              label={t}
                              size="small"
                              color="primary"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(blog.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewBlog(blog.blog_id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
        <Button variant="text" onClick={() => handleRedirect("/blog/create")} sx={{ mt: 2 }}>
          Create a Blog
        </Button>

        <Button variant="text" onClick={() => handleRedirect("/")}>
          Go to Home
        </Button>
      </Box>
    </Box>
  );
}

//=================================================================================================
// VIEW BLOG COMPONENT
//=================================================================================================

interface CommentForm {
  sentiment: "" | "Positive" | "Negative";
  description: string;
}

function ViewBlogComponent() {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<BlogWithComments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentForm, setCommentForm] = useState<CommentForm>({
    sentiment: "",
    description: "",
  });
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | string[]>("");
  const [commentSuccess, setCommentSuccess] = useState("");

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getBlog(Number(blogId));

      if (res.error) {
        throw new Error(res.error);
      }

      setBlog(res);
    } catch (err: any) {
      setError(err.message || "Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCommentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSentimentChange = (e: any) => {
    setCommentForm((prev) => ({ ...prev, sentiment: e.target.value }));
  };

  const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCommentError("");
    setCommentSuccess("");

    // Validation
    if (!commentForm.sentiment) {
      return setCommentError("Please select a sentiment");
    }
    if (!commentForm.description.trim()) {
      return setCommentError("Please enter a comment");
    }

    const payload = {
      sentiment: commentForm.sentiment as "Positive" | "Negative",
      description: commentForm.description.trim(),
    };

    try {
      setCommentLoading(true);
      const res = await addComment(Number(blogId), payload);

      if (res.error) {
        setCommentError(Array.isArray(res.error) ? res.error : [res.error]);
        return;
      }

      setCommentSuccess("Comment added successfully!");

      // Reset form
      setCommentForm({
        sentiment: "",
        description: "",
      });

      // Refresh blog to show new comment
      setTimeout(() => {
        fetchBlog();
        setCommentSuccess("");
      }, 1500);
    } catch (err: any) {
      setCommentError(err.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleRedirect = (path: string) => {
    try {
      navigate(path);
    } catch (err: any) {
      setError(err.message || "Redirect Failed.");
    }
  };

  if (loading) {
    return (
      <Box className="blog-container">
        <Typography>Loading blog...</Typography>
      </Box>
    );
  }

  if (error || !blog) {
    return (
      <Box className="blog-container">
        <Typography color="error">{error || "Blog not found"}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
          <Button variant="text" onClick={() => handleRedirect("/blog/search")}>
            Back to Search
          </Button>
          <Button variant="text" onClick={() => handleRedirect("/")}>
            Go to Home
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="blog-container">
      {/* Blog Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {blog.subject}
          </Typography>

          <Typography variant="body2" color="textSecondary" gutterBottom>
            By <strong>{blog.username}</strong> • {formatDate(blog.created_at)}
          </Typography>

          <Box display="flex" flexWrap="wrap" gap={1} sx={{ my: 2 }}>
            {blog.tags.map((tag, idx) => (
              <Chip key={idx} label={tag} color="primary" size="small" />
            ))}
          </Box>

          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mt: 2 }}>
            {blog.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Comments ({blog.comments.length})
          </Typography>

          {blog.comments.length === 0 ? (
            <Typography color="textSecondary" fontStyle="italic">
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            <Box>
              {blog.comments.map((comment) => (
                <Box key={comment.comment_id} sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography fontWeight="bold">
                      {comment.username}
                    </Typography>
                    <Chip
                      label={comment.sentiment}
                      color={
                        comment.sentiment === "Positive" ? "success" : "error"
                      }
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {comment.description}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(comment.created_at)}
                  </Typography>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Comment Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add a Comment
          </Typography>

          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            You can post up to 3 comments per day and only 1 comment per blog.
          </Typography>

          <Box component="form" onSubmit={handleCommentSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sentiment *</InputLabel>
              <Select
                name="sentiment"
                value={commentForm.sentiment}
                onChange={handleSentimentChange}
                required
              >
                <MenuItem value="">-- Select Sentiment --</MenuItem>
                <MenuItem value="Positive">Positive</MenuItem>
                <MenuItem value="Negative">Negative</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Comment"
              name="description"
              variant="outlined"
              value={commentForm.description}
              onChange={handleCommentChange}
              placeholder="This is a nice blog. I like the comparison between blockchain and the Internet."
              multiline
              rows={4}
              required
              fullWidth
              sx={{ mb: 2 }}
            />

            {Boolean(commentError) && (
              <Typography color="error" textAlign="center" sx={{ mb: 2 }}>
                {Array.isArray(commentError)
                  ? commentError.map((msg, i) => <div key={i}>{msg}</div>)
                  : commentError}
              </Typography>
            )}

            {commentSuccess && (
              <Typography color="primary" textAlign="center" sx={{ mb: 2 }}>
                {commentSuccess}
              </Typography>
            )}

            <Box display="flex" gap={2} flexDirection="column" alignItems="center" width="100%">
              <Button
                type="submit"
                variant="contained"
                disabled={commentLoading}
              >
                {commentLoading ? "Posting..." : "Post Comment"}
              </Button>

              <Button variant="text" onClick={() => handleRedirect("/blog/search")}>
                Back to Search
              </Button>

              <Button variant="text" onClick={() => handleRedirect("/")}>
                Go to Home
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

//=================================================================================================
// EXPORTED BLOG COMPONENT OBJECT
//=================================================================================================

const BlogComponent = {
  Create: CreateBlogComponent,
  Search: SearchBlogsComponent,
  View: ViewBlogComponent,
};

export default BlogComponent;
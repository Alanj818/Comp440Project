import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
} from "@mui/material";
import { Blog, fetchQuery5BlogsAllPositive } from "../../api/blog";


export default function Query5BlogsAllPositive() {
  const [usernameInput, setUsernameInput] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [queriedUser, setQueriedUser] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setBlogs([]);
    setQueriedUser(null);

    const username = usernameInput.trim();
    if (!username) {
      setError("Username is required.");
      return;
    }

    setLoading(true);
    const { username: usedUsername, blogs, error } =
      await fetchQuery5BlogsAllPositive(username);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setBlogs(blogs);
      setQueriedUser(usedUsername);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Query 5 – Blogs of User X with Only Positive Comments
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          List blogs of a user that have at least one comment, and all of those
          comments are Positive (no Negative comments).
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2, flexWrap: "wrap" }}>
          <TextField
            label="Username"
            size="small"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={loading}
            sx={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Running..." : "Run Query 5"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {queriedUser && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Blogs for user: <strong>{queriedUser}</strong>
          </Typography>
        )}

        {blogs.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Blog ID</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Tags</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blogs.map((b) => (
                <TableRow key={b.blog_id}>
                  <TableCell>{b.blog_id}</TableCell>
                  <TableCell>{b.subject}</TableCell>
                  <TableCell>
                    {new Date(b.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{b.tags.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!error && !loading && blogs.length === 0 && queriedUser && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No blogs found for {queriedUser} that match the condition (must have
            comments and all comments are Positive).
          </Typography>
        )}

        {!queriedUser && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Enter a username and run the query to see results.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

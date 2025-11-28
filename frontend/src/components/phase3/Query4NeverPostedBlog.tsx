import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
} from "@mui/material";
import { fetchQuery4UsersNeverPosted, Query4User } from "../../api/blog";


export default function Query4NeverPostedBlog() {
  const [users, setUsers] = useState<Query4User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleRun = async () => {
    setError(null);
    setUsers([]);
    setHasRun(true);

    setLoading(true);
    const { users, error } = await fetchQuery4UsersNeverPosted();
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setUsers(users);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Query 4 – Users Who Never Posted a Blog
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Display all users who have never posted any blog.
        </Typography>

        <Box sx={{ mt: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={loading}
            sx={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Running..." : "Run Query 4"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {users.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.username}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.firstname}</TableCell>
                  <TableCell>{u.lastname}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!error && !loading && users.length === 0 && hasRun && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No users found who have never posted a blog.
          </Typography>
        )}

        {!hasRun && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click the button above to run the query.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

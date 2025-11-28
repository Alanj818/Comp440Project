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
import { fetchQuery7UsersNoNegativeOnBlogs, Query7User } from "../../api/blog";

export default function Query7UsersNoNegativeOnBlogs() {
  const [users, setUsers] = useState<Query7User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleRun = async () => {
    setError(null);
    setUsers([]);
    setHasRun(true);

    setLoading(true);
    const { users, error } = await fetchQuery7UsersNoNegativeOnBlogs();
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
          Query 7 – Users Whose Blogs Never Got a Negative Comment
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Shows users who have posted at least one blog, and none of their blogs
          have ever received a Negative comment (only Positive or no comments).
        </Typography>

        <Box sx={{ mt: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={loading}
            sx={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Running..." : "Run Query 7"}
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
            No users found matching this condition.
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

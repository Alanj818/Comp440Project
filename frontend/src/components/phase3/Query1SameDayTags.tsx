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
import { fetchQuery1SameDayTags, Query1User } from "../../api/blog";

export default function Query1SameDayTags() {
  const [tagA, setTagA] = useState("");
  const [tagB, setTagB] = useState("");
  const [users, setUsers] = useState<Query1User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setError(null);
    setUsers([]);

    if (!tagA.trim() || !tagB.trim()) {
      setError("Both Tag A and Tag B are required.");
      return;
    }

    setLoading(true);
    const { users, error } = await fetchQuery1SameDayTags(
      tagA.trim(),
      tagB.trim()
    );
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
          Query 1 – Same-Day Blogs with Tag A & Tag B
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          List users who posted at least two different blogs on the same day:
          one with Tag A and one with Tag B.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2, flexWrap: "wrap" }}>
          <TextField
            label="Tag A"
            size="small"
            value={tagA}
            onChange={(e) => setTagA(e.target.value)}
          />
          <TextField
            label="Tag B"
            size="small"
            value={tagB}
            onChange={(e) => setTagB(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={loading}
            sx={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Running..." : "Run Query 1"}
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

        {!error && !loading && users.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No users found yet. Run the query above.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}


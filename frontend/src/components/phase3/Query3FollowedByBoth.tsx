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
import { fetchQuery3FollowedByBoth, Query3User } from "../../api/blog";


export default function Query3FollowedByBoth() {
  const [userX, setUserX] = useState("");
  const [userY, setUserY] = useState("");
  const [users, setUsers] = useState<Query3User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastPair, setLastPair] = useState<{ x: string; y: string } | null>(
    null
  );

  const handleRun = async () => {
    setError(null);
    setUsers([]);

    const x = userX.trim();
    const y = userY.trim();

    if (!x || !y) {
      setError("Both User X and User Y are required.");
      return;
    }

    setLoading(true);
    const { users, error, userX: usedX, userY: usedY } =
      await fetchQuery3FollowedByBoth(x, y);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setUsers(users);
      setLastPair({ x: usedX, y: usedY });
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Query 3 – Users Followed by Both X and Y
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter two usernames. This query returns the users who are followed by
          both of them.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2, flexWrap: "wrap" }}>
          <TextField
            label="User X"
            size="small"
            value={userX}
            onChange={(e) => setUserX(e.target.value)}
          />
          <TextField
            label="User Y"
            size="small"
            value={userY}
            onChange={(e) => setUserY(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={loading}
            sx={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Running..." : "Run Query 3"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {lastPair && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Users followed by <strong>{lastPair.x}</strong> and{" "}
            <strong>{lastPair.y}</strong>:
          </Typography>
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

        {!error && !loading && users.length === 0 && lastPair && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No users found that are followed by both {lastPair.x} and{" "}
            {lastPair.y}.
          </Typography>
        )}

        {!lastPair && !error && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Run the query to see results.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

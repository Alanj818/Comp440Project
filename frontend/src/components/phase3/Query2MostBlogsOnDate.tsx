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
import { fetchQuery2MostBlogsOnDate, Query2User } from "../../api/blog";

export default function Query2MostBlogsOnDate() {
  const [dateInput, setDateInput] = useState(""); 
  const [usedDate, setUsedDate] = useState<string | null>(null);
  const [users, setUsers] = useState<Query2User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setError(null);
    setUsers([]);
    setUsedDate(null);

    // date is technically optional:
    if (!dateInput.trim()) {
      setError("Please choose a date.");
      return;
    }

    setLoading(true);
    const { users, date, error } = await fetchQuery2MostBlogsOnDate(dateInput);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setUsers(users);
      setUsedDate(date);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Query 2 – Most Blogs on a Specific Date
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          List the user(s) who posted the most blogs on the chosen date. If
          there is a tie, all tied users are shown.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2, flexWrap: "wrap" }}>
          <TextField
            label="Date"
            type="date"
            size="small"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={loading}
            sx={{ whiteSpace: "nowrap" }}
          >
            {loading ? "Running..." : "Run Query 2"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {usedDate && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Results for date: <strong>{usedDate}</strong>
          </Typography>
        )}

        {users.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Blogs on Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.username}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.firstname}</TableCell>
                  <TableCell>{u.lastname}</TableCell>
                  <TableCell>{u.blog_count}</TableCell>
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

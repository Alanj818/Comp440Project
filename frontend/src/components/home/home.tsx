import React, { useState, useEffect } from 'react';
import './home.css'
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function HomeComponent() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`${API_URL}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        // Clear username from localStorage
        localStorage.removeItem("username");
        setUsername(null);
        
        // Redirect to home (refresh the page)
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="home-container">
      <Typography variant="h2" fontWeight="bold">
        Home Page
      </Typography>

      {username ? (
        // Show when user is logged in
        <>
          <Typography variant="h6" color="primary">
            Welcome, {username}!
          </Typography>

          <Button 
            variant="text" 
            color="primary" 
            onClick={() => navigate('/blog/create')}
          >
            Create Blog
          </Button>

          <Button 
            variant="text" 
            color="primary" 
            onClick={() => navigate('/blog/search')}
          >
            Search Blogs
          </Button>

          <Button 
            variant="text" 
            color="error" 
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? "Logging out..." : "Logout"}
          </Button>
        </>
      ) : (
        // Show when user is not logged in
        <>
          <Button 
            variant="text" 
            color="primary" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>

          <Button 
            variant="text" 
            color="primary" 
            onClick={() => navigate('/register')}
          >
            Go to Register
          </Button>

          <Button 
            variant="text" 
            color="secondary" 
            onClick={() => navigate('/blog/search')}
          >
            Browse Blogs
          </Button>
        </>
      )}
    </Box>
  );
}
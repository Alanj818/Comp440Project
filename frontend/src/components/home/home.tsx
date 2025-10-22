import React from 'react';
import './home.css'
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function HomeComponent() {
  const navigate = useNavigate();

  return (
    <Box className="home-container" >
      <Typography variant="h2" fontWeight="bold">
        Home Page
      </Typography>
 
        <Button variant="text" color="primary"  onClick={() => navigate('/login')}>
          Go to Login
        </Button>

        <Button variant="text" color="primary" onClick={() => navigate('/register')}>
          Go to Register
        </Button>
    </Box>
  );
}


import React, { useState } from 'react';
import './login.css';
import { Typography, TextField, Button, Box } from '@mui/material';

export default function LoginComponent() {
    const[username, setUserName] = useState();
    const[password, setPassWord] = useState();


    return (
      <Box className="login-container">

        <Typography variant='h5'>
            Login
        </Typography>  

        <TextField 
            id="outlined-basic" 
            label="Username" 
            variant="outlined" 
        />

        <TextField 
            id="outlined-basic" 
            label="Password" 
            variant="outlined" 
        />

        <Button 
            variant='text' >
            Submit
        </Button>

      </Box>
    );
}
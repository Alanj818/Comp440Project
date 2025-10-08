import React from 'react';
import './register.css';
import { Box, Button, TextField, Typography } from '@mui/material';

export default function RegisterComponent() {
    return (
        <Box className="register-container">

            <Typography variant='h5'>
                Register
            </Typography>

            <TextField
                id="outlined-basic"
                label="Username"
                variant="outlined"
            />

            <TextField
                id="outlined-basic"
                label="Email"
                variant="outlined"
            />

            <TextField
                id="outlined-basic"
                label="Password"
                variant="outlined"
            />

            <TextField
                id="outlined-basic"
                label="Confirm Password"
                variant="outlined"
            />

            <Button
                variant='text' >
                Submit
            </Button>

        </Box>
    );
}
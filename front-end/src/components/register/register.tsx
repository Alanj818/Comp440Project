import React from 'react';
import axios from 'axios';
import './register.css';
import { Box, Button, TextField, Typography } from '@mui/material';

export default function RegisterComponent() {

    const handleRegistration = async () => {
        
    }

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
                onClick={handleRegistration} //send data over to db
                variant='contained' >
                Submit
            </Button>

        </Box>
    );
}
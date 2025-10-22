import React, { ChangeEvent, FormEvent, useState } from 'react';
import './login.css';
import { Typography, TextField, Button, Box } from '@mui/material';
import { loginUser } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

export default function LoginComponent() {
    const[username, setUserName] = useState('');
    const[password, setPassWord] = useState('');
    const[loading, setLoading] = useState(false);
    const[success, setSuccess] = useState("");
    const[error, setError] = useState("");
    const navigate = useNavigate();

    const handleUserChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value); //sets username
    }

    const handlePassChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassWord(e.target.value); //sets password
    }

    const handleRedirect = () => {
        try{
            setLoading(true); 
            navigate("/register");
        } catch(err: any){
            setError(err.message || "Redirect Failed.");
        } finally{
            setLoading(false);
        }
    } 

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        //implementation of Login
        setError("");
        setSuccess("");

        //making sure password meets criteria
        if(password.length < 6 ) {return setError("Password must be at least 6 characters."), alert("Password must be at least 6 characters")}

        //now that it does, call auth
        try {
            setLoading(true);
            const res = await loginUser(username, password);
            if(res.error) {throw new Error(res.error)}
        } catch (err: any) {
            setError(err.message || "Login Failed.");
        } finally{
            setLoading(false);
            setSuccess("Login Successful!");
        }
    }

    return (
      <Box className="login-container" component="form" onSubmit={handleSubmit}>
        <Typography variant='h5'>
            Login
        </Typography>  

        <TextField 
            id="outlined-basic" 
            label="Username" 
            name='username'
            value={username}
            autoComplete='username'
            onChange={handleUserChange}
            variant="outlined" 
            required
        />

        <TextField 
            id="outlined-basic" 
            label="Password" 
            name='password'
            type= 'password'
            value={password}
            autoCapitalize='password'
            onChange={handlePassChange}
            variant="outlined" 
            required
        />


        {error && (
        <Typography color="error" textAlign="center">
          {error}
        </Typography>
        )}
        {success && (
        <Typography color="primary" textAlign="center">
          {success}
        </Typography>
        )}
         <Button type="submit" variant="text" disabled={loading} sx={{ mt: 1 }}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
        <Button
            variant='text'
            onClick={handleRedirect}
            >
                No Account? Register here!
            </Button>

      </Box>
    );
}
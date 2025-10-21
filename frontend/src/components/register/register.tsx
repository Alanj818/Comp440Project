import React, { useState, ChangeEvent, FormEvent } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { registerUser } from "../../api/auth";
import "./register.css";
import { useNavigate } from "react-router-dom";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRedirect = () => {
    try{
      setLoading(true); 
      navigate("/login");
    } catch(err: any){
      setError(err.message || "Error Redirecting");
    } finally {
      setLoading(false); 
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    
    const emailOk = /\S+@\S+\.\S+/.test(form.email);
    const phoneOk = /^[0-9+\-\s()]{7,}$/.test(form.phone);
    if (!emailOk) return setError("Please enter a valid email.");
    if (!phoneOk) return setError("Please enter a valid phone.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
    };

    try {
      setLoading(true);
      const res = await registerUser(payload);
      if (res.error) throw new Error(res.error);

      setSuccess("Registration successful!");

      setForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="register-container" component="form" onSubmit={handleSubmit}>
      <Typography variant="h5">Register</Typography>

      <TextField
        label="First Name"
        name="firstName"
        variant="outlined"
        value={form.firstName}
        onChange={handleChange}
        autoComplete="given-name"
        required
      />

      <TextField
        label="Last Name"
        name="lastName"
        variant="outlined"
        value={form.lastName}
        onChange={handleChange}
        autoComplete="family-name"
        required
      />

      <TextField
        label="Phone"
        name="phone"
        variant="outlined"
        value={form.phone}
        onChange={handleChange}
        inputMode="tel"
        autoComplete="tel"
        required
      />

      <TextField
        label="Username"
        name="username"
        variant="outlined"
        value={form.username}
        onChange={handleChange}
        autoComplete="username"
        required
      />

      <TextField
        label="Email"
        name="email"
        variant="outlined"
        value={form.email}
        onChange={handleChange}
        type="email"
        autoComplete="email"
        required
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        variant="outlined"
        value={form.password}
        onChange={handleChange}
        autoComplete="new-password"
        required
      />

      <TextField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        variant="outlined"
        value={form.confirmPassword}
        onChange={handleChange}
        autoComplete="new-password"
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

      <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 1 }}>
        {loading ? "Submitting..." : "Submit"}
      </Button>
      <Button variant="text" onClick={handleRedirect}>
        Already have an account? Login here!
      </Button>
    </Box>
  );
}

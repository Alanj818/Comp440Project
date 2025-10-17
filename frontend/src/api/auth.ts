const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export type RegisterPayload = {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
};

export async function registerUser(payload: RegisterPayload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Registration failed");
  return data;
}

/**
 * Logs in a user
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} 
 */
export async function loginUser(username: string, password: any) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Login failed");

    localStorage.setItem("username", username);

    return data; 
  } catch (err: any) {
    console.error("Login error:", err);
    return { error: err.message || "Network error" };
  }
}
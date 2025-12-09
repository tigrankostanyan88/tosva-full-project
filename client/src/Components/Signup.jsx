import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../Styles/LoginRegister.css";
import { useNotify } from "./Notify";

export default function Signup() {
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();

  // Read invite code from URL
  const queryParams = new URLSearchParams(location.search);
  const refFromUrl = queryParams.get("ref") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [refCode, setRefCode] = useState(refFromUrl);
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (refFromUrl) {
      setRefCode(refFromUrl);
    }
  }, [refFromUrl]);

  // ---------------- REGISTER ----------------
  const handleRegister = async () => {
    try {
      const nextErrors = { name: "", email: "", password: "" };
      if (!name.trim()) nextErrors.name = "Name is required";
      const emailTrim = email.trim();
      if (!emailTrim) nextErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) nextErrors.email = "Email format is invalid";
      if (!password) nextErrors.password = "Password is required";
      else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
      setErrors(nextErrors);
      if (nextErrors.name || nextErrors.email || nextErrors.password) {
        notify && notify.error("Please fix the highlighted fields");
        return;
      }

      // FIRST: Register user
      await axios.post(
        "/api/v1/auth/register",
        {
          name,
          email,
          password,
          invite_code: refCode,
        },
        { withCredentials: true }
      );

      try {
        await axios.get('/api/v1/users/profile', { withCredentials: true });
        notify && notify.success("Registration successful");
        window.dispatchEvent(new Event('auth:refresh'));
        navigate("/");
        return;
      } catch {}

      await axios.post(
        "/api/v1/auth/login",
        { email, password },
        { withCredentials: true }
      );
      notify && notify.success("Logged in");
      window.dispatchEvent(new Event('auth:refresh'));
      navigate("/");

    } catch (err) {
      const msg = err.response?.data?.message || "Server error";
      notify && notify.error(msg);
    }
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <h2 className="authTitle">Register</h2>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`authInput${errors.name ? ' invalid' : ''}`}
          aria-invalid={!!errors.name}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`authInput${errors.email ? ' invalid' : ''}`}
          aria-invalid={!!errors.email}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`authInput${errors.password ? ' invalid' : ''}`}
          aria-invalid={!!errors.password}
        />

        <input
          type="text"
          placeholder="Invite Code"
          value={refCode}
          onChange={(e) => setRefCode(e.target.value)}
          className="authInput"
        />

        <button onClick={handleRegister} className="authButton">
          Register
        </button>

        <p className="authSwitch">
          Already have an account?{" "}
          <span onClick={() => navigate("/Signin")}>Login</span>
        </p>
      </div>
    </div>
  );
}

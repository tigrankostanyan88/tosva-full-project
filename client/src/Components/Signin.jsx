import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/LoginRegister.css"; 
import { useNotify } from "./Notify";

export default function Signin() {
  axios.defaults.withCredentials = true;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const notify = useNotify();
  const [errors, setErrors] = useState({ email: "", password: "" });

  const handleSignin = async () => {
    try {
      const nextErrors = { email: "", password: "" };
      const emailTrim = email.trim();
      if (!emailTrim) nextErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) nextErrors.email = "Email format is invalid";
      if (!password) nextErrors.password = "Password is required";
      setErrors(nextErrors);
      if (nextErrors.email || nextErrors.password) {
        notify && notify.error("Please fix the highlighted fields");
        return;
      }
      await axios.post(
        "/api/v1/auth/login",
        { email, password },
        { withCredentials: true }
      );
      notify && notify.success("Logged in");
      window.dispatchEvent(new Event('auth:refresh'));
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Server error";
      notify && notify.error(msg);
    }
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <h2 className="authTitle">Sign In</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={`authInput${errors.email ? ' invalid' : ''}`}
          aria-invalid={!!errors.email}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={`authInput${errors.password ? ' invalid' : ''}`}
          aria-invalid={!!errors.password}
        />
        <button onClick={handleSignin} className="authButton">Sign In</button>
        <p className="authSwitch">
          Don't have an account? <span onClick={() => navigate("/Signup")}>Register</span>
        </p>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/LoginRegister.css"; 

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignin = async () => {
    try {
      const res = await axios.post("/api/v1/auth/login", { email, password });
      const { user, token } = res.data;
      if (!token) throw new Error("Token not returned by server");

      localStorage.setItem("jwt", token);        // JWT token-ը պահվում է
      localStorage.setItem("user", JSON.stringify(user)); // User info

      navigate("/"); // լոգին հաջող է
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Server error");
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
          className="authInput"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="authInput"
        />
        <button onClick={handleSignin} className="authButton">Sign In</button>
        {error && <p className="authError">{error}</p>}
        <p className="authSwitch">
          Don't have an account? <span onClick={() => navigate("/Signup")}>Register</span>
        </p>
      </div>
    </div>
  );
}

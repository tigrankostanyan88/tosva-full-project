import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../Styles/LoginRegister.css";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read invite code from URL
  const queryParams = new URLSearchParams(location.search);
  const refFromUrl = queryParams.get("ref") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [refCode, setRefCode] = useState(refFromUrl);
  const [error, setError] = useState("");

  useEffect(() => {
    if (refFromUrl) {
      setRefCode(refFromUrl);
    }
  }, [refFromUrl]);

  // ---------------- REGISTER ----------------
  const handleRegister = async () => {
    try {
      setError("");

      // FIRST: Register user
      await axios.post("/api/v1/auth/register", {
        name,
        email,
        password,
        referrer: refCode,
      });

      // SECOND: Auto-login
      const loginRes = await axios.post("/api/v1/auth/login", {
        email,
        password,
      });

      const { user, token } = loginRes.data;

      localStorage.setItem("jwt", token);
      localStorage.setItem("user", JSON.stringify(user));

      // HARD REDIRECT (100% working)
      window.location.href = "/";

    } catch (err) {
      setError(err.response?.data?.message || "Server error");
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
          className="authInput"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="authInput"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="authInput"
        />

        <input
          type="text"
          placeholder="Invite Code"
          value={refCode}
          readOnly
          className="authInput"
        />

        <button onClick={handleRegister} className="authButton">
          Register
        </button>

        {error && <p className="authError">{error}</p>}

        <p className="authSwitch">
          Already have an account?{" "}
          <span onClick={() => navigate("/Signin")}>Login</span>
        </p>
      </div>
    </div>
  );
}

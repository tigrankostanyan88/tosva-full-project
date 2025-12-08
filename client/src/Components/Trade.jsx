import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/Trade.css";

export default function Trade() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userW, setUserW] = useState([]);

  const [currentCode, setCurrentCode] = useState(null);
  const [slotsInput, setSlotsInput] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const [tradeCode, setTradeCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user profile
  useEffect(() => {
    async function loadUser() {
      try {
        const resp = await axios.get("/api/v1/users/profile");
        setUser(resp.data.user);
      } catch (err) {
        console.error("USER LOAD ERROR:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();
  }, []);

  // Fetch slots only for admin
  useEffect(() => {
    if (user?.role !== "admin") return;

    async function loadSlots() {
      try {
        const resp = await axios.get("/api/v1/admin/code/slots", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const slotsArray = Array.isArray(resp.data.slots)
          ? resp.data.slots.map((slot) =>
              typeof slot === "object" && slot.code ? slot.code : slot
            )
          : [];

        setUserW(slotsArray);
      } catch (err) {
        console.error("SLOTS LOAD ERROR:", err);
      }
    }

    loadSlots();
  }, [user]);

  // Load current code for admin
  async function loadCurrentCode() {
    try {
      const resp = await axios.get("/api/v1/admin/code/current", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setCurrentCode(
        resp.data.current_code?.code || resp.data.current_code || null
      );
    } catch (err) {
      console.error("ADMIN CURRENT CODE ERROR:", err);
    }
  }

  async function submitSlots() {
    try {
      const slotsArray = slotsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        slots: slotsArray,
        tzOffsetMinutes: "240", // UTC+4
      };

      const resp = await axios.post("/api/v1/admin/code/slots", payload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (resp.data.status === "success") {
        setAdminMessage("Slots updated successfully");
        setUserW(slotsArray);
      } else {
        setAdminMessage("Failed to update slots");
      }
    } catch (err) {
      console.error("ADMIN SLOT ERROR:", err);
      setAdminMessage("Error updating slots");
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadCurrentCode();
    }
  }, [user]);

  if (loadingUser) {
    return <div className="loadingScreen">Loading...</div>;
  }

  // Admin panel
  if (user?.role === "admin") {
    return (
      <div className="adminPage" style={{ padding: "20px" }}>
        <h1 style={{ color: "white" }}>Admin Control Panel</h1>

        <div style={{ marginTop: "20px", color: "white" }}>
          <h3>Current Code:</h3>
          <div
            style={{
              background: "#222",
              padding: "10px 15px",
              borderRadius: "10px",
              display: "inline-block",
              fontSize: "20px",
              marginTop: "5px",
            }}
          >
            {currentCode || "No active code"}
          </div>
        </div>

        <button
          onClick={loadCurrentCode}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: "#444",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Refresh Code
        </button>

        <div style={{ marginTop: "40px", color: "white" }}>
          <h3>Set Slots (comma separated)</h3>
          <input
            style={{
              width: "300px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #666",
              background: "#111",
              color: "white",
            }}
            placeholder="17:30, 13:00, 15:00"
            value={slotsInput}
            onChange={(e) => setSlotsInput(e.target.value)}
          />
        </div>

        <button
          onClick={submitSlots}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: "#1e90ff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Submit Slots
        </button>

        {adminMessage && (
          <div
            style={{
              marginTop: "20px",
              color: "lightgreen",
              fontSize: "18px",
            }}
          >
            {adminMessage}
          </div>
        )}

        {userW.length > 0 && (
          <div style={{ marginTop: "20px", color: "white" }}>
            <h4>Current Slots:</h4>
            <ul>
              {userW.map((slot, idx) => (
                <li key={idx}>{slot}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // User panel
  async function handleSubmit() {
  if (!tradeCode.trim()) {
    setMessage("Please enter the code");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    const { data } = await axios.post("/api/v1/code/submit", {
      code: tradeCode.trim(),
    });

    const msg =
      data?.message ||
      (data?.success ? "Transaction successful" : "Invalid code");

    setMessage(msg);

  } catch (err) {
    console.error("ERROR", err);

    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Invalid code";

    setMessage(errMsg);

  } finally {
    setLoading(false);
  }
}

  return (
    <div className="container">
      <div className="heroImage"></div>

      <main className="mainCard">
        <h2 className="cardTitle">CryptoTracker Trade</h2>

        <div className="formGroup">
          <label className="label">Trade Code</label>
          <input
            className="tradeCodeInput"
            placeholder="Enter the code"
            value={tradeCode}
            onChange={(e) => {
              setTradeCode(e.target.value.toUpperCase());
              setMessage("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="formGroup">
          <label className="label">Quantity</label>
          <input className="qtyInput" value={1} readOnly disabled />
          <div className="smallNote">Quantity is fixed</div>
        </div>

        <div className="selectedCard">
          <div className="selectedLeft">
            <div className="smallLabel">Selected</div>
            <div className="selectedName">—</div>
          </div>

          <div className="selectedRight">
            <div className="smallLabel">Price</div>
            <div className="selectedPrice">—</div>
          </div>
        </div>

        <div className="actionsRow">
          <button
            onClick={handleSubmit}
            className="confirmButton"
            disabled={loading}
          >
            {loading ? "Sending..." : "Submit"}
          </button>
        </div>

        {message && <div className="feedbackMessage">{message}</div>}
      </main>
    </div>
  );
}

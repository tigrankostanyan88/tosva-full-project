import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "../Styles/Trade.css";
import { useNotify } from "./Notify";

export default function Trade() {
  const notify = useNotify();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userW, setUserW] = useState([]);
  const [serverSlots, setServerSlots] = useState([]);

  const [currentCode, setCurrentCode] = useState(null);
  const [slot1, setSlot1] = useState("");
  const [slot2, setSlot2] = useState("");
  const [slot3, setSlot3] = useState("");

  const [tradeCode, setTradeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const saveTimer = useRef(null);
  const [tzOffset, setTzOffset] = useState(null);
  const lastSavedRef = useRef(null);
  const suppressAutoSaveRef = useRef(false);

  // Fetch user profile
  useEffect(() => {
    async function loadUser() {
      try {
        const resp = await axios.get("/api/v1/users/profile");
        setUser(resp.data.user);
      } catch (err) {
        console.error("USER LOAD ERROR:", err);
        if (notify) notify.error("Failed to load profile");
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadSlots(true);
  }, [user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadTimezone(true);
  }, [user]);

  async function loadSlots(silent = false) {
    try {
      suppressAutoSaveRef.current = true;
      const resp = await axios.get("/api/v1/admin/code/slots");
      const slotsArray = Array.isArray(resp.data.slots)
        ? resp.data.slots.map((slot) =>
            typeof slot === "object" && slot.code ? slot.code : slot
          )
        : [];
      setServerSlots(slotsArray);
      const v = Number(tzOffset);
      const toLocal = (hhmm, offset) => {
        const hh = Number(hhmm.slice(0,2));
        const mm = Number(hhmm.slice(3,5));
        const total = hh * 60 + mm;
        let loc = (total + offset) % 1440;
        if (loc < 0) loc += 1440;
        const lh = String(Math.floor(loc / 60)).padStart(2, '0');
        const lm = String(loc % 60).padStart(2, '0');
        return `${lh}:${lm}`;
      };
      const display = Number.isFinite(v) ? slotsArray.map(s => toLocal(s, Math.trunc(v))) : slotsArray;
      setUserW(display);
      setSlot1(display[0] || "");
      setSlot2(display[1] || "");
      setSlot3(display[2] || "");
      const sig = [...slotsArray].map((s) => String(s)).sort().join("|");
      lastSavedRef.current = sig;
      setTimeout(() => { suppressAutoSaveRef.current = false; }, 800);
      if (!silent && notify) notify.info("Slots refreshed");
    } catch (err) {
      console.error("SLOTS LOAD ERROR:", err);
      if (!silent && notify) notify.error("Failed to load slots");
    }
  }

  // Load current code for admin
  async function loadCurrentCode(silent = false) {
    try {
      const resp = await axios.get("/api/v1/admin/code/current");
      const data = resp.data.current_code;
      const next = (data && data.code) ? data.code : (data || null);
      setCurrentCode(next);
    } catch (err) {
      console.error("ADMIN CURRENT CODE ERROR:", err);
      if (!silent && notify) notify.error("Failed to load current code");
    }
  }

  async function copyCode() {
    if (!currentCode) {
      if (notify) notify.info("No code yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(String(currentCode));
      if (notify) notify.success("Code copied");
    } catch (e) {
      if (notify) notify.error("Copy failed");
    }
  }

  async function loadTimezone(silent = false) {
    try {
      const resp = await axios.get("/api/v1/admin/code/timezone");
      const v = Number(resp.data?.timezone_offset_minutes);
      if (Number.isFinite(v)) setTzOffset(Math.trunc(v));
      if (!silent && notify) notify.info("Timezone loaded");
    } catch (err) {
      if (!silent && notify) notify.error("Failed to load timezone");
    }
  }

  async function saveTimezone() {
    try {
      const v = Number(tzOffset);
      if (!Number.isFinite(v)) {
        if (notify) notify.error("Enter valid minutes");
        return;
      }
      const resp = await axios.post("/api/v1/admin/code/timezone", { timezone_offset_minutes: Math.trunc(v) });
      const ok = resp.data?.status === "success";
      if (notify) {
        if (ok) notify.success("Timezone updated");
        else notify.error("Failed to update timezone");
      }
    } catch (err) {
      if (notify) notify.error("Failed to update timezone");
    }
  }

  const tzOptions = useMemo(() => {
    const fmt = (min) => {
      const sign = min >= 0 ? "+" : "-";
      const abs = Math.abs(min);
      const h = String(Math.floor(abs / 60));
      const m = String(abs % 60).padStart(2, "0");
      return `UTC${sign}${h}${m !== "00" ? ":"+m : ""}`;
    };
    const out = [];
    for (let m = -720; m <= 840; m += 15) {
      out.push({ value: m, label: fmt(m) });
    }
    return out;
  }, []);


  function validateHHMM(val) {
    return /^\d{2}:\d{2}$/.test(val) && Number(val.slice(0,2)) < 24 && Number(val.slice(3,5)) < 60;
  }

  async function submitSlots() {
    try {
      const toHHMM = (s) => {
        const parts = String(s || '').trim().split(':');
        const hh = String(parts[0] || '').padStart(2, '0');
        const mm = String(parts[1] || '').padStart(2, '0');
        return `${hh}:${mm}`;
      };
      const toMinutes = (hhmm) => Number(hhmm.slice(0,2)) * 60 + Number(hhmm.slice(3,5));
      const slotsArray = [slot1, slot2, slot3].map(toHHMM);
      const allPresent = slotsArray.every((s) => !!s);
      const allValid = slotsArray.every((s) => validateHHMM(s));
      if (!allPresent || !allValid) {
        if (notify) notify.error("Please select three valid times (HH:MM)");
        return;
      }

      const uniq = Array.from(new Set(slotsArray));
      if (uniq.length !== 3) {
        if (notify) notify.error("Slots must be different");
        return;
      }
      const sorted = uniq.sort((a, b) => toMinutes(a) - toMinutes(b));
      const tzVal = Number(tzOffset);
      const payload = Number.isFinite(tzVal)
        ? { slots: sorted, tzOffsetMinutes: Math.trunc(tzVal) }
        : { slots: sorted };

      const resp = await axios.post("/api/v1/admin/code/slots", payload);

      if (resp.data.status === "success") {
        setUserW(sorted);
        if (notify) notify.success("Slots updated successfully");
        const sig = [...sorted].map((s) => String(s)).sort().join("|");
        lastSavedRef.current = sig;
        suppressAutoSaveRef.current = true;
        setTimeout(() => { suppressAutoSaveRef.current = false; }, 800);
      } else {
        const msg = resp.data?.message || "Failed to update slots";
        if (notify) notify.error(msg);
      }
    } catch (err) {
      console.error("ADMIN SLOT ERROR:", err);
      const msg = err.response?.data?.message || err.message || "Error updating slots";
      if (notify) notify.error(msg);
    }
  }

  // Auto-save slots with debounce when all three are valid
  useEffect(() => {
    if (user?.role !== "admin") return;
    const slotsArray = [slot1, slot2, slot3];
    const allPresent = slotsArray.every((s) => !!s);
    const allValid = slotsArray.every((s) => validateHHMM(s));
    if (!allPresent || !allValid) return;
    if (suppressAutoSaveRef.current) return;
    const sig = [...slotsArray].map((s) => String(s)).sort().join("|");
    if (lastSavedRef.current === sig) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      submitSlots();
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [slot1, slot2, slot3, user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (!serverSlots || serverSlots.length === 0) return;
    const v = Number(tzOffset);
    suppressAutoSaveRef.current = true;
    const toLocal = (hhmm, offset) => {
      const hh = Number(hhmm.slice(0,2));
      const mm = Number(hhmm.slice(3,5));
      const total = hh * 60 + mm;
      let loc = (total + offset) % 1440;
      if (loc < 0) loc += 1440;
      const lh = String(Math.floor(loc / 60)).padStart(2, '0');
      const lm = String(loc % 60).padStart(2, '0');
      return `${lh}:${lm}`;
    };
    const display = Number.isFinite(v) ? serverSlots.map(s => toLocal(s, Math.trunc(v))) : serverSlots;
    setUserW(display);
    setSlot1(display[0] || "");
    setSlot2(display[1] || "");
    setSlot3(display[2] || "");
    setTimeout(() => { suppressAutoSaveRef.current = false; }, 800);
  }, [tzOffset]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadCurrentCode(true);
    }
  }, [user]);

  if (loadingUser) {
    return <div className="loadingScreen">Loading...</div>;
  }

  // Admin panel
  if (user?.role === "admin") {
    return (
      <div className="adminPage">
        <h1 className="adminTitle">Admin Control Panel</h1>
        <div className="adminBlock">
          <h3 className="adminSub">Current Code</h3>
          <div className="codeRow">
            <div className={"codeBox" + (!currentCode ? " codeEmpty" : "")}>{currentCode || "No active code"}</div>
            <div className="codeActions">
              <button onClick={() => loadCurrentCode(false)} className="btn refreshBtn" aria-label="Refresh code">
                <i className="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
              </button>
              <button onClick={copyCode} className="btn refreshBtn" disabled={!currentCode} aria-label="Copy current code">
                <svg className="btnIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Code
              </button>
            </div>
          </div>
        </div>
        <div className="adminBlock">
          <h3 className="adminSub">Set Daily Slots</h3>
          <div className="timeRow">
            <div className="timeCol">
              <label className="label">Slot 1</label>
              <input type="time" className="timeInput" value={slot1} onChange={(e) => setSlot1(e.target.value)} step="60" />
            </div>
            <div className="timeCol">
              <label className="label">Slot 2</label>
              <input type="time" className="timeInput" value={slot2} onChange={(e) => setSlot2(e.target.value)} step="60" />
            </div>
            <div className="timeCol">
              <label className="label">Slot 3</label>
              <input type="time" className="timeInput" value={slot3} onChange={(e) => setSlot3(e.target.value)} step="60" />
            </div>
          </div>
          <div className="tzRow">
            <span className="tzBadge">Timezone: {(() => {
              const v = Number(tzOffset);
              if (!Number.isFinite(v)) return "unknown";
              const sign = v >= 0 ? "+" : "-";
              const ah = String(Math.floor(Math.abs(v) / 60)).padStart(1, "");
              const am = String(Math.abs(v) % 60).padStart(2, "0");
              return `UTC${sign}${ah}${am !== "00" ? ":"+am : ""}`;
            })()}</span>
          </div>
          <div className="timeRow">
            <div className="timeCol">
              <label className="label">Timezone</label>
              <select className="selectInput" value={tzOffset ?? ""} onChange={(e) => setTzOffset(Number(e.target.value))}>
                <option value="" disabled>Select timezone</option>
                {tzOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="timeCol">
              <label className="label">Actions</label>
              <div className="codeActions">
                <button onClick={() => loadTimezone(false)} className="btn refreshBtn" aria-label="Load timezone">
                  <i className="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
                </button>
                <button onClick={saveTimezone} className="btn submitBtn">Save Timezone</button>
              </div>
            </div>
          </div>
          <button onClick={submitSlots} className="btn submitBtn">Submit Slots</button>
        </div>
        {userW.length > 0 && (
          <div className="adminBlock">
            <h4 className="adminSub">Current Slots</h4>
            <ul className="slotsList">
              {userW.map((slot, idx) => (
                <li key={idx} className="slotItem">{slot}</li>
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
    if (notify) notify.error("Please enter the code");
    return;
  }

  setLoading(true);
  if (notify) notify.info("Submitting code...");

  try {
    const { data } = await axios.post("/api/v1/code/submit", {
      code: tradeCode.trim(),
    });

    const msg = data?.message || (data?.success ? "Transaction successful" : "Invalid code");
    if (notify) {
      if (data?.success) notify.success(msg);
      else notify.error(msg);
    }
    if (data?.success) setTradeCode("");

  } catch (err) {
    console.error("ERROR", err);

    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Invalid code";

    if (notify) notify.error(errMsg);

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

        {/* notifications are shown via NotifyProvider; inline message removed */}
      </main>
    </div>
  );
}

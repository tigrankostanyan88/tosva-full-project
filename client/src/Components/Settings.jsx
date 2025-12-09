import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../Styles/Settings.css";
import axios from "axios";

export default function Settings() {
  
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [language, setLanguage] = useState(i18n.language || localStorage.getItem("appLanguage") || "en");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const token = localStorage.getItem("jwt");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const logoutUser = async () => {
    try {
      await axios.post(
        "/api/v1/users/logout",
        {},
        { headers }
      );
    } catch (err) {
      console.warn("Logout API failed, proceeding with local logout.");
    }
    localStorage.removeItem("jwt");
    sessionStorage.clear();
    navigate("/Signin", { replace: true });
  };

  useEffect(() => {
    if (language) {
      localStorage.setItem("appLanguage", language);
    }
  }, [language]);

  const openModal = (title, content) => setModal({ title, content });
  const closeModal = () => setModal(null);

  // ---------------- WITHDRAW (TRC20) ----------------
  const handleWithdraw = () => {
    setForm({ amount: "", toAddress: ""});

    openModal(
      t("WithdrawTRC20"),
      <div className="modalContent">
        <label className="field">
          {t("Amount")}
          <input
            type="number"
            min="1"
            step="0.01"
            value={form.amount}
            onChange={(e) => {
  const value = e.target.value;
  setForm({ ...form, amount: value });
}}
            placeholder={t("EnterAmount")}
          />
        </label>

        <label className="field">
          {t("TRC20Address")}
          <input
            type="text"
            value={form.toAddress}
            onChange={(e) => {
  const valuel = e.target.value;
  setForm({ ...form, amount: valuel });
            }}
            placeholder={t("EnterAddress")}
          />
        </label>

        <div className="modalActions">
          <button
            className="btnPrimary"
            onClick={async () => {
              const amountNum = parseFloat(form.amount);

              if (!form.amount || !form.toAddress)
                return alert(t("FillAllFields"));

              try {
                const res = await axios.post(
                  "/api/v1/wallet/withdraw",
                  { amount: amountNum, to_address: form.toAddress },
                  { headers }
                );
                alert(t("WithdrawalSubmitted"));
                closeModal();
              } catch (err) {
                alert(t("WithdrawalFailed"));
              }
            }}
          >
            {t("Submit")}
          </button>
        </div>
      </div>
    );
  };

  // ---------------- Language ----------------
  const handleLanguageSwitch = () => {
    openModal(
      t("LanguageSwitch"),
      <div className="modalContent">
        <div className="langOptions">
            {[
            { code: "en", label: "English" },
            { code: "ru", label: "Русский" },
            { code: "fr", label: "Français" },
            { code: "ch", label: "Schwiizerdütsch" }
          ].map((lang) => (
            <button
              key={lang.code}
              className="btnGhost"
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setLanguage(lang.code);
                localStorage.setItem("appLanguage", lang.code);
                closeModal(); 
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ---------------- Complaints ----------------
  const handleComplaints = () => {
    setForm({ message: "" });
    openModal(
      t("ComplaintsAndSuggestions"),
      <div className="modalContent">
        <textarea
          rows="5"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={t("YourMessage")}
        />
        <div className="modalActions">
          <button
            className="btnPrimary"
            onClick={() => {
              if (!form.message) return alert(t("WriteAMessage"));
              alert("Sent");
              closeModal();
            }}
          >
            {t("Submit")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="settingsPage">
      <header className="settingsHeader">
        <button className="backButton" onClick={() => navigate("/assets")}>‹</button>
        <div className="headerTitle">{t("Settings")}</div>
        <div style={{ width: 1 }} />
      </header>

      <main className="settingsContent">

        <section className="settingsSection">
          <div className="sectionTitle">{t("FinancialManagement")}</div>
          <button className="listItem" onClick={handleWithdraw}>
            <span>{t("WithdrawTRC20")}</span>
          </button>
        </section>

        <section className="settingsSection">
          <div className="sectionTitle">{t("SystemHelp")}</div>

          <button className="listItem" onClick={handleLanguageSwitch}>
            <span>{t("LanguageSwitch")}</span>
            <span className="hintText">{language}</span>
          </button>

          <button className="listItem" onClick={handleComplaints}>
            <span>{t("ComplaintsAndSuggestions")}</span>
          </button>

          <button className="listItem" onClick={logoutUser}>
            <span style={{ color: "red" }}>Logout</span>
          </button>

        </section>

      </main>

      {modal && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <span>{modal.title}</span>
              <button className="closeBtn" onClick={closeModal}>×</button>
            </div>
            <div className="modalBody">{modal.content}</div>
          </div>
        </div>
      )}

    </div>
  );
}

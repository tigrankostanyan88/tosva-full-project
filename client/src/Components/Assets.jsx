import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../Styles/Assets.css";

const Assets = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositStep, setDepositStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState(500);
  const [depositData, setDepositData] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);

  const [showUniqueTagModal, setShowUniqueTagModal] = useState(false);
  const [uniqueTag, setUniqueTag] = useState("");

  const [error, setError] = useState(null);

  const token = localStorage.getItem("jwt");
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const formatMoney = (value) =>
    Number(value).toLocaleString("en-US", { minimumFractionDigits: 4 });

  const toggleBalanceVisibility = () => setIsHidden(p => !p);

  const safeCopyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 1500);
    });
  }, []);

  // ---------------- API: FETCH PROFILE ----------------
  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/v1/users/profile", { headers });
      setUser(res.data.user);
      setBalance(Number(res.data.balancePlusDeposits || 0));
      setTodayProfit(Number(res.data.balance || 0));
    } catch (err) {
      console.error("Profile error:", err);
      setError(t("ProfileFetchError"));
    }
  }, [token, headers, t]);

  // ---------------- API: CREATE DEPOSIT ----------------
  const createDeposit = useCallback(async () => {
    try {
      const payload = {
        amount: depositAmount,
        currency: "USDT",
        type: "crypto",
        provider: "onchain",
        chain: "TRON",
      };

      // Step 1: Create deposit
      const res = await axios.post("/api/v1/users/deposit", payload, { headers });
      const id = res.data.deposit?.id;
      if (!id) return alert("Deposit ID not found in response");


      // Step 2: Get deposit data
      const qrRes = await axios.get(`/api/v1/deposits/${id}/qr`, { headers });

      setDepositData({
        deposit: qrRes.data.deposit || {},
        receive_address: qrRes.data.address || "",
        amount: qrRes.data.amount || depositAmount,
      });

      setDepositStep(2);

    } catch (err) {
      console.error("Deposit error:", err);
      alert(t("FailedToLoadDeposit"));
    }
  }, [depositAmount, headers, t]);

  // ---------------- API: UNIQUE TAG ----------------
  const openUniqueTagModal = useCallback(async () => {
    try {
      const res = await axios.get("/api/v1/users/profile", { headers });
      setUniqueTag(res.data.user.unique_tag || "");
      setShowUniqueTagModal(true);
    } catch (err) {
      console.error("Unique tag error", err);
    }
  }, [headers]);

  useEffect(() => { fetchUserProfile(); }, [fetchUserProfile]);

  return (
    <div className="tosvaContainer">

      {/* Profile */}
      <div className="profileSection">
        <div className="avatar">
          <img src="https://cdn-icons-png.flaticon.com/512/4140/4140037.png" alt="avatar" />
        </div>

        <div className="profileInfo">
          <div className="userId">ID: {user?.id ?? t("Loading")}</div>
          <div className="userAccount">{user?.email ?? t("Loading")}</div>
        </div>

        <div className="icons">
          <button className="iconButton" onClick={openUniqueTagModal}>📱</button>
          <button className="iconButton" onClick={() => navigate("/settings")}>⚙️</button>
        </div>
      </div>

      {/* Balance */}
      <div className="balanceSection">
        <p className="label">{t("TotalAssets")}</p>
        <div className="balanceRow">
          <h1 className={`balanceValue ${isHidden ? "fadeOut" : "fadeIn"}`}>
            {isHidden ? "****" : `$${formatMoney(balance)}`}
          </h1>
          <button className="iconButton" onClick={toggleBalanceVisibility}>
            {isHidden ? "👁️‍🗨️" : "👁️"}
          </button>
        </div>
      </div>

      {/* Earnings */}
      <div className="earningsGrid">
        <div className="earnCard">
          <p className="earnLabel">{t("TodayProfit")}</p>
          <h3 className="earnValue">+${todayProfit}</h3>
        </div>

        <div className="earnCard">
          <p className="earnLabel">{t("TotalEarnings")}</p>
          <h3 className="earnValue">${(todayProfit).toLocaleString()}</h3>
        </div>
      </div>

      {/* Transactions dummy */}
      <div className="transactionsBox">
        <p className="transTitle">{t("RecentTransactions")}</p>
        <p style={{ color: "#aaa", fontSize: "13px" }}>{t("NoTransactionsYet")}</p>
      </div>

      {/* Action Buttons */}
      <div className="actionButtons">
        <button onClick={() => setShowDepositModal(true)}>{t("Recharge")}</button>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modalOverlay">
          <div className="modalBox">

            {depositStep === 1 && (
              <>
                <h2>{t("SelectAmount")}</h2>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  onBlur={(e) => {
                    if (Number(e.target.value) < 500) setDepositAmount(500); 
                  }}
                  className="amountInput"
                />
                <button className="modalNext" onClick={createDeposit}>
                  {t("Next")} →
                </button>
              </>
            )}

            {depositStep === 2 && depositData && (
              <>
                <h2>{t("SendUSDTTRC20")}</h2>

                <p>
                  <b>{t("Amount")}:</b> {depositData.deposit?.amount ?? depositData.amount} USDT
                </p>

                <div className="walletBox">
                  <p className="walletText">{depositData.receive_address}</p>
                  <button
                    className="copyBtn"
                    onClick={() => safeCopyToClipboard(depositData.receive_address)}
                  >
                    {copyStatus ? t("Copied") : t("Copy")}
                  </button>
                </div>

                <p style={{ marginTop: "10px", fontSize: "12px", color: "#aaa" }}>
                  {t("CopyAddressAndSendUSDT")}
                </p>

                <button
                  className="modalNext"
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositStep(1);
                  }}
                >
                  {t("IPaid")} →
                </button>

              </>
            )}
          </div>
        </div>
      )}

      {/* UNIQUE TAG MODAL */}
      {showUniqueTagModal && (
        <div className="modalOverlay" onClick={() => setShowUniqueTagModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h2>{t("YourUniqueTag")}</h2>
            <input
              readOnly
              value={`${window.location.origin}/signup?ref=${uniqueTag}`}
              onFocus={(e) => e.target.select()}
            />
            <button
              style={{ marginTop: "10px" }}
              onClick={() => safeCopyToClipboard(`${window.location.origin}/signup?ref=${uniqueTag}`)}
            >
              {t("Copy")}
            </button>
            <button style={{ marginTop: "15px" }} onClick={() => setShowUniqueTagModal(false)}>
              {t("Close")}
            </button>
          </div>
        </div>
      )}

      {error && <div className="globalError">{error}</div>}

    </div>
  );
};

export default Assets;
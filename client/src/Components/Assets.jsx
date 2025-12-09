import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [refRate, setRefRate] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositStep, setDepositStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState(500);
  const [depositData, setDepositData] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const walletTextRef = useRef(null);

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
    const done = () => { setCopyStatus(true); setTimeout(() => setCopyStatus(false), 1500); };
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          done();
        });
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      }
    } catch (_) {}
  }, []);

  // ---------------- API: FETCH PROFILE ----------------
  const fetchUserProfile = useCallback(async () => {
    console.log(token);
    
    const res = await axios.get("/api/v1/users/profile");
    if (!res) return;
    try {
      setUser(res.data.user);
      setBalance(Number(res.data.balancePlusDeposits || 0));
      setWalletBalance(Number(res.data.balance || 0));
      setTotalDeposited(Number(res.data.totalDeposited || 0));
      setInviteCode(String(res.data.invite_code || ""));
      setReferralCount(Number(res.data.referral_count || 0));
      setRefRate(Number(res.data.interest_rate_for_referrer || 0));
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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showDepositModal) { setShowDepositModal(false); setDepositStep(1); }
        if (showUniqueTagModal) { setShowUniqueTagModal(false); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDepositModal, showUniqueTagModal]);

  return (
    <div className="tosvaContainer">

      {/* Profile */}
      <div className="profileSection">
        <div className="avatar">
          <img src="https://cdn-icons-png.flaticon.com/512/4140/4140037.png" alt="avatar" />
        </div>

        <div className="profileInfo">
          <div className="userId">{user?.name || t("Loading")}</div>
          <div className="userAccount">{user?.email ?? t("Loading")}</div>
        </div>

        <div className="icons">
          <button className="iconButton" onClick={openUniqueTagModal} aria-label={t("ShareLink")}>
            <i className="fa-solid fa-share-nodes" aria-hidden="true" />
          </button>
          <button className="iconButton" onClick={() => navigate("/settings")} aria-label={t("Settings")}>
            <i className="fa-solid fa-gear" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="balanceSection">
        <p className="label">{t("TotalAssets")}</p>
        <div className="balanceRow">
          <h1 className={`balanceValue ${isHidden ? "fadeOut" : "fadeIn"}`}>
            {isHidden ? "****" : `$${formatMoney(balance)}`}
          </h1>
          <button className="iconButton" onClick={toggleBalanceVisibility} aria-label={isHidden ? t("ShowBalance") : t("HideBalance")}>
            {isHidden ? (
              <i className="fa-solid fa-eye-slash" aria-hidden="true" />
            ) : (
              <i className="fa-solid fa-eye" aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="balanceBreakdown">
          <span className="breakItem">Deposits: ${formatMoney(totalDeposited)}</span>
          <span className="dot">•</span>
          <span className="breakItem">Wallet: ${formatMoney(walletBalance)}</span>
        </div>
      </div>

      {/* Profile details */}
      <div className="profileDetails">
        <div className="kvRow"><span className="kvLabel">{t("FullName")}</span><span className="kvValue">{user?.name || "—"}</span></div>
        <div className="kvRow"><span className="kvLabel">{t("EmailAddress")}</span><span className="kvValue">{user?.email || "—"}</span></div>
        <div className="kvRow"><span className="kvLabel">Total Deposited</span><span className="kvValue">${formatMoney(totalDeposited)}</span></div>
        <div className="kvRow"><span className="kvLabel">Balance</span><span className="kvValue">${formatMoney(walletBalance)}</span></div>
        <div className="kvRow"><span className="kvLabel">Invite Code</span><span className="kvValue">{inviteCode || "—"}</span></div>
        <div className="kvRow"><span className="kvLabel">Referrals</span><span className="kvValue">{referralCount}</span></div>
        <div className="kvRow"><span className="kvLabel">Referrer Rate</span><span className="kvValue">{refRate}%</span></div>
      </div>

      {/* Earnings */}
      <div className="earningsGrid">
        <div className="earnCard">
          <p className="earnLabel">{t("TodayProfit")}</p>
          <h3 className="earnValue">+${formatMoney(todayProfit)}</h3>
        </div>

        <div className="earnCard">
          <p className="earnLabel">{t("TotalEarnings")}</p>
          <h3 className="earnValue">${formatMoney(walletBalance)}</h3>
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
        <div
          className="modalOverlay"
          onClick={() => { setShowDepositModal(false); setDepositStep(1); }}
        >
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>

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
                <button
                  className="modalClose"
                  onClick={() => { setShowDepositModal(false); setDepositStep(1); }}
                >
                  {t("Close")}
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
                  <p
                    ref={walletTextRef}
                    className="walletText"
                    role="button"
                    tabIndex={0}
                    title={t("Copy")}
                    onClick={() =>
                      safeCopyToClipboard(
                        walletTextRef.current?.textContent?.trim() ||
                        depositData.deposit?.receive_address ||
                        depositData.receive_address
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        safeCopyToClipboard(
                          walletTextRef.current?.textContent?.trim() ||
                          depositData.deposit?.receive_address ||
                          depositData.receive_address
                        );
                      }
                    }}
                  >
                    {depositData.deposit?.receive_address || depositData.receive_address}
                  </p>
                  <button
                    className="copyBtn"
                    onClick={() =>
                      safeCopyToClipboard(
                        walletTextRef.current?.textContent?.trim() ||
                        depositData.deposit?.receive_address ||
                        depositData.receive_address
                      )
                    }
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
                <button
                  className="modalClose"
                  onClick={() => { setShowDepositModal(false); setDepositStep(1); }}
                >
                  {t("Close")}
                </button>

              </>
            )}
          </div>
        </div>
      )}

      {/* UNIQUE TAG MODAL */}
      {showUniqueTagModal && (
        <div className="modalOverlay" onClick={() => setShowUniqueTagModal(false)}>
          <div className="inviteModalContent" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="inviteHeader">
              <div className="inviteIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0 0-7.07 5 5 0 0 0-7.07 0L10 5" />
                  <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 19" />
                </svg>
              </div>
              <h2 className="inviteTitle">{t("YourUniqueTag")}</h2>
            </div>
            <p className="inviteText">{t("Copy")}</p>
            <div className="inputGroup">
              <input
                readOnly
                value={uniqueTag || ""}
                onFocus={(e) => e.target.select()}
                aria-label={t("YourUniqueTag")}
              />
              <button
                className="primaryBtn"
                onClick={() => safeCopyToClipboard(uniqueTag || "")}
              >
                {t("Copy")}
              </button>
            </div>
            <div className="modalActions">
              <button className="secondaryBtn" onClick={() => setShowUniqueTagModal(false)}>{t("Close")}</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="globalError">{error}</div>}

    </div>
  );
};

export default Assets;

import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Header.css";

const slides = [
  {
    id: 'basic',
    title: "Basic Information",
    desc: "Key parameters for deposits and daily performance.",
    infoTable: [
      { label: "Minimum Deposit", value: "500 USDT" },
      { label: "Interest Rate", value: "55–60%" },
      { label: "Daily Profit", value: "2.2–2.4%" },
      { label: "Trades per Day", value: "4 (Total 4%)" }
    ]
  },
  {
    id: 'income',
    title: "Trading Income Statement",
    desc: "Returns over 7, 15, 30, 90, and 180 days.",
    text: "Returns are calculated to help compare short vs long-term outcomes. As investment increases, returns generally grow, and longer periods yield higher totals.",
    matrixTable: {
      columns: ["Amount", "7 Days", "15 Days", "30 Days", "90 Days", "180 Days"],
      rows: [
        { amount: 500, d7: 590, d15: 714, d30: 1019, d90: 4226, d180: 35724 },
        { amount: 1000, d7: 1181, d15: 1427, d30: 2037, d90: 8453, d180: 71448 },
        { amount: 3000, d7: 3542, d15: 4282, d30: 6111, d90: 25358, d180: 214345 },
        { amount: 5000, d7: 5903, d15: 7136, d30: 10185, d90: 42264, d180: 357242 },
        { amount: 10000, d7: 11806, d15: 14272, d30: 20370, d90: 84527, d180: 714483 }
      ]
    }
  },
  {
    id: 'daily',
    title: "0.80% Daily Interest",
    desc: "Deposit and earn fixed daily interest.",
    infoTable: [
      { label: "Daily Rate", value: "0.80%" },
      { label: "Accrual", value: "Daily" },
      { label: "Type", value: "Fixed return" }
    ]
  },
  {
    id: 'withdrawals',
    title: "Monthly Withdrawals",
    desc: "Withdraw profits once per month.",
    infoTable: [
      { label: "Frequency", value: "Monthly" },
      { label: "Scope", value: "Profits withdrawal" },
      { label: "Method", value: "Request in dashboard" }
    ]
  },
  {
    id: 'referrals',
    title: "Invite & Earn",
    desc: "Share your link and receive referral rewards.",
    infoTable: [
      { label: "Referral", value: "Invite & earn rewards" },
      { label: "Benefit", value: "Percentage of referrals activity" },
      { label: "Payout", value: "Added to your wallet" }
    ]
  }
];

const Header = () => {
    const navigate = useNavigate();

    const fmt = (n) => '$' + Number(n).toLocaleString();
    return (
      <header className="headerContainer">
        <div className="heroStack">
          {slides.map((s) => (
            <section className="sectionBox" key={s.id}>
              <div className="slideBody">
                <h1 className="slideTitle">{s.title}</h1>
                <p className="slideDesc">{s.desc}</p>
                {s.text && <p className="sectionText">{s.text}</p>}
                {Array.isArray(s.infoTable) && s.infoTable.length > 0 && (
                  <div className="returnsTableWrap">
                    <table className="kvTable">
                      <tbody>
                        {s.infoTable.map((row) => (
                          <tr key={row.label}>
                            <td className="kvLabel">{row.label}</td>
                            <td className="kvValue">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {s.matrixTable && (
                  <div className="returnsTableWrap">
                    <table className="mtTable">
                      <thead>
                        <tr>
                          {s.matrixTable.columns.map((c) => (<th key={c}>{c}</th>))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.matrixTable.rows.map((r) => (
                          <tr key={r.amount}>
                            <td>{fmt(r.amount)}</td>
                            <td>{fmt(r.d7)}</td>
                            <td>{fmt(r.d15)}</td>
                            <td>{fmt(r.d30)}</td>
                            <td>{fmt(r.d90)}</td>
                            <td>{fmt(r.d180)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          ))}
          <div className="heroActions">
            <button className="heroPrimary" onClick={() => navigate("/assets")}>Get Started</button>
          </div>
        </div>
      </header>
    );
  };  


export default Header;

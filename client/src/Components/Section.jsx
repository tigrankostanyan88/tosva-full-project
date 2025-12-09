import React from "react";
import "../Styles/Section.css";
const steps = [
  { id: "register", title: "Register", desc: "Create your account in minutes." },
  { id: "deposit", title: "Deposit", desc: "Fund your wallet and start earning." },
  { id: "earn", title: "Earn 0.80% Daily", desc: "Interest accrues every day." },
  { id: "withdraw", title: "Withdraw Monthly", desc: "Withdraw profits once a month." }
];

const highlights = [
  { id: "daily", title: "0.80% Daily Interest", badge: "Fixed", desc: "Transparent daily accrual on your deposit." },
  { id: "monthly", title: "Monthly Withdrawals", badge: "Flexible", desc: "Withdraw profits once a month." },
  { id: "secure", title: "Secure & Clear", badge: "Trust", desc: "Simple flow, clear status, clean UI." },
  { id: "referral", title: "Referral Rewards", badge: "Bonus", desc: "Invite friends and earn extra rewards." }
];

const Section = () => {
  return (
    <section className="sectionContainer">
      <div className="sectionHeader">
        <h2 className="sectionTitle">How It Works</h2>
      </div>

      <div className="stepsGrid">
        {steps.map((s) => (
          <div key={s.id} className="stepItem">
            <h3 className="stepTitle">{s.title}</h3>
            <p className="stepDesc">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="coursesGrid">
        {highlights.map((h) => (
          <div key={h.id} className="courseCard">
            <div className="courseTop">
              <span className={`badge ${h.badge === "Bonus" ? "badgePaid" : "badgeFree"}`}>{h.badge}</span>
              <span className="meta">{h.title.includes("Daily") ? "Daily" : h.title.includes("Monthly") ? "Monthly" : ""}</span>
            </div>
            <h3 className="courseTitle">{h.title}</h3>
            <p className="courseDesc">{h.desc}</p>
            
          </div>
        ))}
      </div>

      <div className="referralBox">
        <h3>Referral Program</h3>
        <p>Invite friends and earn additional rewards on their activity. Share your unique link from the Assets page and start growing your bonus.</p>
        
      </div>
    </section>
  );
};

export default Section;

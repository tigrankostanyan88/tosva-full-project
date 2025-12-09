import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const go = (p) => navigate(p);
  const active = (p) => location.pathname === p;

  return (
    <div className="adminNav">
      <button className={`adminNavBtn ${active("/admin/deposits") ? "adminNavBtnActive" : ""}`} onClick={() => go("/admin/deposits")}>Deposits</button>
      <button className={`adminNavBtn ${active("/admin/referrals") ? "adminNavBtnActive" : ""}`} onClick={() => go("/admin/referrals")}>Referrals</button>
    </div>
  );
}

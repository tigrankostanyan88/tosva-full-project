import React from "react";
import { NavLink } from "react-router-dom";
import '../Styles/Footer.css'

function Footer () {
    return (
        <footer>
           <ul className="footerList">
                <li>
                <NavLink to="/" aria-label="Home" className={({ isActive }) => isActive ? "activeLink" : ""}>
                    <i className="fa-solid fa-house footerIcon" aria-hidden="true"></i>
                </NavLink>
                </li>
                <li>
                <NavLink to="/trade" aria-label="Trade" className={({ isActive }) => isActive ? "activeLink" : ""}>
                    <i className="fa-solid fa-chart-line footerIcon" aria-hidden="true"></i>
                </NavLink>
                </li>
                <li>
                <NavLink to="/assets" aria-label="Assets" className={({ isActive }) => isActive ? "activeLink" : ""}>
                    <i className="fa-solid fa-wallet footerIcon" aria-hidden="true"></i>
                </NavLink>
                </li>
                <li>
                <NavLink to="/settings" aria-label="Settings" className={({ isActive }) => isActive ? "activeLink" : ""}>
                    <i className="fa-solid fa-gear footerIcon" aria-hidden="true"></i>
                </NavLink>
                </li>
            </ul>
        </footer>
    )
}

export default Footer ;

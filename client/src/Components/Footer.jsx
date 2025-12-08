import React from "react";
import { NavLink } from "react-router-dom";
import '../Styles/Footer.css'

function Footer () {
    return (
        <footer>
           <ul className="footerList">
                <li>
                <NavLink to="/" className={({ isActive }) => isActive ? "activeLink" : ""}>
                    <div className="home"></div>
                </NavLink>
                </li>
                <li>
                <NavLink to="/trade" className={({ isActive }) => isActive ? "activeLink" : ""}>
                    <div className="trade"></div>
                </NavLink>
                </li>
                <li>
                <NavLink to="/assets" className={({ isActive }) => isActive ? "activeLink" : ""}>
                    <div className="assets"></div>
                </NavLink>
                </li>
            </ul>
        </footer>
    )
}

export default Footer ;
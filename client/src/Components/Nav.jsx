import React from "react";
import '../Styles/Nav.css'

function Nav () {
    return (
        <nav>
            <div className="logo"></div>
            <h1>TOSVA</h1>
            <div
            className="support"
            onClick={() => window.open("https://t.me/Manjiro_Tosva", "_blank")}
            style={{ cursor: "pointer" }}
            ></div>
        </nav>
    )
}

export default Nav ;
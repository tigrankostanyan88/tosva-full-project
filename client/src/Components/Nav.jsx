import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../Styles/Nav.css'

function Nav () {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get('/api/v1/users/profile');
                const role = res && res.data && res.data.user && res.data.user.role;
                setIsAdmin(role === 'admin');
            } catch {}
        })();
    }, []);

    return (
        <nav>
            <div className="logo"></div>
            <h1>TOSVA</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                    className="support"
                    onClick={() => window.open("https://t.me/Manjiro_Tosva", "_blank")}
                    style={{ cursor: "pointer" }}
                ></div>
                {isAdmin && (
                    <>
                      <button
                        className="adminLink"
                        onClick={() => navigate('/admin/deposits')}
                      >
                        Admin
                      </button>
                    </>
                )}
            </div>
        </nav>
    )
}

export default Nav ;

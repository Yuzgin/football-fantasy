import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";

function StaffRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [isStaff, setIsStaff] = useState(false);

    useEffect(() => {
        auth().catch(() => {
            setIsAuthorized(false);
            setIsStaff(false);
        });
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post("/api/token/refresh/", {
                refresh: refreshToken,
            });

            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                await fetchUserInfo(); // Fetch user info after refreshing
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error(error);
            setIsAuthorized(false);
        }
    };

    const fetchUserInfo = async () => {
        try {
            const res = await api.get("/api/user/", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
                },
            });

            if (res.status === 200) {
                setIsStaff(res.data.is_staff); // Set is_staff based on API response
            } else {
                setIsStaff(false);
            }
        } catch (error) {
            console.error(error);
            setIsStaff(false);
        }
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthorized(false);
            setIsStaff(false);
            return;
        }

        const decoded = jwtDecode(token);
        const tokenExpired = decoded.exp;
        const now = Date.now() / 1000;

        if (now > tokenExpired) {
            await refreshToken();
        } else {
            await fetchUserInfo();
            setIsAuthorized(true);
        }
    };

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    return isAuthorized && isStaff ? children : <Navigate to="/" />;
}

export default StaffRoute;

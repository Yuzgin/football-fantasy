import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";

export const checkIsStaff = async () => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      return false;
    }

    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;

    // If token is expired, try to refresh it
    if (now > decoded.exp) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (!refreshToken) {
        return false;
      }

      try {
        const res = await api.post("/api/token/refresh/", {
          refresh: refreshToken,
        });

        if (res.status === 200) {
          localStorage.setItem(ACCESS_TOKEN, res.data.access);
        } else {
          return false;
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        return false;
      }
    }

    // Fetch user info to check is_staff status
    const res = await api.get("/api/user/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
      },
    });

    if (res.status === 200) {
      return res.data.is_staff;
    }

    return false;
  } catch (error) {
    console.error("Error checking staff status:", error);
    return false;
  }
};

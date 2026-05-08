import axios from "axios";

const isProd = process.env.NODE_ENV === "production";
const API = axios.create({
  baseURL: isProd ? "/api" : (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api",
  withCredentials: true,
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      const isMeCheck = error.config?.url?.includes("/auth/me");
      const isLoginPage = window.location.pathname === "/login";

      if (!isMeCheck && !isLoginPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;

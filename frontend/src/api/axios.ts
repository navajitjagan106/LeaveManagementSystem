import axios from "axios";
import { getCookie, removeCookie } from "../utils/cookies";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL + "/api",
});

API.interceptors.request.use((config) => {
  const token = getCookie("token");

  const isAuthRoute =
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/register");

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Token expired or invalid");

      removeCookie("token");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
export default API;
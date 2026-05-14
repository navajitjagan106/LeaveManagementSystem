import axios from "axios";

const isProd = process.env.NODE_ENV === "production";
const API = axios.create({
  baseURL: isProd ? "/api" : (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api",
  withCredentials: true,
});

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

API.interceptors.request.use((config) => {
  if (config.method === "get") {
    const key = config.url + JSON.stringify(config.params || {});
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expires) {
      // Return a custom "adapter" that returns the cached data
      config.adapter = () => {
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          request: {},
        });
      };
    }
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    if (response.config.method === "get") {
      const key = response.config.url + JSON.stringify(response.config.params || {});
      cache.set(key, { data: response.data, expires: Date.now() + CACHE_TTL });
    } else {
      // Invalidate cache on mutations
      cache.clear();
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
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

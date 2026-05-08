/**
 * Axios instance with base URL + JWT header auto-attach.
 * Handles token refresh on 401 responses.
 */

import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (r: unknown) => void }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(orig));
      }
      orig._retry = true;
      isRefreshing = true;
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          failedQueue.forEach((p) => p.resolve(undefined));
          failedQueue = [];
          return api(orig);
        }
      } catch { /* fall through */ }
      failedQueue.forEach((p) => p.reject(error));
      failedQueue = [];
      isRefreshing = false;
      if (typeof window !== "undefined") {
        Cookies.remove("access_token");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;

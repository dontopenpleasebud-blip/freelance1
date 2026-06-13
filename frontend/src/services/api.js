import axios from "axios";

const base = import.meta.env.BACKEND_URI;

const api = axios.create({
  baseURL: base,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: add bearer token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("dairy_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: handle token expiration / auth errors
let logoutUserHandler = null;

export const registerLogoutHandler = (handler) => {
  logoutUserHandler = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      console.warn("Unauthorized request detected (401). Signing out user.");
      if (logoutUserHandler) {
        logoutUserHandler();
      }
    }

    return Promise.reject(error);
  },
);

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "", // RELATIVNO -> uvek isti origin (nema mismatch 127.0.0.1 vs localhost)
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

export default api;

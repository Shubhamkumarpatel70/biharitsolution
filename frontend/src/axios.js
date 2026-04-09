import axios from "axios";

const instance = axios.create({
  // Use relative URLs by default so CRA `proxy` works in dev
  // and production works on the same origin.
  baseURL: process.env.REACT_APP_API_URL || "",
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for performance optimization
instance.interceptors.request.use(
  (config) => {
    // Add timestamp for caching
    config.metadata = { startTime: new Date() };

    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the runtime set multipart boundary (default JSON Content-Type breaks FormData uploads)
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for performance monitoring and error handling
instance.interceptors.response.use(
  (response) => {
    // Log response time for performance monitoring
    const endTime = new Date();
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`API call to ${response.config.url} took ${duration}ms`);
    }

    return response;
  },
  async (error) => {
    // Retry logic for network errors
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.log("Request timeout, retrying...");

      // Retry once for timeout errors
      const isLoginRequest =
        typeof error.config?.url === "string" &&
        error.config.url.includes("/api/auth/login");
      if (error.config && !error.config._retry && !isLoginRequest) {
        error.config._retry = true;
        console.log("Retrying request:", error.config.url);
        return instance.request(error.config);
      }
    }

    // Log error details for debugging
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  },
);

export default instance;

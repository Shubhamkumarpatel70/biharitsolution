import axios from "axios";

const instance = axios.create({
  // Production uses same-origin API routes. Development may use an explicit API URL.
  baseURL: import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || "")
    : "",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

const isTechnicalMessage = (value) => {
  if (typeof value !== "string") return true;
  const message = value.trim();
  if (!message) return true;
  return (
    /\b(ECONN|ETIMEDOUT|ECONNABORTED|ENOTFOUND|EAI_AGAIN|Mongo(?:DB)?|Mongoose|CastError|ValidationError|TypeError|ReferenceError|SyntaxError| stack trace| at .*\()/i.test(message) ||
    /\b(?:server|request|gateway)\s*(?:timeout|timed out)\s*[:=-]?\s*\d{3,}/i.test(message) ||
    /\b(?:timeout|timed out)\s*(?:after|of)?\s*\d+\s*(?:ms|milliseconds|seconds|s)\b/i.test(message) ||
    /\b(?:internal server error|uncaught exception|failed to fetch|network error)\b/i.test(message)
  );
};

const getFriendlyError = (error) => {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message;
  const safeBackendMessage = !isTechnicalMessage(backendMessage) ? backendMessage.trim() : "";

  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
    return "The request is taking longer than expected. Please check your connection and try again.";
  }
  if (!error?.response) {
    return "Unable to connect right now. Please check your internet connection and try again.";
  }
  if (status === 408) {
    return "The request is taking longer than expected. Please try again in a moment.";
  }
  if (status === 400 || status === 422) {
    return safeBackendMessage || "Please check the information you entered and try again.";
  }
  if (status === 401) {
    return safeBackendMessage || "Your session has expired. Please sign in again.";
  }
  if (status === 403) {
    return safeBackendMessage || "You do not have permission to perform this action.";
  }
  if (status === 404) {
    return safeBackendMessage || "The requested information could not be found.";
  }
  if (status === 409) {
    return safeBackendMessage || "This request conflicts with an existing record. Please refresh and try again.";
  }
  if (status === 429) {
    return safeBackendMessage || "You have made too many requests. Please wait a little and try again.";
  }
  if (status >= 500) {
    return "We are having trouble processing your request right now. Please try again shortly. If the issue continues, contact ASKC TECHNOLOGIES support.";
  }
  return safeBackendMessage || "Something went wrong. Please try again.";
};

instance.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === "function") config.headers.delete("Content-Type");
      else delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Never automatically replay timed-out requests: payment/order and form POSTs
    // may already have reached the server, so a retry could create duplicates.
    const friendlyMessage = getFriendlyError(error);
    error.userMessage = friendlyMessage;
    error.message = friendlyMessage;

    // Existing screens read response.data.message. Replace technical backend
    // details centrally so stack traces, infrastructure errors and raw timeouts
    // are never shown to customers.
    if (error.response) {
      const originalData = error.response.data;
      error.response.data = originalData && typeof originalData === "object"
        ? { ...originalData, message: friendlyMessage }
        : { message: friendlyMessage };
    }
    return Promise.reject(error);
  },
);

export default instance;

import axios from "../axios";

/**
 * Revoke this browser's server-side session before clearing local credentials.
 * Client credentials are always cleared, even if the network is unavailable.
 */
export async function logoutCurrentSession() {
  const token = localStorage.getItem("token");
  let serverRevoked = false;

  try {
    if (token) {
      await axios.post("/api/auth/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      serverRevoked = true;
    }
  } catch (error) {
    // Do not keep the user signed in locally when the server cannot be reached.
    // The session remains visible server-side and can be revoked from another device.
    console.warn("Server-side logout could not be confirmed:", error?.response?.status || error?.message);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common.Authorization;
  }

  return serverRevoked;
}

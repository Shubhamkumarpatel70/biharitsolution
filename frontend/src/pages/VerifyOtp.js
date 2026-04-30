import React, { useState } from "react";
import axios from "../axios";
import { useNavigate } from "react-router-dom";

function VerifyOtp({ email, onSuccess }) {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post("/api/auth/register/verify-otp", { email, otp });
      setLoading(false);
      setMessage("OTP verified! You can now login.");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else navigate("/login");
      }, 1200);
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "OTP verification failed.");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white p-6 rounded-xl shadow border mt-12">
      <h2 className="text-2xl font-bold mb-4 text-center">Verify Email OTP</h2>
      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
          placeholder="Enter OTP sent to your email"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        {message && (
          <div className="text-center text-sm text-danger-600">{message}</div>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}

export default VerifyOtp;

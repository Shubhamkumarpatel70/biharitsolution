import React, { useState } from "react";
import axios from "../axios";
import { useNavigate } from "react-router-dom";
import OtpInput from "../components/OtpInput";

function VerifyOtp({ email, onSuccess }) {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage("Please enter all 6 digits.");
      return;
    }
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
      <p className="text-center text-gray-500 mb-6 text-sm">
        Enter the 6-digit verification code sent to {email}
      </p>
      <form onSubmit={handleVerify} className="space-y-4">
        <OtpInput length={6} value={otp} onChange={setOtp} disabled={loading} />
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

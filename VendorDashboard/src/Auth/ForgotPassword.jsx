/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { sendVendorResetCode } from "../../services/vendorAuthService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    const result = await sendVendorResetCode(email);
    setLoading(false);
    if (result.success) {
      setSent(true);
      toast.success("Code sent!", {
        description: "Check your email for the 6-digit reset code.",
      });
    } else {
      setError(result.error || "Failed to send reset code");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0E6] to-[#FAF7F2] dark:from-[#1A1A1A] dark:via-[#242424] dark:to-[#1A1A1A] p-4 md:p-6 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
            Reset Password
          </h1>
          <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
            Enter your email to receive a reset code
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-6 shadow-xl">
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/50 dark:text-[#D4A017]/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/40 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                  placeholder="vendor@example.com"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Reset Code
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-6 shadow-xl text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
              Code Sent!
            </h2>
            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
              We've sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.
            </p>
            <Link
              to={`/reset-password?email=${encodeURIComponent(email)}`}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-300 block"
            >
              Enter Reset Code
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 hover:text-[#D4A017]"
            >
              Wrong email? Click to retry
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 hover:text-[#D4A017]"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { verifyVendorResetCode } from "../../services/vendorAuthService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await verifyVendorResetCode(email, code, newPassword);
    setLoading(false);

    if (result.success) {
      setDone(true);
      toast.success("Password reset successful!", {
        description: "You can now sign in with your new password.",
      });
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(result.error || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0E6] to-[#FAF7F2] dark:from-[#1A1A1A] dark:via-[#242424] dark:to-[#1A1A1A] p-4 md:p-6 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {!done ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                Set New Password
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Enter the code and your new password
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-6 shadow-xl space-y-5">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                  placeholder="vendor@example.com"
                  required
                />
              </div>

              {/* Reset code */}
              <div>
                <label className="block text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                  Reset Code (6 digits)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                  placeholder="000000"
                  required
                />
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/50 dark:text-[#D4A017]/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B4513]/50 dark:text-[#D4A017]/50 hover:text-[#D4A017]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/50 dark:text-[#D4A017]/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                    placeholder="Re-enter your password"
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
                    Resetting…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-8 shadow-xl text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
              Password Reset!
            </h2>
            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
              Your password has been updated. Redirecting to sign in…
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-xl transition-all"
            >
              Sign In
            </Link>
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
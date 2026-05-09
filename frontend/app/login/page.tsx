"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setError("");
    if (phone.length < 12) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail: string } } }).response?.data?.detail
          : "Failed to send OTP";
      setError(msg || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue || otp;
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const user = await verifyOtp(phone, code);
      router.push(user.is_admin ? "/admin" : "/explore");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail: string } } }).response?.data?.detail
          : "Invalid OTP";
      setError(msg || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />

      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Sigma<span>connect</span></h1>
          <p className="login-subtitle">Connect with BNI members near you</p>
        </div>

        <div className={`login-card ${step === "otp" ? "slide-up" : ""}`}>
          {step === "phone" ? (
            <>
              <h2>Welcome</h2>
              <p className="login-card-desc">Enter your phone number to get started</p>

              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="login-phone">Phone Number</label>
                <input
                  id="login-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="login-input"
                  autoFocus
                />
              </div>

              <Button onClick={handleSendOtp} isLoading={loading} fullWidth size="lg">
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <h2>Verify OTP</h2>
              <p className="login-card-desc">
                Enter the 6-digit code sent to<br />
                <strong>{phone}</strong>
              </p>

              {error && <div className="form-error">{error}</div>}

              <OtpInput
                value={otp}
                onChange={setOtp}
                onComplete={(val) => handleVerifyOtp(val)}
                disabled={loading}
              />

              <Button
                onClick={() => handleVerifyOtp()}
                isLoading={loading}
                fullWidth
                size="lg"
                className="mt-4"
              >
                Verify
              </Button>

              <button
                className="login-back"
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              >
                ← Change number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

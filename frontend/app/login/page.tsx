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
  const [phone, setPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    console.log("handleSendOtp called with:", phone);
    setError("");
    // Sanitize: keep only digits
    const digits = phone.replace(/\D/g, "");
    
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    const phoneWithCode = `+91${digits}`;
    console.log("Phone normalized to:", phoneWithCode);
    setFullPhone(phoneWithCode);
    setLoading(true);
    try {
      console.log("Sending request to backend...");
      const data = await sendOtp(phoneWithCode);
      console.log("Backend response:", data);
      // alert("OTP sent successfully!"); // Temporarily adding alert for mobile debugging
      setStep("otp");
    } catch (err: unknown) {
      console.error("Error sending OTP:", err);
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
      const user = await verifyOtp(fullPhone, code);
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
              <p className="login-card-desc">Enter your 10-digit mobile number to get started</p>

              {error && <div className="form-error">{error}</div>}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Form submitted, calling handleSendOtp...");
                  handleSendOtp();
                }}
              >
                <div className="form-group">
                  <label htmlFor="login-phone">Phone Number</label>
                  <input
                    id="login-phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="login-input"
                    maxLength={10}
                  />
                </div>

                <Button type="submit" isLoading={loading} fullWidth size="lg">
                  Send OTP
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2>Verify OTP</h2>
              <p className="login-card-desc">
                Enter the 6-digit code sent to<br />
                <strong>{fullPhone}</strong>
              </p>

              {error && <div className="form-error">{error}</div>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyOtp();
                }}
              >
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={(val) => handleVerifyOtp(val)}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  isLoading={loading}
                  fullWidth
                  size="lg"
                  className="mt-4"
                >
                  Verify
                </Button>
              </form>

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

"use client";

import { useRef, useCallback, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d?$/.test(char)) return;
      const newDigits = [...digits];
      newDigits[index] = char;
      const newValue = newDigits.join("");
      onChange(newValue.replace(/\s/g, ""));

      if (char && index < length - 1) {
        focusInput(index + 1);
      }

      if (char && newValue.replace(/\s/g, "").length === length) {
        onComplete?.(newValue);
      }
    },
    [digits, length, onChange, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        focusInput(index - 1);
      }
    },
    [digits]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted) {
        onChange(pasted);
        focusInput(Math.min(pasted.length, length - 1));
        if (pasted.length === length) onComplete?.(pasted);
      }
    },
    [length, onChange, onComplete]
  );

  return (
    <div className="otp-container">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          className="otp-digit"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

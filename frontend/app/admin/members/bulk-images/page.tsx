"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface BulkImageResponse {
  message: string;
  successful: string[];
  failed: string[];
}

export default function BulkImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImageResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a ZIP file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const response = await fetch(`${apiBase}/admin/members/bulk-images`, {
        method: "POST",
        body: formData,
        headers: {
          // Note: let browser set Content-Type for multipart/form-data
          Authorization: `Bearer ${
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("access_token="))
              ?.split("=")[1]
          }`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || "Upload failed");
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Bulk Upload Images</h1>
      </div>
      
      <div className="admin-card">
        <p style={{ marginBottom: "20px", color: "var(--text-secondary)" }}>
          Upload a ZIP file containing profile images (JPEG, PNG, WebP). 
          The system will extract the images and use fuzzy matching to map the file names 
          (e.g., <strong>aryanpawaskar.jpeg</strong>) to member names (e.g., <strong>Aryan Pawaskar</strong>).
        </p>

        <div className="form-group">
          <label className="form-label">ZIP Archive</label>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="admin-input"
            disabled={loading}
          />
        </div>

        {error && <div className="form-error" style={{ marginBottom: "20px" }}>{error}</div>}

        <Button onClick={handleUpload} isLoading={loading} disabled={!file}>
          Upload and Process
        </Button>
      </div>

      {result && (
        <div style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "var(--text-main)" }}>
            Results: {result.message}
          </h2>

          <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
            {/* Success List */}
            {result.successful.length > 0 && (
              <div className="admin-card" style={{ borderLeft: "4px solid #10B981" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#10B981" }}>
                  Successfully Mapped ({result.successful.length})
                </h3>
                <ul style={{ listStyle: "disc", paddingLeft: "20px", fontSize: "14px", color: "var(--text-secondary)" }}>
                  {result.successful.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Failure List */}
            {result.failed.length > 0 && (
              <div className="admin-card" style={{ borderLeft: "4px solid #EF4444" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#EF4444" }}>
                  Failed to Map ({result.failed.length})
                </h3>
                <ul style={{ listStyle: "disc", paddingLeft: "20px", fontSize: "14px", color: "var(--text-secondary)" }}>
                  {result.failed.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

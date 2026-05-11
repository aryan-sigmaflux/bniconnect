"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function BulkAddPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadErrors([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/admin/members/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(res.data.message);
      if (res.data.errors && res.data.errors.length > 0) {
        setUploadErrors(res.data.errors);
      } else {
        setTimeout(() => router.push("/admin/members"), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Bulk Add Members</h1>
      <div className="admin-form-card">
        <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
          Upload a CSV file with the following columns: <strong>name, number, business name, business category</strong>.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleUpload} className="admin-form">
          <div className="form-group">
            <label>CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="admin-btn-primary" disabled={loading || !file}>
            {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </form>

        {uploadErrors.length > 0 && (
          <div className="upload-errors" style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "rgba(255, 68, 68, 0.1)", borderRadius: "8px" }}>
            <h3 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}>Errors during upload:</h3>
            <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
              {uploadErrors.map((err, idx) => (
                <li key={idx} style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

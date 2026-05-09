"use client";

import { useState, FormEvent, useRef } from "react";
import Button from "@/components/ui/Button";

interface MemberFormProps {
  initialData?: { name: string; phone: string; business_name: string; business_category?: string; description?: string };
  onSubmit: (data: { name: string; phone: string; business_name: string; business_category?: string; description?: string }, imageFile?: File) => Promise<void>;
  isEdit?: boolean;
}

export default function MemberForm({ initialData, onSubmit, isEdit = false }: MemberFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [businessName, setBusinessName] = useState(initialData?.business_name || "");
  const [businessCategory, setBusinessCategory] = useState(initialData?.business_category || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(
        { 
          name: name.trim(), 
          phone: phone.trim(), 
          business_name: businessName.trim(),
          business_category: businessCategory.trim(),
          description: description.trim()
        },
        imageFile || undefined
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="member-form">
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="member-name">Name *</label>
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="member-phone">Phone *</label>
        <input
          id="member-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9876543210"
          required
          disabled={isEdit}
        />
      </div>

      <div className="form-group">
        <label htmlFor="member-biz">Business Name</label>
        <input
          id="member-biz"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="member-category">Business Category</label>
        <input
          id="member-category"
          type="text"
          value={businessCategory}
          onChange={(e) => setBusinessCategory(e.target.value)}
          placeholder="Business Category"
        />
      </div>

      <div className="form-group">
        <label htmlFor="member-desc">Description</label>
        <textarea
          id="member-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
        />
      </div>

      <div className="form-group">
        <label>Profile Image</label>
        <div className="image-upload" onClick={() => fileRef.current?.click()}>
          {preview ? (
            <img src={preview} alt="Preview" className="image-preview" />
          ) : (
            <div className="image-upload-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Click to upload</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} hidden />
        </div>
      </div>

      <Button type="submit" isLoading={loading} fullWidth>
        {isEdit ? "Update Member" : "Add Member"}
      </Button>
    </form>
  );
}

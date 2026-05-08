"use client";

import { useRouter } from "next/navigation";
import api from "@/lib/api";
import MemberForm from "@/components/admin/MemberForm";

export default function AddMemberPage() {
  const router = useRouter();

  const handleSubmit = async (
    data: { name: string; phone: string; business_name: string; business_category?: string; description?: string },
    imageFile?: File
  ) => {
    const res = await api.post("/admin/members", data);
    const memberId = res.data.id;

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      await api.post(`/admin/members/${memberId}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    router.push("/admin/members");
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Add Member</h1>
      <div className="admin-form-container">
        <MemberForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

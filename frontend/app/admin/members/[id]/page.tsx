"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import MemberForm from "@/components/admin/MemberForm";
import type { AdminMemberResponse } from "@/types";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  const [member, setMember] = useState<AdminMemberResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/members").then((res) => {
      const found = res.data.find((m: AdminMemberResponse) => m.id === memberId);
      setMember(found || null);
      setLoading(false);
    });
  }, [memberId]);

  const handleSubmit = async (
    data: { name: string; phone: string; business_name: string; business_category?: string; description?: string },
    imageFile?: File
  ) => {
    await api.put(`/admin/members/${memberId}`, {
      name: data.name,
      business_name: data.business_name,
      business_category: data.business_category,
      description: data.description,
    });

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      await api.post(`/admin/members/${memberId}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    router.push("/admin/members");
  };

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Edit Member</h1>
        <div className="likes-loading"><div className="deck-spinner" /></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Member Not Found</h1>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Edit: {member.name}</h1>
      <div className="admin-form-container">
        <MemberForm
          isEdit
          initialData={{
            name: member.name,
            phone: member.phone,
            business_name: member.business_name || "",
            business_category: member.business_category || "",
            description: member.description || "",
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

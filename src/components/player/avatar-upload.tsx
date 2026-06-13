"use client";

import { useState, useRef } from "react";
import { uploadAvatarFile } from "@lib/actions/players";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentUrl?: string | null;
  displayName: string;
}

export function AvatarUpload({
  currentUrl,
  displayName,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo se admiten JPG, PNG o WebP");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      await uploadAvatarFile(file);
      toast.success("Avatar actualizado");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error(err instanceof Error ? err.message : "Error al subir la imagen");
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: preview
            ? "transparent"
            : "linear-gradient(135deg, #7c5cfc, #a78bfa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          fontWeight: 500,
          color: "#fff",
          cursor: "pointer",
          overflow: "hidden",
          border: "2px solid var(--accent)",
          position: "relative",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: uploading ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          {uploading ? "..." : "📷"}
        </div>
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "5px 14px",
          fontSize: "12px",
          color: "var(--accent-light)",
          cursor: "pointer",
        }}
      >
        {uploading ? "Subiendo..." : "Cambiar foto"}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </div>
  );
}

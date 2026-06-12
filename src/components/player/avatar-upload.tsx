"use client";

import { useState, useRef, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateAvatar } from "@lib/actions/players";
import { toast } from "sonner";

interface Props {
  currentAvatar?: string | null;
  name: string;
}

export function AvatarUpload({ currentAvatar, name }: Props) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      return toast.error("La imagen debe ser menor a 500KB");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      startTransition(async () => {
        try {
          await updateAvatar(base64);
          toast.success("Foto de perfil actualizada");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error al subir la imagen");
        }
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 16px" }}>
      <div style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        overflow: "hidden",
        border: "3px solid var(--accent)",
        background: "var(--bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        {currentAvatar ? (
          <img 
            src={currentAvatar} 
            alt={name} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        ) : (
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)" }}>{initials}</span>
        )}

        {isPending && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5
          }}>
            <Loader2 className="animate-spin" size={24} color="#fff" />
          </div>
        )}
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        style={{
          position: "absolute",
          bottom: "-4px",
          right: "-4px",
          background: "var(--accent)",
          color: "#000",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 10
        }}
      >
        <Camera size={14} />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />
    </div>
  );
}

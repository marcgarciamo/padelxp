"use client";

import { useState } from "react";
import { deleteTournament } from "@lib/actions/tournaments";
import { Button } from "@components/ui/button";
import { toast } from "sonner";
import { Trash2, Edit2, X } from "lucide-react";
import { TournamentUpdateForm } from "./tournament-update-form";

interface Props {
  tournamentId: string;
  tournament: any;
}

export function TournamentAdminControls({ tournamentId, tournament }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.")) return;
    setIsDeleting(true);
    try {
      await deleteTournament(tournamentId);
      toast.success("Torneo eliminado correctamente");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar el torneo");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
      <Button 
        onClick={() => setIsEditing(!isEditing)} 
        style={{ 
          background: isEditing ? "var(--bg-elevated)" : "var(--bg-primary)", 
          border: "1px solid var(--border)", 
          color: "var(--text-primary)", 
          fontSize: "12px", 
          gap: "6px",
          flex: 1
        }}
      >
        {isEditing ? <X size={14} /> : <Edit2 size={14} />}
        {isEditing ? "Cancelar" : "Editar Torneo"}
      </Button>
      
      <Button 
        onClick={handleDelete} 
        disabled={isDeleting}
        style={{ 
          background: "rgba(239, 68, 68, 0.1)", 
          border: "1px solid rgba(239, 68, 68, 0.2)", 
          color: "var(--red)", 
          fontSize: "12px", 
          gap: "6px",
          flex: 1
        }}
      >
        <Trash2 size={14} />
        {isDeleting ? "Eliminando..." : "Eliminar"}
      </Button>

      {isEditing && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="card-elevated" style={{ width: "100%", maxWidth: "400px", padding: "20px", position: "relative" }}>
             <button 
               onClick={() => setIsEditing(false)}
               style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
             >
               <X size={20} />
             </button>
             <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Editar Torneo</h2>
             <TournamentUpdateForm 
               tournamentId={tournamentId} 
               initialData={tournament} 
               onSuccess={() => setIsEditing(false)} 
             />
          </div>
        </div>
      )}
    </div>
  );
}

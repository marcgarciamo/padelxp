import { CreateTournamentForm } from "@components/tournaments/create-tournament-form";
import { PageTransition } from "@components/ui/page-transition";

export default function CreateTournamentPage() {
  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Crear Torneo</h1>
        <CreateTournamentForm />
      </div>
    </PageTransition>
  );
}

import { db } from "@db/index";
import { postmatchFlows, postmatchValidations } from "@db/schema";
import { eq, and, exists } from "drizzle-orm";
import ModerationCard from "./ModerationCard";

export default async function AdminModerationPage() {
  // Flows in pending_validation that have at least one rejection (confirms: false)
  const disputedFlows = await db.query.postmatchFlows.findMany({
    where: and(
      eq(postmatchFlows.status, "pending_validation"),
      exists(
        db.select().from(postmatchValidations).where(
          and(
            eq(postmatchValidations.flowId, postmatchFlows.id),
            eq(postmatchValidations.confirms, false),
          )
        )
      )
    ),
    with: {
      validations: {
        with: {
          player: { columns: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Moderación</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {disputedFlows.length} flujos disputados pendientes de resolución
        </p>
      </div>

      {disputedFlows.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-600 text-sm">Sin disputas pendientes</p>
        </div>
      )}

      <div className="space-y-4">
        {disputedFlows.map((flow) => (
          <ModerationCard key={flow.id} flow={flow} />
        ))}
      </div>
    </div>
  );
}

"use client";

export default function DashboardError({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-950/30 border border-red-800 rounded-xl max-w-2xl">
      <h2 className="text-red-400 font-semibold mb-2">Error en dashboard</h2>
      <pre className="text-xs text-red-300 whitespace-pre-wrap">{error.message}</pre>
      {error.stack && (
        <pre className="text-xs text-zinc-500 whitespace-pre-wrap mt-2">{error.stack}</pre>
      )}
    </div>
  );
}

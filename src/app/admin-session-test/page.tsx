import { getAdminSession } from "@lib/admin-session";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminSessionTestPage() {
  const store = await cookies();
  const allCookies = store.getAll();
  const session = await getAdminSession();

  return (
    <pre style={{ padding: 20, fontFamily: "monospace", fontSize: 12 }}>
      {JSON.stringify({
        cookies: allCookies.map((c) => ({ name: c.name, length: c.value.length })),
        session,
      }, null, 2)}
    </pre>
  );
}

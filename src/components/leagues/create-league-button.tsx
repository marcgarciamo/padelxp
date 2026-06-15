import Link from "next/link";

export function CreateLeagueButton() {
  return (
    <Link
      href="/leagues/create"
      style={{
        background:     "var(--accent)",
        color:          "#fff",
        padding:        "7px 14px",
        borderRadius:   "20px",
        fontSize:       "12px",
        fontWeight:     500,
        textDecoration: "none",
      }}
    >
      + Crear liga
    </Link>
  );
}

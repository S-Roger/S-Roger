import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function handleApiError(err: unknown) {
  if (err instanceof AuthError) {
    const status = err.code === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: err.code === "UNAUTHENTICATED" ? "Nicht angemeldet." : "Keine Berechtigung." }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "Ein unerwarteter Fehler ist aufgetreten." }, { status: 500 });
}

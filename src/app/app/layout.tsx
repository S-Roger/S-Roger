import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Shell variant="member" user={user} badge="Lernbereich">
      {children}
    </Shell>
  );
}

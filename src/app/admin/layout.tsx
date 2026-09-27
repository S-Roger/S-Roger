import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/app");

  return (
    <Shell variant="admin" user={user} badge="Admin">
      {children}
    </Shell>
  );
}

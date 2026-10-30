import { requireRole } from "@/lib/auth/guards";
import { ProfilePageContent } from "@/components/profile/profile-page";

export default async function AdminProfilePage() {
  await requireRole("admin");
  return <ProfilePageContent />;
}

import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, getAdminSecret } from "@/lib/adminAuth";
import { AdminClient } from "./ui";

export const metadata = {
  title: "Admin | Celine Hair Braiding",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const secret = getAdminSecret();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const authed = cookieValue === secret;

  return <AdminClient authed={authed} />;
}

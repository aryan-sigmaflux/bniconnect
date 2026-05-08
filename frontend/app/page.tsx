import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  // Decode token to check admin status
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.is_admin) {
      redirect("/admin");
    }
  } catch {
    // ignore decode errors
  }

  redirect("/explore");
}

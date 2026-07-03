import { redirect } from "next/navigation";

// The home path just forwards to the dashboard. Middleware sends unauthenticated
// visitors to /login automatically.
export default function Home() {
  redirect("/dashboard");
}

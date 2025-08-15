import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthenticatedHomePage } from "@/components/authenticated-home-page"

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <AuthenticatedHomePage user={user} />
}

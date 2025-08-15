import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export function createClient() {
  const cookieStore = cookies()

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      storage: {
        getItem: (key: string) => {
          const cookie =
            cookieStore.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`) ||
            cookieStore.get("sb-access-token") ||
            cookieStore.get(key)
          return cookie?.value || null
        },
        setItem: (key: string, value: string) => {
          try {
            cookieStore.set(key, value, {
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            })
          } catch {
            // Ignore if called from Server Component
          }
        },
        removeItem: (key: string) => {
          try {
            cookieStore.delete(key)
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    },
  })
}

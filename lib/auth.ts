export interface User {
  id: string
  email: string
}

export interface AuthResponse {
  user: User | null
  session: {
    access_token: string
    refresh_token: string
  } | null
  error: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        user: null,
        session: null,
        error: data.error_description || data.message || "Login failed",
      }
    }

    return {
      user: data.user,
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      },
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      session: null,
      error: "Network error occurred",
    }
  }
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        user: null,
        session: null,
        error: data.error_description || data.message || "Signup failed",
      }
    }

    return {
      user: data.user,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }
        : null,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      session: null,
      error: "Network error occurred",
    }
  }
}

export async function getUser(
  accessToken?: string,
): Promise<{ user: User | null; error: string | null; access_token?: string } | null> {
  if (!accessToken) {
    const { accessToken } = getAuthCookies()
    if (!accessToken) {
      return null
    }
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    })

    if (!response.ok) {
      return { user: null, error: "Failed to get user" }
    }

    const user = await response.json()
    return { user, error: null, access_token: accessToken }
  } catch (error) {
    return { user: null, error: "Network error occurred" }
  }
}

// Cookie helpers
export function setAuthCookies(accessToken: string, refreshToken: string) {
  if (typeof document !== "undefined") {
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax`
    document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`
  }
}

export function clearAuthCookies() {
  if (typeof document !== "undefined") {
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }
}

export function getAuthCookies(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof document === "undefined") {
    return { accessToken: null, refreshToken: null }
  }

  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      acc[key] = value
      return acc
    },
    {} as Record<string, string>,
  )

  return {
    accessToken: cookies["sb-access-token"] || null,
    refreshToken: cookies["sb-refresh-token"] || null,
  }
}

export async function signOut(): Promise<void> {
  clearAuthCookies()
}

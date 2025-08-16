export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
  error: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        user: null,
        session: null,
        error: data.msg || data.error_code || "Login failed",
      };
    }

    return {
      user: data.user,
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      },
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: "Network error occurred",
    };
  }
}

export async function signUp(
  email: string,
  password: string,
): Promise<AuthResponse> {
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
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        user: null,
        session: null,
        error: data.msg || data.error_code || "Signup failed",
      };
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
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: "Network error occurred",
    };
  }
}

export async function refreshAccessToken(): Promise<{
  access_token: string | null;
  refresh_token: string | null;
  error: string | null;
}> {
  const { refreshToken } = getAuthCookies();

  if (!refreshToken) {
    return {
      access_token: null,
      refresh_token: null,
      error: "No refresh token available",
    };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[v0] Token refresh failed:", data);
      return {
        access_token: null,
        refresh_token: null,
        error: data.msg || data.error_code || "Token refresh failed",
      };
    }

    // Update cookies with new tokens
    setAuthCookies(data.access_token, data.refresh_token);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      error: null,
    };
  } catch (error) {
    console.error("[v0] Token refresh error:", error);
    return {
      access_token: null,
      refresh_token: null,
      error: "Network error during token refresh",
    };
  }
}

export async function getUser(providedAccessToken?: string): Promise<{
  user: User | null;
  error: string | null;
  access_token?: string;
} | null> {
  let tokenToUse = providedAccessToken;

  if (!tokenToUse) {
    const { accessToken } = getAuthCookies();
    if (!accessToken) {
      return null;
    }
    tokenToUse = accessToken;
  }

  if (!tokenToUse || tokenToUse.split(".").length !== 3) {
    return { user: null, error: "Invalid token format" };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (response.status === 401) {
      console.log("[v0] Access token expired, attempting refresh...");

      const refreshResult = await refreshAccessToken();

      if (refreshResult.error || !refreshResult.access_token) {
        console.error("[v0] Token refresh failed:", refreshResult.error);
        clearAuthCookies(); // Clear invalid tokens
        return { user: null, error: "Session expired, please login again" };
      }

      // Retry with new token
      const retryResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${refreshResult.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
      });

      if (!retryResponse.ok) {
        console.error(
          "[v0] Failed to get user after token refresh:",
          retryResponse.status,
        );
        clearAuthCookies();
        return { user: null, error: "Authentication failed" };
      }

      const user = await retryResponse.json();
      return { user, error: null, access_token: refreshResult.access_token };
    }

    if (!response.ok) {
      console.error(
        "[v0] Failed to get user:",
        response.status,
        response.statusText,
      );
      return { user: null, error: "Failed to get user" };
    }

    const user = await response.json();
    return { user, error: null, access_token: tokenToUse };
  } catch (error) {
    console.error("[v0] Network error in getUser:", error);
    return { user: null, error: "Network error occurred" };
  }
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  if (typeof document !== "undefined") {
    // Access token expires in 1 hour
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax; Secure`;
    // Refresh token expires in 30 days
    document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax; Secure`;
  }
}

export function clearAuthCookies() {
  if (typeof document !== "undefined") {
    document.cookie =
      "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export function getAuthCookies(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof document === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    accessToken: cookies["sb-access-token"] || null,
    refreshToken: cookies["sb-refresh-token"] || null,
  };
}

export async function signOut(): Promise<void> {
  clearAuthCookies();
}

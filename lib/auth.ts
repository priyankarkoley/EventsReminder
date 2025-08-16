import { createClient, User, Session } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      console.log(error)
      return {
        user: null,
        session: null,
        error: error?.message || 'Login failed',
      };
    }
    setAuthCookies(data.session.access_token, data.session.refresh_token);
    startAutoRefresh();
    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: error?.message || 'Network error occurred',
    };
  }
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.session) {
      return {
        user: null,
        session: null,
        error: error?.message || 'Signup failed',
      };
    }
    setAuthCookies(data.session.access_token, data.session.refresh_token);
    startAutoRefresh();
    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: error?.message || 'Network error occurred',
    };
  }
}

export async function refreshAccessToken(): Promise<{
  access_token: string | null;
  refresh_token: string | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      return {
        access_token: null,
        refresh_token: null,
        error: error?.message || 'Token refresh failed',
      };
    }
    setAuthCookies(data.session.access_token, data.session.refresh_token);
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      error: null,
    };
  } catch (error: any) {
    return {
      access_token: null,
      refresh_token: null,
      error: error?.message || 'Network error during token refresh',
    };
  }
}

export async function getUser(): Promise<{
  user: User | null;
  error: string | null;
}> {
  try {
    let accessToken: string | null = null;
    if (typeof document !== 'undefined') {
      // Client-side: get from cookies
      accessToken = getAuthCookies().accessToken;
    } else if (typeof require !== 'undefined') {
      // Server-side: try to get from next/headers if available
      try {
        const { cookies } = require('next/headers');
        accessToken = cookies().get('sb-access-token')?.value || null;
      } catch {}
    }
    if (!accessToken) {
      return { user: null, error: 'Auth session missing!' };
    }
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      console.log(error);
      return { user: null, error: error.message };
    }
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error?.message || 'Network error occurred' };
  }
}
// Start auto-refresh of session tokens
export function startAutoRefresh() {
  supabase.auth.startAutoRefresh();
}

// Stop auto-refresh of session tokens
export function stopAutoRefresh() {
  supabase.auth.stopAutoRefresh();
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  if (typeof document !== 'undefined') {
    // Access token expires in 1 hour
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax; Secure`;
    // Refresh token expires in 30 days
    document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax; Secure`;
  }
}

export function clearAuthCookies() {
  if (typeof document !== 'undefined') {
    document.cookie =
      'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie =
      'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function getAuthCookies(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof document === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }

  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    accessToken: cookies['sb-access-token'] || null,
    refreshToken: cookies['sb-refresh-token'] || null,
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  clearAuthCookies();
  stopAutoRefresh();
}

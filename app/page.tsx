import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthenticatedHomePage } from '@/components/authenticated-home-page';
import { cookies } from 'next/headers';
import { showToast } from '@/lib/toast';

export default async function HomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  if (!accessToken) {
    showToast.error('No Access Token found. Please log in.');
    redirect('/auth/login');
  }

  const { user, error } = await getUser();

  if (!user || error) {
    showToast.error(error || 'Failed to fetch user data. Please log in again.');
    redirect('/auth/login');
  }

  // Ensure user prop matches expected type
  return (
    <AuthenticatedHomePage user={{ id: user!.id, email: user!.email ?? '' }} />
  );
}

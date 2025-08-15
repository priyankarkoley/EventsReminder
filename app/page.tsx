import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthenticatedHomePage } from '@/components/authenticated-home-page';
import { cookies } from 'next/headers';

export default async function HomePage() {
	const cookieStore = cookies();
	const accessToken = cookieStore.get('sb-access-token')?.value;

	if (!accessToken) {
		redirect('/auth/login');
	}

	const { user, error } = await getUser(accessToken);

	if (!user || error) {
		redirect('/auth/login');
	}

	return <AuthenticatedHomePage user={user} />;
}

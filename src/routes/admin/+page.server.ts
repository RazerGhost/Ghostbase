import { getAdminState } from '$lib/server/admin-state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { state: await getAdminState() };
};

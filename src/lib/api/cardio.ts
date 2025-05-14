import type { Cardio } from '$lib/types';
import { get } from 'svelte/store';
import { userStore } from '$lib/stores/user';
const BACK_END_URL = import.meta.env.VITE_BACK_END_URL;

export async function fetchCardioForLastSevenDays(): Promise<Cardio[] | null> {
    const { user, token } = get(userStore);
    if (!user?.id || !token) {
        console.error('Missing user ID or token in userStore');
        return null;
    }

    try {
        const res = await fetch(`${BACK_END_URL}/cardio/${user.id}/date/last-seven-days`);
        if (res.status === 204) return null;
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Error fetching cardio:', err);
        return [];
    }
}

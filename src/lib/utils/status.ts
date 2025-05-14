import { writable } from 'svelte/store';

export const statusMessage = writable<{ message: string; type: string } | null>(null);

export function showStatus(message: string, type = 'info') {
	statusMessage.set({ message, type });
	setTimeout(() => statusMessage.set(null), 5000);
}
import { browser } from '$app/environment';

export function safeLocalStorageGet(key: string): string | null {
	return browser ? localStorage.getItem(key) : null;
}

export function safeLocalStorageSet(key: string, value: string): void {
	if (browser) localStorage.setItem(key, value);
}
export function safeLocalStorageRemove(key: string): void {
	if (browser) localStorage.removeItem(key);
}
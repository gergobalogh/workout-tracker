import { writable, derived, get } from 'svelte/store';
import {
    safeLocalStorageGet,
    safeLocalStorageRemove,
    safeLocalStorageSet
} from '../utils/localStorage';
import type { User } from '@supabase/supabase-js';

type UserStore = {
    user: User | null;
    token: string | null;
    set: (user: User) => void;
    setToken: (token: string) => void;
    clear: () => void;
    subscribe: typeof combined.subscribe;
};

// Writable internal stores
const _user = writable<User | null>(null);
const _token = writable<string | null>(null);

const storedUser = safeLocalStorageGet('user');
const storedToken = safeLocalStorageGet('token');

if (storedUser) {
    try {
        _user.set(JSON.parse(storedUser));
    } catch (e) {
        console.error('Failed to parse stored user:', e);
    }
}
if (storedToken) {
    _token.set(storedToken);
}

// Combine into one derived store for reactive subscriptions
const combined = derived([_user, _token], ([$user, $token]) => ({
    user: $user,
    token: $token
}));

export const userStore: UserStore = {
    get user() {
        return get(_user);
    },
    get token() {
        return get(_token);
    },

    set(user: User) {
        _user.set(user);
        safeLocalStorageSet('user', JSON.stringify(user));
    },

    setToken(token: string) {
        _token.set(token);
        safeLocalStorageSet('token', token);
    },

    clear() {
        _user.set(null);
        _token.set(null);
        safeLocalStorageRemove('user');
        safeLocalStorageRemove('token');
    },
    subscribe: combined.subscribe
};

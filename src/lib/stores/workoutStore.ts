import { get, writable } from 'svelte/store';
import type { Workout } from '../types';
import {
    safeLocalStorageGet,
    safeLocalStorageSet,
    safeLocalStorageRemove
} from '../utils/localStorage';

const STORAGE_KEY = 'workout';

// Try to load from localStorage
let storedWorkout: Workout | null = null;
const storedValue = safeLocalStorageGet(STORAGE_KEY);
if (storedValue) {
    try {
        storedWorkout = JSON.parse(storedValue);
    } catch (e) {
        console.error('Failed to parse stored demo:', e);
    }
}

export const workoutStore = writable<Workout>(storedWorkout);

// Persist changes to localStorage
workoutStore.subscribe((value) => {
    try {
        safeLocalStorageSet(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to save demo to localStorage:', e);
    }
});

export const clearWorkout = () => {
    safeLocalStorageRemove(STORAGE_KEY);
    workoutStore.set(undefined);
};

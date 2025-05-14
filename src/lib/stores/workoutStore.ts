import { get, writable } from 'svelte/store';
import type { Workout } from '../types';
import {
    safeLocalStorageGet,
    safeLocalStorageSet,
    safeLocalStorageRemove
} from '../utils/localStorage';

const STORAGE_KEY = 'workout';

const initialWorkout: Workout = {
    workout_name: '',
    warm_up: '',
    exercises: [],
    cardio: {
        type: '',
        distance: 0,
        description: '',
        completed: false
    },
    cool_down: ''
};

// Try to load from localStorage
let storedWorkout: Workout = initialWorkout;
const storedValue = safeLocalStorageGet(STORAGE_KEY);
if (storedValue) {
    try {
        storedWorkout = JSON.parse(storedValue);
    } catch (e) {
        console.error('Failed to parse stored workout:', e);
    }
}

export const workoutStore = writable<Workout>(storedWorkout);

// Persist changes to localStorage
workoutStore.subscribe((value) => {
    try {
        safeLocalStorageSet(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to save workout to localStorage:', e);
    }
});

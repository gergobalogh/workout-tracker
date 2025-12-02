import { writable } from 'svelte/store';
import type { Workout } from '../types';

export const workoutStore = writable<Workout>(null);

export const clearWorkout = () => {
    workoutStore.set(null);
};

import { get } from 'svelte/store';
import { userStore } from '$lib/stores/user';
import type { Exercise } from '$lib/types';

function formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return new Date(date).toISOString().split('T')[0];
}

// export async function fetchExercisesForDate(date: Date | string): Promise<Exercise[]> {
//
//     try {
//         const res = await fetch(`${BACK_END_URL}/exercises/${userId}/date/${formatDate(date)}`);
//         if (!res.ok) throw new Error(`API error: ${res.status}`);
//         return await res.json();
//     } catch (err) {
//         console.error('Error fetching exercises:', err);
//         return [];
//     }
// }

//
// export async function saveCardioEntry(cardioData: CardioEntry): Promise<CardioEntry> {
//     const userId = getUserId();
//     if (!userId) throw new Error('Missing user ID');
//
//     const res = await fetch(`${BACK_END_URL}/cardio/${userId}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(cardioData)
//     });
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//     return await res.json();
// }
//
// export async function saveExerciseEntry(exerciseData: Exercise): Promise<boolean> {
//     const userId = getUserId();
//     if (!userId) throw new Error('Missing user ID');
//
//     const res = await fetch(`${BACK_END_URL}/exercises/${userId}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(exerciseData)
//     });
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//     return true;
// }
//
// export async function fetchLatestExerciseStats(exerciseName: string): Promise<any | null> {
//     const userId = getUserId();
//     if (!userId) return null;
//
//     try {
//         const res = await fetch(`${BACK_END_URL}/exercises/${userId}/${exerciseName}/latest`);
//         if (res.status === 404) return null;
//         const data = await res.json();
//         if (data.error) return null;
//         if (!res.ok) throw new Error(`API error: ${res.status}`);
//         return data;
//     } catch (err) {
//         console.error(`Error fetching stats for ${exerciseName}:`, err);
//         return null;
//     }
// }
//
// export async function fetchAndGenerateWorkout(
//   lastWeek: any,
//   lastWeekCardio: any,
//   testMode = false
// ): Promise<any> {
//     const u = getUser();
//     if (!u) throw new Error('Missing user');
//
//     const res = await fetch(`${BACK_END_URL}/demo/demo${testMode ? '?test=true' : ''}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             goal: u.goal,
//             previousWorkoutData: lastWeek?.data,
//             previousCardioData: lastWeekCardio?.data
//         })
//     });
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//     return await res.json();
// }
//
// export async function critiqueWorkout(demo: string, testMode = false): Promise<any> {
//     const u = getUser();
//     if (!u) throw new Error('Missing user');
//
//     const res = await fetch(`${BACK_END_URL}/demo/critique-demo${testMode ? '?test=true' : ''}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ goal: u.goal, demo })
//     });
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//     return await res.json();
// }
//
// export async function optimizeWorkout(demo: string, feedback: string, testMode = false): Promise<any> {
//     const res = await fetch(`${BACK_END_URL}/demo/demo-optimization${testMode ? '?test=true' : ''}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ demo, feedback })
//     });
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//     return await res.json();
// }
//
// export async function convertWorkoutToJson(demo: string, testMode = false): Promise<any> {
//     const res = await fetch(`${BACK_END_URL}/demo/demo-to-json${testMode ? '?test=true' : ''}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ demo })
//     });
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//
//     const jsonString = await res.json();
//     return JSON.parse(jsonString);
// }

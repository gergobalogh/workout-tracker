import type { PageServerLoad } from './$types';
//@TODO I will use this in the first page where I would display the levels you can achieve.
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const { data: colors } = await supabase.from('colors').select('name').limit(5).order('name');
    return { colors: colors ?? [] };
    // const session = await safeGetSession();
    //
    // // If logged in, redirect to dashboard
    // if (session) {
    // 	redirect(303, '/app/dashboard');
    // }
};

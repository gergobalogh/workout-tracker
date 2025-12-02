import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import { ENVIRONMENT } from '$env/static/private';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
const isDev = ENVIRONMENT === 'dev';

const supabase: Handle = async ({ event, resolve }) => {
    /**
     * Creates a Supabase client specific to this server request.
     */
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    try {
                        event.cookies.set(name, value, {
                            ...options,
                            path: '/',
                            sameSite: isDev ? 'lax' : 'none',
                            secure: !isDev
                        });
                    } catch (error) {
                        // Ignore cookie setting errors after response has been sent
                        if (error instanceof Error && !error.message.includes('after the response has been generated')) {
                            console.error('Cookie setting error:', error);
                        }
                    }
                });
            }
        }
    });

    /**
     * Creates a safe session getter that handles potential errors
     */
    event.locals.safeGetSession = async () => {
        const {
            data: { session },
            error
        } = await event.locals.supabase.auth.getSession();

        if (error) {
            console.error('Session error:', error);
            return { session: null, user: null };
        }

        return { session, user: session?.user ?? null };
    };

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version';
        }
    });
};

export const handle: Handle = supabase;

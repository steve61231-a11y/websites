// Is the real backend (Supabase sign-in, database, payments) switched on?
// With the two public Supabase settings present the app uses it; without
// them it runs as the self-contained demo (sample student, nothing saved on
// a server). These values are public by design: the "publishable" key only
// lets the browser do what the database's row-level security allows.

export const backendOn = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Show "Continue with Google" only once Google sign-in is configured in Supabase. */
export const googleAuthOn = backendOn && process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1";

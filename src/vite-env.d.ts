/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Set to 'hash' when deploying to static hosting with no URL rewriting. */
  readonly VITE_ROUTER?: 'hash' | 'history'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

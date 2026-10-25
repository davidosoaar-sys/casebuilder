// Headers for the app's own /api/* commands: the signed-in user's session (so
// the server can use the key they saved in Settings) and the workspace access
// code if one is stored (for the server's shared key).
// supabase.js is imported lazily: it reads Vite env, which Node tests don't have.
export async function apiHeaders(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra }
  try {
    if (typeof window === 'undefined' || !import.meta.env) return h
    const { supabase } = await import('./supabase.js')
    const { data } = await supabase?.auth.getSession() || {}
    const token = data?.session?.access_token
    if (token) h.Authorization = `Bearer ${token}`
  } catch {}
  return h
}

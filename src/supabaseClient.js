// Minimal Supabase client wrapper - safe if env vars not provided
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const hasSupabase = Boolean(url && key);
export const supabase = hasSupabase ? createClient(url, key) : null;

export async function signUpWithEmail(email, password, metadata = {}) {
  if (!hasSupabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({ email, password }, { data: metadata });
  if (error) throw error;
  return data;
}

export async function signInWithPassword(email, password) {
  if (!hasSupabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!hasSupabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!hasSupabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  if (!hasSupabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export function onAuthStateChange(callback) {
  if (!hasSupabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });
  const subscription = data?.subscription;
  return () => subscription?.unsubscribe?.();
}

export async function getProfile(userId) {
  if (!hasSupabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile) {
  if (!hasSupabase) return null;
  const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function getTopRanking(limit = 10) {
  if (!hasSupabase) return [];
  const { data, error } = await supabase.from('profiles').select('id, name, avatar_id, stats').limit(limit * 5);
  if (error) throw error;
  const sorted = (data || []).sort((a, b) => {
    const aScore = Number(a?.stats?.baguettes || 0);
    const bScore = Number(b?.stats?.baguettes || 0);
    return bScore - aScore;
  });
  return sorted.slice(0, limit);
}

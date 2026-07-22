import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseAnonKey = '';

// 1. Fallback for Node.js / Server environments (like Express or tests)
if (typeof process !== 'undefined' && process.env) {
  supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
}

// 2. Vite static replacements (Vite replaces these tokens literally during client bundle build)
if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  // @ts-ignore
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
  // @ts-ignore
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;
}

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'https://your-project-id.supabase.co' && 
  supabaseUrl.trim() !== '' &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseAnonKey.trim() !== '';

// Initialize client with placeholder if not configured to prevent crashes on startup
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://olmexwouxzqtdkuuthzo.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

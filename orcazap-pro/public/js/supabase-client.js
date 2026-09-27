import './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const config = window.ORCAZAP_CONFIG || {};
export const supabase = config.SUPABASE_URL && config.SUPABASE_ANON_KEY
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  : null;

export function isSupabaseConfigured(){ return Boolean(supabase); }

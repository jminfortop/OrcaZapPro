import { supabase, isSupabaseConfigured } from './supabase-client.js';

export { isSupabaseConfigured };

export async function getProfile(){
  if(!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return null;
  const { data, error } = await supabase.from('profiles').select('id,company_id,role,name,active').eq('id', user.id).single();
  if(error) throw error;
  return { user, profile:data };
}

export async function requireCompanySession(){
  if(!supabase) return null;
  const profile = await getProfile();
  if(!profile || !profile.profile.active || !['company','owner','admin'].includes(profile.profile.role)){
    window.location.replace('/login.html');
    return null;
  }
  window.ORCAZAP_SESSION = profile;
  return profile;
}

export async function requireAdminSession(){
  if(!supabase){ window.location.replace('/login.html'); return null; }
  const profile = await getProfile();
  if(!profile || !profile.profile.active || !['admin','owner'].includes(profile.profile.role)){
    window.location.replace('/login.html');
    return null;
  }
  window.ORCAZAP_SESSION = profile;
  return profile;
}

export async function signOut(){
  if(supabase) await supabase.auth.signOut();
  window.location.replace('/login.html');
}

window.supabaseSession = async () => (await supabase?.auth.getSession())?.data?.session || null;

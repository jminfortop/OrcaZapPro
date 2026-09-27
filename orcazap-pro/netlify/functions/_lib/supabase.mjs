import { createClient } from '@supabase/supabase-js';
export const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});
export async function bearer(event){return event.headers.authorization?.replace(/^Bearer\s+/i,'')||'';}
export async function userFromEvent(event){const token=await bearer(event);if(!token) return null;const {data,error}=await admin.auth.getUser(token);return error?null:data.user;}
export function json(statusCode, body){return {statusCode,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)}}
export async function hashToken(token){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}

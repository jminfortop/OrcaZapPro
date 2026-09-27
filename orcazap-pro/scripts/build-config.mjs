import { writeFileSync } from 'node:fs';
const url=process.env.SUPABASE_URL||''; const key=process.env.SUPABASE_ANON_KEY||'';
writeFileSync('public/js/config.js', `window.ORCAZAP_CONFIG = ${JSON.stringify({SUPABASE_URL:url,SUPABASE_ANON_KEY:key})};\n`);

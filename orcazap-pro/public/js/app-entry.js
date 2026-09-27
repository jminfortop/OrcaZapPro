import { requireCompanySession, isSupabaseConfigured } from './auth.js';
import { bootstrapCloudState } from './cloud-sync.js';

async function start(){
  if(isSupabaseConfigured()) {
    const session = await requireCompanySession();
    if(!session) return;
    await bootstrapCloudState(session.profile.company_id);
  }
  const script = document.createElement('script');
  script.src = '/js/app.js';
  script.onload = () => window.App?.init?.();
  document.body.appendChild(script);
}
start().catch((error) => { console.error(error); alert('Não foi possível carregar sua conta.'); });

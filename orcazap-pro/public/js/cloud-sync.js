import { supabase } from './supabase-client.js';

const keys = { company:'orcazap_company', settings:'orcazap_settings', clients:'orcazap_clients', catalog:'orcazap_catalog', quotes:'orcazap_quotes', receipts:'orcazap_receipts', card:'orcazap_card' };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

async function loadTable(table, companyId){
  const { data, error } = await supabase.from(table).select('*').eq('company_id', companyId);
  if(error) throw error;
  return data || [];
}

export async function bootstrapCloudState(companyId){
  if(!supabase) return;
  const [company, settings, clients, catalog, quotes, receipts, card] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('company_settings').select('*').eq('company_id', companyId).maybeSingle(),
    loadTable('clients', companyId), loadTable('catalog_items', companyId), loadTable('quotes', companyId), loadTable('receipts', companyId),
    supabase.from('digital_cards').select('*').eq('company_id', companyId).maybeSingle(),
  ]);
  if(company.data) save(keys.company, {name:company.data.name||'',doc:company.data.document||'',phone:company.data.phone||'',whatsapp:company.data.whatsapp||'',email:company.data.email||'',address:company.data.address||'',color1:company.data.color_primary||'#2563eb',color2:company.data.color_secondary||'#16a34a',pixKey:company.data.pix_key||'',pixName:company.data.pix_name||'',pixCity:company.data.pix_city||'',logo:company.data.logo_url||''});
  if(settings.data) save(keys.settings, {prefix:settings.data.prefix||'ORC',validity:settings.data.validity_days||7,payment:settings.data.payment||'',deadline:settings.data.deadline||'',warranty:settings.data.warranty||'',terms:settings.data.terms||'',followup:settings.data.followup_days||3,counter:settings.data.quote_counter||0,receiptCounter:settings.data.receipt_counter||0});
  save(keys.clients, clients.map(x=>({id:x.id,name:x.name,whatsapp:x.whatsapp||'',phone:x.phone||'',email:x.email||'',doc:x.document||'',address:x.address||'',district:x.district||'',zip:x.zip||'',city:x.city||'',state:x.state||'',notes:x.notes||'',createdAt:x.created_at})));
  save(keys.catalog, catalog.map(x=>({id:x.id,name:x.name,desc:x.description||'',category:x.category||'',type:x.type||'servico',unit:x.unit||'un',price:Number(x.price_cents||0)/100,cost:Number(x.cost_cents||0)/100,active:x.active!==false})));
  save(keys.quotes, quotes.map(x=>({...x,clientId:x.client_id,subtotal:Number(x.subtotal_cents||0)/100,discount:Number(x.discount_cents||0)/100,additional:Number(x.additional_cents||0)/100,freight:Number(x.freight_cents||0)/100,total:Number(x.total_cents||0)/100,validity:x.validity_days,validityDate:x.validity_date,createdAt:x.created_at,updatedAt:x.updated_at,items:x.items||[]})));
  save(keys.receipts, receipts.map(x=>({...x,clientId:x.client_id,quoteId:x.quote_id,value:Number(x.value_cents||0)/100,createdAt:x.created_at})));
  if(card.data) save(keys.card, {profession:card.data.profession||'',desc:card.data.description||'',city:card.data.city||'',insta:card.data.instagram||'',fb:card.data.facebook||''});
}

export async function saveState(state){
  if(!supabase || !window.ORCAZAP_SESSION?.profile?.company_id) return;
  const companyId=window.ORCAZAP_SESSION.profile.company_id;
  const c=state.company;
  await supabase.from('companies').update({name:c.name||'',document:c.doc||'',phone:c.phone||'',email:c.email||'',logo_url:c.logo||''}).eq('id',companyId);
  await supabase.from('company_settings').upsert({company_id:companyId,prefix:state.settings.prefix||'ORC',validity_days:state.settings.validity||7,payment:state.settings.payment||'',deadline:state.settings.deadline||'',warranty:state.settings.warranty||'',terms:state.settings.terms||'',followup_days:state.settings.followup||3,quote_counter:state.settings.counter||0,receipt_counter:state.settings.receiptCounter||0});
  if(state.card) await supabase.from('digital_cards').upsert({company_id:companyId,profession:state.card.profession||'',description:state.card.desc||'',city:state.card.city||'',instagram:state.card.insta||'',facebook:state.card.fb||''});
  if(state.clients.length) await supabase.from('clients').upsert(state.clients.map(x=>({id:x.id,company_id:companyId,name:x.name,whatsapp:x.whatsapp||'',phone:x.phone||'',email:x.email||'',document:x.doc||'',address:x.address||'',district:x.district||'',zip:x.zip||'',city:x.city||'',state:x.state||'',notes:x.notes||'',created_at:x.createdAt||new Date().toISOString(),updated_at:new Date().toISOString()})));
  if(state.catalog.length) await supabase.from('catalog_items').upsert(state.catalog.map(x=>({id:x.id,company_id:companyId,name:x.name,description:x.desc||'',category:x.category||'',type:x.type||'servico',unit:x.unit||'un',price_cents:Math.round((Number(x.price)||0)*100),cost_cents:Math.round((Number(x.cost)||0)*100),active:x.active!==false,updated_at:new Date().toISOString()})));
  if(state.quotes.length){
    for(const q of state.quotes){
      await supabase.from('quotes').upsert({id:q.id,company_id:companyId,client_id:q.clientId||null,number:q.number,status:q.status,subtotal_cents:Math.round((q.subtotal||0)*100),discount_cents:Math.round((q.discount||0)*100),additional_cents:Math.round((q.additional||0)*100),freight_cents:Math.round((q.freight||0)*100),total_cents:Math.round((q.total||0)*100),payment:q.payment||'',validity_days:q.validity||7,validity_date:q.validityDate,deadline:q.deadline||'',warranty:q.warranty||'',notes:q.notes||'',show_pix:q.showPix!==false,sent_at:q.sentAt||null,viewed_at:q.viewedAt||null,approved_at:q.approvedAt||null,rejected_at:q.rejectedAt||null,signed_at:q.signatureAt||null,created_at:q.createdAt,updated_at:q.updatedAt||new Date().toISOString()});
      if(q.items?.length) await supabase.from('quote_items').upsert(q.items.map((i,pos)=>({id:i.id,quote_id:q.id,position:pos,name_snapshot:i.name||'Item',description_snapshot:i.desc||'',unit_snapshot:i.unit||'un',quantity:Number(i.qty)||0,unit_price_cents:Math.round((Number(i.price)||0)*100),total_cents:Math.round((Number(i.qty)||0)*(Number(i.price)||0)*100)})));
    }
  }
}
window.OrcaCloud = { saveState };

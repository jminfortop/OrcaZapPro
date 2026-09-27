/* =========================================================
   OrçaZAP Pro v2.0 - Aplicação completa
   ========================================================= */

window.App = (() => {

  /* ---------- STATE ---------- */
  const state = {
    company: { logo:'', name:'', doc:'', phone:'', whatsapp:'', email:'', address:'', color1:'#2563eb', color2:'#16a34a', pixKey:'', pixName:'', pixCity:'' },
    settings: { prefix:'ORC', validity:7, payment:'', deadline:'', warranty:'', terms:'', followup:3, counter:0, receiptCounter:0 },
    clients: [],
    catalog: [],
    quotes: [],
    receipts: [],
    card: { profession:'', desc:'', city:'', insta:'', fb:'' },
    ui: {
      currentQuoteId: null,
      currentQuoteItems: [],
      currentQuoteClientId: null,
      editingQuoteId: null,
      currentPDFBlob: null,
      currentPDFFilename: null,
      signatureData: null,
      voiceRecognition: null,
      voiceListening: false,
      docType: 'quote',
      logoGen: { title:'', subtitle:'', icon:'fa-briefcase', color1:'#2563eb', color2:'#1e40af', style:'modern' }
    }
  };

  window.OrcaState = state;

  /* ---------- UTILS ---------- */
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (s) => (s==null?'':String(s)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const brl = (v) => 'R$ ' + (Number(v)||0).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const todayISO = () => new Date().toISOString().slice(0,10);
  const fmtDate = (iso) => { if(!iso) return '-'; const d = new Date(iso); return d.toLocaleDateString('pt-BR'); };
  const fmtDateTime = (iso) => { if(!iso) return '-'; const d = new Date(iso); return d.toLocaleString('pt-BR'); };
  const initials = (n) => (n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  const onlyDigits = (s) => (s||'').replace(/\D/g,'');
  const toast = (msg, ms=2400) => {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(()=>t.classList.remove('show'), ms);
  };
  const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){ console.warn('saveLS',e); } };
  const loadLS = (k, d) => { try { const v = localStorage.getItem(k); return v?JSON.parse(v):d; } catch(e){ return d; } };

  /* ---------- ICONES DISPONÍVEIS PARA LOGO ---------- */
  const LOGO_ICONS = [
    {k:'fa-briefcase',l:'Negócios'},{k:'fa-laptop-code',l:'TI'},{k:'fa-wrench',l:'Serviços'},
    {k:'fa-screwdriver-wrench',l:'Manutenção'},{k:'fa-paint-roller',l:'Pintura'},{k:'fa-hammer',l:'Construção'},
    {k:'fa-bolt',l:'Elétrica'},{k:'fa-plug',l:'Instalação'},{k:'fa-car',l:'Automotivo'},
    {k:'fa-motorcycle',l:'Motos'},{k:'fa-utensils',l:'Alimentação'},{k:'fa-cake-candles',l:'Confeitaria'},
    {k:'fa-scissors',l:'Beleza'},{k:'fa-spa',l:'Estética'},{k:'fa-dumbbell',l:'Fitness'},
    {k:'fa-camera',l:'Fotografia'},{k:'fa-music',l:'Música'},{k:'fa-video',l:'Vídeo'},
    {k:'fa-graduation-cap',l:'Educação'},{k:'fa-stethoscope',l:'Saúde'},{k:'fa-tooth',l:'Odonto'},
    {k:'fa-paw',l:'Pet'},{k:'fa-seedling',l:'Jardinagem'},{k:'fa-house-chimney',l:'Imóveis'},
    {k:'fa-key',l:'Chaves'},{k:'fa-shirt',l:'Moda'},{k:'fa-gem',l:'Joalheria'},
    {k:'fa-truck',l:'Transporte'},{k:'fa-plane',l:'Viagens'},{k:'fa-dragon',l:'Criativo'},
    {k:'fa-rocket',l:'Startups'},{k:'fa-shield-halved',l:'Segurança'},{k:'fa-scale-balanced',l:'Jurídico'},
    {k:'fa-calculator',l:'Contábil'},{k:'fa-chart-line',l:'Consultoria'},{k:'fa-lightbulb',l:'Ideias'},
    {k:'fa-crown',l:'Premium'},{k:'fa-fire',l:'Destaque'},{k:'fa-star',l:'Estrela'},
    {k:'fa-leaf',l:'Eco'},{k:'fa-sun',l:'Solar'},{k:'fa-droplet',l:'Hidráulica'}
  ];

  /* ---------- STORAGE ---------- */
  const Storage = {
    saveAll() {
      saveLS('orcazap_company', state.company);
      saveLS('orcazap_settings', state.settings);
      saveLS('orcazap_clients', state.clients);
      saveLS('orcazap_catalog', state.catalog);
      saveLS('orcazap_quotes', state.quotes);
      saveLS('orcazap_receipts', state.receipts);
      saveLS('orcazap_card', state.card);
      window.OrcaCloud?.saveState?.(state);
    },
    loadAll() {
      const c = loadLS('orcazap_company', null); if(c) Object.assign(state.company, c);
      const s = loadLS('orcazap_settings', null); if(s) Object.assign(state.settings, s);
      state.clients = loadLS('orcazap_clients', []);
      state.catalog = loadLS('orcazap_catalog', []);
      state.quotes  = loadLS('orcazap_quotes', []);
      state.receipts = loadLS('orcazap_receipts', []);
      const card = loadLS('orcazap_card', null); if(card) Object.assign(state.card, card);
      migrateLegacy();
    }
  };

  function migrateLegacy(){
    const oldCompany = loadLS('company', null);
    if(oldCompany && !state.company.name){
      Object.assign(state.company, {
        name: oldCompany.name || '',
        doc: oldCompany.doc || oldCompany.cnpj || '',
        phone: oldCompany.phone || '',
        whatsapp: oldCompany.whatsapp || oldCompany.phone || '',
        email: oldCompany.email || '',
        address: oldCompany.address || '',
        logo: oldCompany.logo || ''
      });
    }
    state.quotes.forEach(q => {
      q.status = q.status || 'draft';
      q.items = q.items || [];
      q.discount = q.discount || 0;
      q.additional = q.additional || 0;
      q.freight = q.freight || 0;
      q.createdAt = q.createdAt || q.date || new Date().toISOString();
    });
  }

  /* ---------- NUMERAÇÃO ---------- */
  function nextQuoteNumber(silent){
    state.settings.counter = (state.settings.counter||0) + 1;
    const year = new Date().getFullYear();
    const n = String(state.settings.counter).padStart(4,'0');
    const prefix = state.settings.prefix || 'ORC';
    if(!silent) Storage.saveAll();
    return `${prefix}-${year}-${n}`;
  }
  function nextReceiptNumber(){
    state.settings.receiptCounter = (state.settings.receiptCounter||0) + 1;
    const year = new Date().getFullYear();
    const n = String(state.settings.receiptCounter).padStart(4,'0');
    return `REC-${year}-${n}`;
  }

  /* ---------- NAVEGAÇÃO ---------- */
  function goto(page){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const el = $('page-'+page); if(el) el.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
    document.querySelectorAll('.side-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
    window.scrollTo({top:0,behavior:'instant'});
    if(page==='dashboard') renderDashboard();
    if(page==='quotes') renderQuotes();
    if(page==='clients') renderClients();
    if(page==='catalog') renderCatalog();
    if(page==='receipts') renderReceipts();
    if(page==='card') renderCard();
    if(page==='new') initNewQuote();
    if(page==='more') fillMore();
  }

  /* ---------- DASHBOARD ---------- */
  function renderDashboard(){
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthQuotes = state.quotes.filter(q => q.createdAt >= monthStart);
    const total = state.quotes.length;
    const drafts = state.quotes.filter(q=>q.status==='draft').length;
    const sent = state.quotes.filter(q=>q.status==='sent').length;
    const viewed = state.quotes.filter(q=>q.status==='viewed').length;
    const approved = state.quotes.filter(q=>q.status==='approved');
    const rejected = state.quotes.filter(q=>q.status==='rejected').length;
    const approvedValue = approved.reduce((s,q)=>s+(q.total||0),0);
    const pendingValue = state.quotes.filter(q=>['sent','viewed'].includes(q.status)).reduce((s,q)=>s+(q.total||0),0);

    const stats = [
      {v: total, l:'Total', c:'var(--brand)', i:'fa-file-invoice-dollar'},
      {v: drafts, l:'Rascunhos', c:'#64748b', i:'fa-pen'},
      {v: sent+viewed, l:'Aguardando', c:'var(--warn)', i:'fa-clock'},
      {v: approved.length, l:'Aprovados', c:'var(--ok)', i:'fa-circle-check'},
      {v: rejected, l:'Rejeitados', c:'var(--danger)', i:'fa-circle-xmark'},
      {v: brl(approvedValue), l:'Aprovado (mês)', c:'var(--ok)', i:'fa-coins'},
      {v: brl(pendingValue), l:'Pendente', c:'var(--warn)', i:'fa-hourglass-half'},
      {v: monthQuotes.length, l:'Este mês', c:'var(--brand)', i:'fa-calendar'},
    ];
    $('dash-stats').innerHTML = stats.map(s=>`
      <div class="stat">
        <div style="display:flex;align-items:center;gap:.4rem;color:${s.c}"><i class="fa-solid ${s.i}"></i></div>
        <div class="v" style="color:${s.c}">${escapeHtml(s.v)}</div>
        <div class="l">${escapeHtml(s.l)}</div>
      </div>`).join('');

    const days = state.settings.followup || 3;
    const cutoff = new Date(Date.now() - days*86400000).toISOString();
    const pending = state.quotes.filter(q => ['sent','viewed'].includes(q.status) && q.sentAt && q.sentAt < cutoff);
    $('dash-followup-count').textContent = pending.length;
    $('dash-followup-list').innerHTML = pending.length ? pending.slice(0,5).map(q=>{
      const c = state.clients.find(x=>x.id===q.clientId);
      const d = Math.floor((Date.now()-new Date(q.sentAt).getTime())/86400000);
      return `<div class="list-item" onclick="App.openQuoteDetail('${q.id}')">
        <div class="ava" style="background:var(--warn)">${initials(c?.name||'?')}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c?.name||'Cliente')}</div>
          <div style="font-size:.78rem;color:var(--muted)">${escapeHtml(q.number)} · enviado há ${d}d</div>
        </div>
        <button class="btn btn-wa" style="padding:.4rem .7rem;min-height:auto" onclick="event.stopPropagation();App.reminderWA('${q.id}')"><i class="fa-brands fa-whatsapp"></i></button>
      </div>`;
    }).join('') : `<div class="empty"><i class="fa-solid fa-bell-slash"></i><div>Nenhum follow-up pendente</div></div>`;

    const recent = [...state.quotes].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,5);
    $('dash-recent').innerHTML = recent.length ? recent.map(renderQuoteItem).join('') : `<div class="empty"><i class="fa-solid fa-inbox"></i><div>Nenhum orçamento ainda</div><button class="btn btn-primary" style="margin-top:.6rem" onclick="App.goto('new')"><i class="fa-solid fa-plus"></i> Criar primeiro</button></div>`;
  }

  /* ---------- QUOTES LIST ---------- */
  function statusChip(s){
    const map = {
      draft:{l:'Rascunho',c:'chip-muted'}, sent:{l:'Enviado',c:'chip-info'}, viewed:{l:'Visualizado',c:'chip-info'},
      approved:{l:'Aprovado',c:'chip-ok'}, rejected:{l:'Rejeitado',c:'chip-danger'},
      expired:{l:'Expirado',c:'chip-warn'}, cancelled:{l:'Cancelado',c:'chip-muted'}
    };
    const m = map[s] || map.draft;
    return `<span class="chip ${m.c}">${m.l}</span>`;
  }
  function renderQuoteItem(q){
    const c = state.clients.find(x=>x.id===q.clientId);
    return `<div class="list-item" onclick="App.openQuoteDetail('${q.id}')">
      <div class="ava">${initials(c?.name||'?')}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;gap:.4rem;align-items:center">
          <div style="font-weight:700;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c?.name||'Sem cliente')}</div>
          ${statusChip(q.status)}
        </div>
        <div style="font-size:.78rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(q.number)} · ${fmtDate(q.createdAt)} · <strong style="color:var(--brand)">${brl(q.total||0)}</strong></div>
      </div>
    </div>`;
  }
  function renderQuotes(){
    const q = ($('quotes-search').value||'').toLowerCase();
    const f = state.ui.quotesFilter || {};
    let list = [...state.quotes].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
    if(q) list = list.filter(x => {
      const c = state.clients.find(cl=>cl.id===x.clientId);
      return (c?.name||'').toLowerCase().includes(q) || (x.number||'').toLowerCase().includes(q);
    });
    if(f.status) list = list.filter(x=>x.status===f.status);
    if(f.client) list = list.filter(x=>x.clientId===f.client);
    if(f.period){
      const cut = new Date(Date.now() - Number(f.period)*86400000).toISOString();
      list = list.filter(x => (x.createdAt||'') >= cut);
    }
    $('quotes-list').innerHTML = list.length ? list.map(renderQuoteItem).join('') : `<div class="empty"><i class="fa-solid fa-inbox"></i><div>Nenhum orçamento encontrado</div></div>`;
  }

  /* ---------- CLIENTES ---------- */
  function renderClients(){
    const q = ($('clients-search').value||'').toLowerCase();
    let list = [...state.clients].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(q) list = list.filter(c => (c.name||'').toLowerCase().includes(q) || (c.whatsapp||'').includes(q) || (c.email||'').toLowerCase().includes(q));
    $('clients-list').innerHTML = list.length ? list.map(c=>{
      const qcount = state.quotes.filter(x=>x.clientId===c.id).length;
      const total = state.quotes.filter(x=>x.clientId===c.id && x.status==='approved').reduce((s,x)=>s+(x.total||0),0);
      return `<div class="list-item" onclick="App.openClientDetail('${c.id}')">
        <div class="ava">${initials(c.name)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.name)}</div>
          <div style="font-size:.78rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${escapeHtml(c.whatsapp||c.phone||'')} · ${qcount} orçamentos${total?` · ${brl(total)} aprovado`:''}
          </div>
        </div>
        <button class="btn btn-wa" style="padding:.4rem .7rem;min-height:auto" onclick="event.stopPropagation();App.waClient('${c.id}')"><i class="fa-brands fa-whatsapp"></i></button>
      </div>`;
    }).join('') : `<div class="empty"><i class="fa-solid fa-users-slash"></i><div>Nenhum cliente cadastrado</div><button class="btn btn-primary" style="margin-top:.6rem" onclick="App.openClientModal()"><i class="fa-solid fa-user-plus"></i> Cadastrar</button></div>`;
  }

  function openClientModal(id){
    $('client-modal-title').textContent = id ? 'Editar cliente' : 'Novo cliente';
    $('client-id').value = id || '';
    const c = id ? state.clients.find(x=>x.id===id) : {};
    $('client-name').value = c?.name || (state.ui.pendingClientName || '');
    $('client-whatsapp').value = c?.whatsapp || '';
    $('client-phone').value = c?.phone || '';
    $('client-email').value = c?.email || '';
    $('client-doc').value = c?.doc || '';
    $('client-address').value = c?.address || '';
    $('client-district').value = c?.district || '';
    $('client-zip').value = c?.zip || '';
    $('client-city').value = c?.city || '';
    $('client-state').value = c?.state || '';
    $('client-notes').value = c?.notes || '';
    state.ui.pendingClientName = '';
    openModal('modal-client');
  }

  function saveClient(){
    const id = $('client-id').value;
    const name = $('client-name').value.trim();
    if(!name){ toast('Nome é obrigatório'); return; }
    const data = {
      id: id || uid(),
      name,
      whatsapp: $('client-whatsapp').value.trim(),
      phone: $('client-phone').value.trim(),
      email: $('client-email').value.trim(),
      doc: $('client-doc').value.trim(),
      address: $('client-address').value.trim(),
      district: $('client-district').value.trim(),
      zip: $('client-zip').value.trim(),
      city: $('client-city').value.trim(),
      state: $('client-state').value.trim(),
      notes: $('client-notes').value.trim(),
      createdAt: id ? (state.clients.find(x=>x.id===id)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    if(id){
      const i = state.clients.findIndex(x=>x.id===id);
      if(i>=0) state.clients[i] = data;
    } else {
      state.clients.push(data);
    }
    Storage.saveAll();
    closeModal('modal-client');
    toast('Cliente salvo');
    renderClients();
    renderClientPicker();
    if(state.ui.editingQuoteId || state.ui.currentQuoteId || document.querySelector('.page.active').id==='page-new'){
      selectClient(data.id);
    }
  }

  function waClient(id){
    const c = state.clients.find(x=>x.id===id);
    if(!c){ toast('Cliente não encontrado'); return; }
    const phone = onlyDigits(c.whatsapp || c.phone);
    if(!phone){ toast('Cliente sem telefone'); return; }
    window.open(`https://wa.me/55${phone}`, '_blank');
  }

  function openClientDetail(id){
    const c = state.clients.find(x=>x.id===id); if(!c) return;
    const qs = state.quotes.filter(q=>q.clientId===id).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
    const totalApproved = qs.filter(q=>q.status==='approved').reduce((s,q)=>s+(q.total||0),0);
    const body = `
      <div style="display:flex;gap:.8rem;align-items:center;margin-bottom:.8rem">
        <div class="ava" style="width:56px;height:56px;font-size:1.2rem">${initials(c.name)}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:1.05rem">${escapeHtml(c.name)}</div>
          <div style="font-size:.82rem;color:var(--muted)">${escapeHtml(c.doc||'')} ${c.city?' · '+escapeHtml(c.city):''}</div>
        </div>
      </div>
      <div style="font-size:.88rem;line-height:1.7">
        ${c.whatsapp?`<div><i class="fa-brands fa-whatsapp" style="color:#25d366"></i> ${escapeHtml(c.whatsapp)}</div>`:''}
        ${c.phone?`<div><i class="fa-solid fa-phone"></i> ${escapeHtml(c.phone)}</div>`:''}
        ${c.email?`<div><i class="fa-solid fa-envelope"></i> ${escapeHtml(c.email)}</div>`:''}
        ${c.address?`<div><i class="fa-solid fa-location-dot"></i> ${escapeHtml([c.address,c.district,c.city,c.state].filter(Boolean).join(', '))}</div>`:''}
        ${c.notes?`<div style="margin-top:.4rem;padding:.5rem;background:#f8fafc;border-radius:.5rem;font-size:.82rem"><strong>Obs:</strong> ${escapeHtml(c.notes)}</div>`:''}
      </div>
      <div class="divider"></div>
      <div class="grid-2" style="margin-bottom:.6rem">
        <div class="stat"><div class="v">${qs.length}</div><div class="l">Orçamentos</div></div>
        <div class="stat"><div class="v" style="color:var(--ok)">${brl(totalApproved)}</div><div class="l">Aprovado</div></div>
      </div>
      <strong style="font-size:.9rem;display:block;margin:.4rem 0">Histórico</strong>
      ${qs.length ? qs.map(renderQuoteItem).join('') : '<div class="empty" style="padding:1rem"><div>Sem orçamentos</div></div>'}
    `;
    $('qd-title').textContent = c.name;
    $('qd-body').innerHTML = body;
    $('qd-actions').innerHTML = `
      <button class="btn btn-ghost" onclick="App.closeModal('modal-quote-detail');App.openClientModal('${c.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
      <button class="btn btn-primary" onclick="App.closeModal('modal-quote-detail');App.goto('new');App.selectClient('${c.id}')"><i class="fa-solid fa-plus"></i> Novo orçamento</button>
      <button class="btn btn-danger" onclick="App.deleteClient('${c.id}')"><i class="fa-solid fa-trash"></i> Excluir</button>
      <button class="btn btn-wa" onclick="App.waClient('${c.id}')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
    `;
    openModal('modal-quote-detail');
  }

  function deleteClient(id){
    const hasQuotes = state.quotes.some(q=>q.clientId===id);
    const msg = hasQuotes ? 'Este cliente possui orçamentos. Deseja excluir mesmo assim?' : 'Excluir este cliente?';
    if(!confirm(msg)) return;
    state.clients = state.clients.filter(c=>c.id!==id);
    Storage.saveAll();
    closeModal('modal-quote-detail');
    renderClients();
    toast('Cliente excluído');
  }

  /* ---------- CATÁLOGO ---------- */
  function renderCatalog(){
    const q = ($('catalog-page-search').value||'').toLowerCase();
    let list = [...state.catalog].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(q) list = list.filter(i => (i.name||'').toLowerCase().includes(q) || (i.category||'').toLowerCase().includes(q));
    const cats = [...new Set(state.catalog.map(i=>i.category).filter(Boolean))];
    $('cat-categories').innerHTML = cats.map(c=>`<option value="${escapeHtml(c)}">`).join('');

    $('catalog-list').innerHTML = list.length ? list.map(i=>`
      <div class="list-item">
        <div class="ava" style="background:${i.type==='material'?'var(--warn)':i.type==='produto'?'#8b5cf6':'var(--brand)'}">
          <i class="fa-solid ${i.type==='material'?'fa-box':i.type==='produto'?'fa-tag':'fa-screwdriver-wrench'}"></i>
        </div>
        <div style="flex:1;min-width:0" onclick="App.openCatalogModal('${i.id}')">
          <div style="display:flex;justify-content:space-between;gap:.4rem">
            <div style="font-weight:700;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(i.name)}</div>
            <div style="font-weight:700;color:var(--brand);white-space:nowrap">${brl(i.price||0)}</div>
          </div>
          <div style="font-size:.78rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${escapeHtml([i.category,i.unit,i.type].filter(Boolean).join(' · '))}${i.active?'':' · <span style="color:var(--danger)">inativo</span>'}
          </div>
        </div>
        <button class="btn btn-ghost" style="padding:.4rem .6rem;min-height:auto" onclick="App.duplicateCatalog('${i.id}')" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
        <button class="btn btn-ghost" style="padding:.4rem .6rem;min-height:auto;color:var(--danger)" onclick="App.deleteCatalog('${i.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('') : `<div class="empty"><i class="fa-solid fa-boxes-stacked"></i><div>Catálogo vazio</div><button class="btn btn-primary" style="margin-top:.6rem" onclick="App.openCatalogModal()"><i class="fa-solid fa-plus"></i> Cadastrar item</button></div>`;
  }

  function openCatalogModal(id){
    $('catalog-modal-title').textContent = id ? 'Editar item' : 'Novo item';
    $('catalog-id').value = id || '';
    const it = id ? state.catalog.find(x=>x.id===id) : {};
    $('catalog-name').value = it?.name || '';
    $('catalog-desc').value = it?.desc || '';
    $('catalog-category').value = it?.category || '';
    $('catalog-type').value = it?.type || 'servico';
    $('catalog-unit').value = it?.unit || 'un';
    $('catalog-price').value = it?.price || 0;
    $('catalog-cost').value = it?.cost || 0;
    $('catalog-active').checked = it?.active !== false;
    openModal('modal-catalog');
  }

  function saveCatalogItem(){
    const id = $('catalog-id').value;
    const name = $('catalog-name').value.trim();
    if(!name){ toast('Nome é obrigatório'); return; }
    const data = {
      id: id || uid(),
      name,
      desc: $('catalog-desc').value.trim(),
      category: $('catalog-category').value.trim(),
      type: $('catalog-type').value,
      unit: $('catalog-unit').value.trim() || 'un',
      price: Number($('catalog-price').value)||0,
      cost: Number($('catalog-cost').value)||0,
      active: $('catalog-active').checked
    };
    if(id){
      const i = state.catalog.findIndex(x=>x.id===id);
      if(i>=0) state.catalog[i] = data;
    } else state.catalog.push(data);
    Storage.saveAll();
    closeModal('modal-catalog');
    toast('Item salvo');
    renderCatalog();
    renderCatalogPicker();
  }

  function duplicateCatalog(id){
    const it = state.catalog.find(x=>x.id===id); if(!it) return;
    state.catalog.push({...it, id: uid(), name: it.name + ' (cópia)'});
    Storage.saveAll(); renderCatalog(); toast('Item duplicado');
  }
  function deleteCatalog(id){
    if(!confirm('Excluir este item do catálogo?')) return;
    state.catalog = state.catalog.filter(x=>x.id!==id);
    Storage.saveAll(); renderCatalog(); toast('Item excluído');
  }

  /* ---------- TIPO DE DOCUMENTO ---------- */
  function setDocType(type){
    state.ui.docType = type;
    $('btn-doctype-quote').className = 'btn ' + (type==='quote'?'btn-primary':'btn-ghost');
    $('btn-doctype-receipt').className = 'btn ' + (type==='receipt'?'btn-primary':'btn-ghost');
    updateWAPreview();
  }

  /* ---------- NOVO ORÇAMENTO ---------- */
  function initNewQuote(){
    if(state.ui.editingQuoteId){
      const q = state.quotes.find(x=>x.id===state.ui.editingQuoteId);
      if(q){
        $('new-title').innerHTML = `<i class="fa-solid fa-pen" style="color:var(--brand)"></i> Editar ${escapeHtml(q.number)}`;
        state.ui.currentQuoteId = q.id;
        state.ui.currentQuoteClientId = q.clientId || null;
        state.ui.currentQuoteItems = JSON.parse(JSON.stringify(q.items||[]));
        $('new-discount').value = q.discount||0;
        $('new-additional').value = q.additional||0;
        $('new-freight').value = q.freight||0;
        $('new-payment').value = q.payment || state.settings.payment || '';
        $('new-validity').value = q.validity ?? state.settings.validity ?? 7;
        $('new-deadline').value = q.deadline || state.settings.deadline || '';
        $('new-warranty').value = q.warranty || state.settings.warranty || '';
        $('new-notes').value = q.notes || '';
        $('new-show-pix').checked = q.showPix !== false;
        renderClientPicker();
        renderItemsList();
        recalc();
        updateWAPreview();
        return;
      }
    }
    $('new-title').innerHTML = `<i class="fa-solid fa-plus-circle" style="color:var(--brand)"></i> Novo Orçamento`;
    state.ui.currentQuoteId = null;
    state.ui.currentQuoteItems = [];
    state.ui.currentQuoteClientId = null;
    $('new-discount').value = 0;
    $('new-additional').value = 0;
    $('new-freight').value = 0;
    $('new-payment').value = state.settings.payment || '';
    $('new-validity').value = state.settings.validity || 7;
    $('new-deadline').value = state.settings.deadline || '';
    $('new-warranty').value = state.settings.warranty || '';
    $('new-notes').value = '';
    $('new-show-pix').checked = true;
    $('new-client-search').value = '';
    renderClientPicker();
    renderItemsList();
    recalc();
    updateWAPreview();
  }

  function renderClientPicker(){
    const q = ($('new-client-search').value||'').toLowerCase();
    let list = [...state.clients].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(q) list = list.filter(c => (c.name||'').toLowerCase().includes(q) || (c.whatsapp||'').includes(q));
    $('new-client-picker').innerHTML = list.length ? list.map(c=>`
      <div class="list-item" style="margin-bottom:.3rem" onclick="App.selectClient('${c.id}')">
        <div class="ava" style="width:34px;height:34px;font-size:.8rem">${initials(c.name)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.88rem">${escapeHtml(c.name)}</div>
          <div style="font-size:.75rem;color:var(--muted)">${escapeHtml(c.whatsapp||c.phone||'')}</div>
        </div>
      </div>`).join('') : `<div style="text-align:center;color:var(--muted);font-size:.85rem;padding:.6rem">Nenhum cliente encontrado</div>`;
    updateSelectedClient();
  }

  function selectClient(id){
    state.ui.currentQuoteClientId = id;
    updateSelectedClient();
    updateWAPreview();
  }
  function clearNewClient(){
    state.ui.currentQuoteClientId = null;
    updateSelectedClient();
    updateWAPreview();
  }
  function updateSelectedClient(){
    const id = state.ui.currentQuoteClientId;
    const c = state.clients.find(x=>x.id===id);
    if(c){
      $('new-client-selected').classList.remove('hidden');
      $('new-client-name').textContent = c.name;
      $('new-client-info').textContent = [c.whatsapp||c.phone, c.city].filter(Boolean).join(' · ');
      $('new-client-picker').classList.add('hidden');
    } else {
      $('new-client-selected').classList.add('hidden');
      $('new-client-picker').classList.remove('hidden');
    }
  }

  function renderCatalogPicker(){
    const q = ($('catalog-search').value||'').toLowerCase();
    let list = state.catalog.filter(i=>i.active!==false);
    if(q) list = list.filter(i => (i.name||'').toLowerCase().includes(q) || (i.category||'').toLowerCase().includes(q));
    $('catalog-picker').innerHTML = list.length ? list.map(i=>`
      <div class="list-item" style="margin-bottom:.3rem" onclick="App.addCatalogItem('${i.id}')">
        <div class="ava" style="width:34px;height:34px;font-size:.8rem;background:${i.type==='material'?'var(--warn)':i.type==='produto'?'#8b5cf6':'var(--brand)'}">
          <i class="fa-solid ${i.type==='material'?'fa-box':i.type==='produto'?'fa-tag':'fa-screwdriver-wrench'}" style="font-size:.75rem"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.88rem">${escapeHtml(i.name)}</div>
          <div style="font-size:.75rem;color:var(--muted)">${escapeHtml([i.category,i.unit].filter(Boolean).join(' · '))}</div>
        </div>
        <div style="font-weight:700;color:var(--brand);font-size:.88rem">${brl(i.price||0)}</div>
      </div>`).join('') : `<div style="text-align:center;color:var(--muted);font-size:.85rem;padding:.6rem">Nenhum item no catálogo</div>`;
  }

  function addCatalogItem(id){
    const it = state.catalog.find(x=>x.id===id); if(!it) return;
    state.ui.currentQuoteItems.push({
      id: uid(), name: it.name, desc: it.desc, unit: it.unit, qty: 1, price: it.price||0, type: it.type
    });
    renderItemsList(); recalc(); updateWAPreview();
    toast('Item adicionado');
  }

  function addManualItem(){
    state.ui.currentQuoteItems.push({ id: uid(), name:'', desc:'', unit:'un', qty:1, price:0, type:'servico' });
    renderItemsList();
  }

  function renderItemsList(){
    const list = state.ui.currentQuoteItems;
    if(!list.length){
      $('new-items-list').innerHTML = `<div class="empty" style="padding:1rem"><i class="fa-solid fa-list-check"></i><div>Nenhum item adicionado</div></div>`;
      return;
    }
    $('new-items-list').innerHTML = list.map((it,idx)=>`
      <div class="item-row" data-id="${it.id}">
        <div class="row-top">
          <input class="input" style="flex:1;font-weight:600" placeholder="Nome do item" value="${escapeHtml(it.name)}" oninput="App.updateItem('${it.id}','name',this.value)">
          <button class="btn btn-ghost" style="padding:.3rem .6rem;min-height:auto;color:var(--danger)" onclick="App.removeItem('${it.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
        <input class="input" style="font-size:.85rem;margin-bottom:.4rem" placeholder="Descrição (aparecerá no PDF e WhatsApp)" value="${escapeHtml(it.desc||'')}" oninput="App.updateItem('${it.id}','desc',this.value)">
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center">
          <input type="number" step="0.01" class="qty-input" value="${it.qty}" oninput="App.updateItem('${it.id}','qty',this.value)" title="Quantidade">
          <input class="input" style="width:70px;padding:.4rem;text-align:center" value="${escapeHtml(it.unit)}" oninput="App.updateItem('${it.id}','unit',this.value)" title="Unidade">
          <input type="number" step="0.01" class="price-input" value="${it.price}" oninput="App.updateItem('${it.id}','price',this.value)" title="Preço unitário">
          <div style="margin-left:auto;font-weight:700;color:var(--brand)">${brl((it.qty||0)*(it.price||0))}</div>
        </div>
      </div>
    `).join('');
  }

  function updateItem(id, field, val){
    const it = state.ui.currentQuoteItems.find(x=>x.id===id); if(!it) return;
    if(field==='qty' || field==='price') it[field] = Number(val)||0;
    else it[field] = val;
    const row = document.querySelector(`.item-row[data-id="${id}"]`);
    if(row){
      const totalEl = row.querySelector('div[style*="margin-left:auto"]');
      if(totalEl) totalEl.textContent = brl((it.qty||0)*(it.price||0));
    }
    recalc();
    updateWAPreview();
  }
  function removeItem(id){
    state.ui.currentQuoteItems = state.ui.currentQuoteItems.filter(x=>x.id!==id);
    renderItemsList(); recalc(); updateWAPreview();
  }

  function recalc(){
    const sub = state.ui.currentQuoteItems.reduce((s,i)=>s+(i.qty||0)*(i.price||0),0);
    const d = Number($('new-discount').value)||0;
    const a = Number($('new-additional').value)||0;
    const f = Number($('new-freight').value)||0;
    const total = Math.max(0, sub - d + a + f);
    $('new-total').textContent = brl(total);
    updateWAPreview();
  }

  /* ---------- PREVIEW WHATSAPP ---------- */
  function getCurrentDraft(){
    const sub = state.ui.currentQuoteItems.reduce((s,i)=>s+(i.qty||0)*(i.price||0),0);
    const discount = Number($('new-discount')?.value)||0;
    const additional = Number($('new-additional')?.value)||0;
    const freight = Number($('new-freight')?.value)||0;
    const total = Math.max(0, sub - discount + additional + freight);
    const validityDays = Number($('new-validity')?.value)||7;
    return {
      items: state.ui.currentQuoteItems,
      subtotal: sub, discount, additional, freight, total,
      payment: $('new-payment')?.value || '',
      validity: validityDays,
      validityDate: new Date(Date.now()+validityDays*86400000).toISOString(),
      deadline: $('new-deadline')?.value || '',
      warranty: $('new-warranty')?.value || '',
      notes: $('new-notes')?.value || '',
      showPix: $('new-show-pix')?.checked !== false,
      clientId: state.ui.currentQuoteClientId
    };
  }

  function buildWAMessage(q, includeItems=true){
    const c = state.clients.find(x=>x.id===q.clientId);
    const docLabel = state.ui.docType === 'receipt' ? 'Recibo' : 'Orçamento';
    const lines = [];
    lines.push(`*${state.company.name || 'Profissional'}*`);
    lines.push('');
    lines.push(`Olá${c?` *${c.name.split(' ')[0]}*`:''}! Segue ${state.ui.docType==='receipt'?'o recibo':'o orçamento'} solicitado.`);
    lines.push('');

    // ITENS COM DESCRIÇÃO (correção do bug)
    if(includeItems && q.items && q.items.length){
      lines.push(`*📋 ${state.ui.docType==='receipt'?'Itens do recibo':'Itens do orçamento'}:*`);
      q.items.forEach((it, idx) => {
        const itemName = it.name || 'Item';
        const itemTotal = (it.qty||0)*(it.price||0);
        lines.push(`*${idx+1}. ${itemName}*`);
        if(it.desc && it.desc.trim()){
          lines.push(`   _${it.desc.trim()}_`);
        }
        lines.push(`   ${it.qty} ${it.unit} × ${brl(it.price)} = *${brl(itemTotal)}*`);
      });
      lines.push('');
    }

    // Resumo de valores
    lines.push(`*💰 Subtotal:* ${brl(q.subtotal||0)}`);
    if(q.discount) lines.push(`*📉 Desconto:* -${brl(q.discount)}`);
    if(q.additional) lines.push(`*📈 Acréscimo:* +${brl(q.additional)}`);
    if(q.freight) lines.push(`*🚚 Frete:* ${brl(q.freight)}`);
    lines.push(`*✅ TOTAL: ${brl(q.total||0)}*`);
    lines.push('');

    if(q.payment) lines.push(`*💳 Pagamento:* ${q.payment}`);
    if(q.validity) lines.push(`*📅 Validade:* ${fmtDate(q.validityDate)} (${q.validity} dias)`);
    if(q.deadline) lines.push(`*⏱️ Prazo:* ${q.deadline}`);
    if(q.warranty) lines.push(`*🛡️ Garantia:* ${q.warranty}`);

    if(state.company.pixKey && q.showPix){
      lines.push('');
      lines.push(`*💠 PIX:*`);
      lines.push(`Chave: \`${state.company.pixKey}\``);
      if(state.company.pixName) lines.push(`Nome: ${state.company.pixName}`);
      if(state.company.pixCity) lines.push(`Cidade: ${state.company.pixCity}`);
      lines.push(`Valor: *${brl(q.total||0)}*`);
    }

    if(q.notes) lines.push('', `*📝 Observações:*`, q.notes);

    lines.push('');
    lines.push('_Documento gerado com OrçaZAP Pro_');
    return lines.join('\n');
  }

  function updateWAPreview(){
    const bubble = $('wa-preview-bubble');
    const time = $('wa-preview-time');
    if(!bubble) return;
    const draft = getCurrentDraft();
    if(!draft.items || !draft.items.length){
      bubble.innerHTML = '<em style="color:#667">Preencha os dados do orçamento para ver o preview aqui...</em>';
      time.textContent = '';
      return;
    }
    const msg = buildWAMessage(draft, true);
    // formata markdown simples do WhatsApp
    const formatted = escapeHtml(msg)
      .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_\n]+)_/g, '<em>$1</em>')
      .replace(/`([^`\n]+)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:.82em">$1</code>')
      .replace(/\n/g, '<br>');
    bubble.innerHTML = formatted;
    const now = new Date();
    time.textContent = now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  }

  function copyWAPreview(){
    const draft = getCurrentDraft();
    const msg = buildWAMessage(draft, true);
    if(navigator.clipboard){
      navigator.clipboard.writeText(msg).then(()=>toast('Texto copiado!')).catch(()=>toast('Erro ao copiar'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = msg; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Texto copiado!'); } catch(e){ toast('Erro ao copiar'); }
      document.body.removeChild(ta);
    }
  }

  function buildQuoteFromForm(status){
    const sub = state.ui.currentQuoteItems.reduce((s,i)=>s+(i.qty||0)*(i.price||0),0);
    const discount = Number($('new-discount').value)||0;
    const additional = Number($('new-additional').value)||0;
    const freight = Number($('new-freight').value)||0;
    const total = Math.max(0, sub - discount + additional + freight);
    const clientId = state.ui.currentQuoteClientId;
    const now = new Date().toISOString();
    const validityDays = Number($('new-validity').value)||7;
    const validityDate = new Date(Date.now()+validityDays*86400000).toISOString();

    const existing = state.ui.editingQuoteId ? state.quotes.find(q=>q.id===state.ui.editingQuoteId) : null;

    const q = existing || {
      id: uid(),
      number: nextQuoteNumber(),
      createdAt: now
    };
    q.clientId = clientId;
    q.items = JSON.parse(JSON.stringify(state.ui.currentQuoteItems));
    q.subtotal = sub;
    q.discount = discount;
    q.additional = additional;
    q.freight = freight;
    q.total = total;
    q.payment = $('new-payment').value.trim();
    q.validity = validityDays;
    q.validityDate = validityDate;
    q.deadline = $('new-deadline').value.trim();
    q.warranty = $('new-warranty').value.trim();
    q.notes = $('new-notes').value.trim();
    q.showPix = $('new-show-pix').checked;
    q.docType = state.ui.docType;
    q.status = status;
    q.updatedAt = now;
    if(status==='sent' && !q.sentAt) q.sentAt = now;

    if(!existing) state.quotes.push(q);
    Storage.saveAll();
    return q;
  }

  function saveQuote(status){
    if(!state.ui.currentQuoteItems.length){ toast('Adicione ao menos um item'); return; }
    const q = buildQuoteFromForm(status);
    state.ui.editingQuoteId = null;
    toast(status==='draft'?'Rascunho salvo':'Orçamento salvo');
    goto('quotes');
    return q;
  }

  /* ---------- ORÇAMENTO DETALHE ---------- */
  function openQuoteDetail(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    const c = state.clients.find(x=>x.id===q.clientId);
    const sub = q.subtotal || q.items.reduce((s,i)=>s+(i.qty||0)*(i.price||0),0);
    const timeline = [
      {k:'draft',l:'Rascunho',d:q.createdAt},
      {k:'sent',l:'Enviado',d:q.sentAt},
      {k:'viewed',l:'Visualizado',d:q.viewedAt},
      {k:'approved',l:'Aprovado',d:q.approvedAt},
      {k:'rejected',l:'Rejeitado',d:q.rejectedAt}
    ];
    const order = ['draft','sent','viewed','approved'];
    const currentIdx = order.indexOf(q.status);
    const isRejected = q.status==='rejected';

    const body = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
        <div>
          <div style="font-size:.78rem;color:var(--muted)">${escapeHtml(q.number)}</div>
          <div style="font-weight:700">${escapeHtml(c?.name||'Sem cliente')}</div>
        </div>
        ${statusChip(q.status)}
      </div>
      <div style="font-size:.85rem;color:var(--muted);margin-bottom:.6rem">
        Criado em ${fmtDate(q.createdAt)} · Validade ${fmtDate(q.validityDate)}
      </div>
      <div class="divider"></div>
      <strong style="font-size:.88rem">Itens</strong>
      <div style="margin-top:.4rem;font-size:.88rem">
        ${(q.items||[]).map(i=>`
          <div style="padding:.4rem 0;border-bottom:1px dashed var(--border)">
            <div style="display:flex;justify-content:space-between;gap:.4rem">
              <div style="flex:1">
                <div style="font-weight:600">${escapeHtml(i.name)}</div>
                ${i.desc?`<div style="font-size:.78rem;color:var(--muted);font-style:italic">${escapeHtml(i.desc)}</div>`:''}
                <div style="font-size:.78rem;color:var(--muted)">${i.qty} ${escapeHtml(i.unit)} × ${brl(i.price)}</div>
              </div>
              <div style="font-weight:700">${brl((i.qty||0)*(i.price||0))}</div>
            </div>
          </div>`).join('')}
      </div>
      <div style="margin-top:.6rem;font-size:.88rem">
        <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${brl(sub)}</span></div>
        ${q.discount?`<div style="display:flex;justify-content:space-between;color:var(--danger)"><span>Desconto</span><span>-${brl(q.discount)}</span></div>`:''}
        ${q.additional?`<div style="display:flex;justify-content:space-between"><span>Acréscimo</span><span>+${brl(q.additional)}</span></div>`:''}
        ${q.freight?`<div style="display:flex;justify-content:space-between"><span>Frete</span><span>${brl(q.freight)}</span></div>`:''}
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.05rem;color:var(--brand);margin-top:.3rem;padding-top:.3rem;border-top:1px solid var(--border)"><span>Total</span><span>${brl(q.total||0)}</span></div>
      </div>
      ${q.payment?`<div style="margin-top:.6rem;font-size:.85rem"><strong>Pagamento:</strong> ${escapeHtml(q.payment)}</div>`:''}
      ${q.deadline?`<div style="font-size:.85rem"><strong>Prazo:</strong> ${escapeHtml(q.deadline)}</div>`:''}
      ${q.warranty?`<div style="font-size:.85rem"><strong>Garantia:</strong> ${escapeHtml(q.warranty)}</div>`:''}
      ${q.notes?`<div style="margin-top:.6rem;padding:.6rem;background:#f8fafc;border-radius:.6rem;font-size:.85rem"><strong>Obs:</strong> ${escapeHtml(q.notes)}</div>`:''}
      <div class="divider"></div>
      <strong style="font-size:.88rem">Status</strong>
      <div class="timeline" style="margin-top:.5rem">
        ${timeline.filter(t=>!isRejected || ['draft','sent','rejected'].includes(t.k)).map(t=>{
          const done = !!t.d;
          const current = (q.status===t.k) || (!isRejected && t.k===order[currentIdx] && !timeline.slice(currentIdx+1).some(x=>x.d));
          return `<div class="tl-item ${done?'done':''} ${current?'current':''}">
            <div style="font-weight:600;font-size:.88rem">${t.l} ${done?'✓':''}</div>
            <div style="font-size:.78rem;color:var(--muted)">${t.d?fmtDateTime(t.d):'—'}</div>
          </div>`;
        }).join('')}
      </div>
      ${q.signature?`<div class="divider"></div><strong style="font-size:.88rem">Assinatura</strong><img src="${q.signature}" style="width:100%;max-width:300px;margin-top:.4rem;border:1px solid var(--border);border-radius:.5rem;background:#fff">`:''}
    `;
    $('qd-title').textContent = q.number;
    $('qd-body').innerHTML = body;
    $('qd-actions').innerHTML = `
      <button class="btn btn-ghost" onclick="App.editQuote('${q.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
      <button class="btn btn-ghost" onclick="App.duplicateQuote('${q.id}')"><i class="fa-solid fa-copy"></i> Duplicar</button>
      <button class="btn btn-ghost" onclick="App.previewQuotePDF('${q.id}')"><i class="fa-solid fa-eye"></i> Ver PDF</button>
      <button class="btn btn-ghost" onclick="App.downloadQuotePDF('${q.id}')"><i class="fa-solid fa-file-pdf"></i> Baixar PDF</button>
      <button class="btn btn-wa" onclick="App.sendQuoteWA('${q.id}')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
      <button class="btn btn-primary" onclick="App.createPublicLink('${q.id}')"><i class="fa-solid fa-link"></i> Link cliente</button>
      <button class="btn btn-ghost" onclick="App.shareQuoteById('${q.id}')"><i class="fa-solid fa-share-nodes"></i> Compartilhar</button>
      ${q.status!=='approved'?`<button class="btn btn-success" onclick="App.approveQuote('${q.id}')"><i class="fa-solid fa-check"></i> Aprovar</button>`:''}
      ${q.status!=='rejected'?`<button class="btn btn-danger" onclick="App.rejectQuote('${q.id}')"><i class="fa-solid fa-xmark"></i> Rejeitar</button>`:''}
      <button class="btn btn-ghost" onclick="App.openSignatureForQuote('${q.id}')"><i class="fa-solid fa-signature"></i> Assinar</button>
      <button class="btn btn-ghost" onclick="App.generateReceiptFromQuote('${q.id}')"><i class="fa-solid fa-receipt"></i> Recibo</button>
      <button class="btn btn-danger" onclick="App.deleteQuote('${q.id}')"><i class="fa-solid fa-trash"></i> Excluir</button>
    `;
    openModal('modal-quote-detail');
  }

  function editQuote(id){ state.ui.editingQuoteId = id; closeModal('modal-quote-detail'); goto('new'); }
  function duplicateQuote(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    const nq = JSON.parse(JSON.stringify(q));
    nq.id = uid();
    nq.number = nextQuoteNumber();
    nq.createdAt = new Date().toISOString();
    nq.updatedAt = nq.createdAt;
    nq.status = 'draft';
    delete nq.sentAt; delete nq.viewedAt; delete nq.approvedAt; delete nq.rejectedAt; delete nq.signature;
    state.quotes.push(nq);
    Storage.saveAll();
    closeModal('modal-quote-detail');
    toast('Orçamento duplicado');
    renderQuotes(); renderDashboard();
  }
  function approveQuote(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    q.status = 'approved'; q.approvedAt = new Date().toISOString(); q.updatedAt = q.approvedAt;
    Storage.saveAll(); closeModal('modal-quote-detail'); toast('Orçamento aprovado');
    renderQuotes(); renderDashboard();
  }
  function rejectQuote(id){
    if(!confirm('Marcar como rejeitado?')) return;
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    q.status = 'rejected'; q.rejectedAt = new Date().toISOString(); q.updatedAt = q.rejectedAt;
    Storage.saveAll(); closeModal('modal-quote-detail'); toast('Orçamento rejeitado');
    renderQuotes(); renderDashboard();
  }
  function deleteQuote(id){
    if(!confirm('Excluir este orçamento?')) return;
    state.quotes = state.quotes.filter(q=>q.id!==id);
    Storage.saveAll(); closeModal('modal-quote-detail'); toast('Orçamento excluído');
    renderQuotes(); renderDashboard();
  }

  /* ---------- PDF ---------- */
  async function generatePDF(quote){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit:'mm', format:'a4'});
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const brand = state.company.color1 || '#2563eb';

    let y = margin;
    if(state.company.logo){
      try { doc.addImage(state.company.logo, 'PNG', margin, y, 25, 25); } catch(e){}
    }
    const textX = state.company.logo ? margin + 29 : margin;
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...hexToRgb(brand));
    doc.text(state.company.name || 'Sua Empresa', textX, y+8);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80);
    let infoY = y+14;
    if(state.company.doc){ doc.text(state.company.doc, textX, infoY); infoY+=4; }
    const contact = [state.company.phone, state.company.whatsapp, state.company.email].filter(Boolean).join(' · ');
    if(contact){ doc.text(contact, textX, infoY); infoY+=4; }
    if(state.company.address){ doc.text(state.company.address, textX, infoY, {maxWidth: pageW - textX - margin}); infoY+=4; }

    y = Math.max(y+28, infoY+4);
    doc.setDrawColor(...hexToRgb(brand)); doc.setLineWidth(.6);
    doc.line(margin, y, pageW-margin, y);
    y += 8;

    const docType = quote.docType || 'quote';
    const docLabel = docType === 'receipt' ? 'RECIBO' : 'ORÇAMENTO';

    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...hexToRgb(brand));
    doc.text(docLabel, margin, y);
    doc.setFontSize(10); doc.setTextColor(80); doc.setFont('helvetica','normal');
    doc.text(quote.number || '', pageW-margin, y, {align:'right'});
    y += 5;
    doc.setFontSize(9);
    doc.text(`Emissão: ${fmtDate(quote.createdAt)}`, margin, y);
    doc.text(`Validade: ${fmtDate(quote.validityDate)}`, pageW-margin, y, {align:'right'});
    y += 8;

    const c = state.clients.find(x=>x.id===quote.clientId);
    doc.setFillColor(245,247,250); doc.roundedRect(margin, y, pageW-margin*2, 22, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...hexToRgb(brand));
    doc.text('CLIENTE', margin+3, y+5);
    doc.setFont('helvetica','normal'); doc.setTextColor(30); doc.setFontSize(10);
    doc.text(c?.name || '—', margin+3, y+11);
    doc.setFontSize(8.5); doc.setTextColor(80);
    const cInfo = [c?.doc, c?.whatsapp||c?.phone, c?.email, [c?.address,c?.district,c?.city,c?.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
    doc.text(cInfo, margin+3, y+17, {maxWidth: pageW-margin*2-6});
    y += 28;

    const body = (quote.items||[]).map(i => [
      i.name + (i.desc?`\n${i.desc}`:''),
      i.qty,
      i.unit,
      brl(i.price),
      brl((i.qty||0)*(i.price||0))
    ]);
    doc.autoTable({
      startY: y,
      head: [['Descrição','Qtd','Un','Valor un.','Total']],
      body,
      theme:'striped',
      headStyles:{ fillColor: hexToRgbArr(brand), textColor:255, fontStyle:'bold', fontSize:9 },
      bodyStyles:{ fontSize:9, textColor:40 },
      columnStyles:{ 0:{cellWidth:80}, 1:{halign:'center',cellWidth:15}, 2:{halign:'center',cellWidth:15}, 3:{halign:'right',cellWidth:25}, 4:{halign:'right',cellWidth:25} },
      margin:{left:margin, right:margin},
      didDrawPage: (data) => {
        doc.setFontSize(8); doc.setTextColor(130);
        doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageW-margin, pageH-8, {align:'right'});
        doc.text(state.company.name || '', margin, pageH-8);
      }
    });
    y = doc.lastAutoTable.finalY + 6;

    const sub = quote.subtotal || (quote.items||[]).reduce((s,i)=>s+(i.qty||0)*(i.price||0),0);
    const totals = [
      ['Subtotal', brl(sub)],
      ...(quote.discount?[['Desconto', '-'+brl(quote.discount)]]:[]),
      ...(quote.additional?[['Acréscimo', '+'+brl(quote.additional)]]:[]),
      ...(quote.freight?[['Frete/Deslocamento', brl(quote.freight)]]:[])
    ];
    const totalW = 80;
    const totalX = pageW - margin - totalW;
    doc.setFontSize(9);
    let ty = y;
    totals.forEach(([l,v]) => {
      doc.setTextColor(80); doc.text(l, totalX, ty);
      doc.setTextColor(40); doc.text(v, pageW-margin, ty, {align:'right'});
      ty += 5;
    });
    doc.setDrawColor(...hexToRgb(brand)); doc.line(totalX, ty-2, pageW-margin, ty-2);
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...hexToRgb(brand));
    doc.text('TOTAL', totalX, ty+4);
    doc.text(brl(quote.total||0), pageW-margin, ty+4, {align:'right'});
    y = ty + 12;

    const cond = [];
    if(quote.payment) cond.push(['Forma de pagamento', quote.payment]);
    if(quote.deadline) cond.push(['Prazo de execução', quote.deadline]);
    if(quote.warranty) cond.push(['Garantia', quote.warranty]);
    if(cond.length){
      if(y > pageH - 60){ doc.addPage(); y = margin; }
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...hexToRgb(brand));
      doc.text('CONDIÇÕES', margin, y); y += 5;
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(40);
      cond.forEach(([l,v]) => {
        doc.setFont('helvetica','bold'); doc.text(l+':', margin, y);
        doc.setFont('helvetica','normal'); doc.text(v, margin + 50, y, {maxWidth: pageW-margin*2-50});
        y += 5;
      });
      y += 3;
    }

    if(quote.notes){
      if(y > pageH - 50){ doc.addPage(); y = margin; }
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...hexToRgb(brand));
      doc.text('OBSERVAÇÕES', margin, y); y += 5;
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(40);
      const split = doc.splitTextToSize(quote.notes, pageW-margin*2);
      doc.text(split, margin, y); y += split.length*4.5 + 3;
    }

    // PIX + QR CODE
    if(quote.showPix && state.company.pixKey){
      if(y > pageH - 80){ doc.addPage(); y = margin; }
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...hexToRgb(brand));
      doc.text('PAGAMENTO VIA PIX', margin, y); y += 5;
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(40);
      doc.text(`Chave: ${state.company.pixKey}`, margin, y); y += 4;
      if(state.company.pixName){ doc.text(`Nome: ${state.company.pixName}`, margin, y); y += 4; }
      if(state.company.pixCity){ doc.text(`Cidade: ${state.company.pixCity}`, margin, y); y += 4; }
      doc.text(`Valor: ${brl(quote.total||0)}`, margin, y); y += 2;

      // QR Code PIX
      try {
        const pixPayload = buildPixPayload(state.company.pixKey, state.company.pixName, state.company.pixCity, quote.total||0);
        const qrUrl = await QRCode.toDataURL(pixPayload, {margin:1, errorCorrectionLevel:'M', color:{dark:'#000000', light:'#ffffff'}});
        const qrSize = 38;
        const qrX = pageW - margin - qrSize;
        const qrY = y - 22;
        doc.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        // borda decorativa
        doc.setDrawColor(...hexToRgb(brand)); doc.setLineWidth(.3);
        doc.rect(qrX-1, qrY-1, qrSize+2, qrSize+2);
        doc.setFontSize(7); doc.setTextColor(100);
        doc.text('Escaneie para pagar', qrX + qrSize/2, qrY + qrSize + 3, {align:'center'});
        y = Math.max(y, qrY + qrSize + 8);
      } catch(e){ console.warn('QR fail', e); }
      y += 5;
    }

    if(state.settings.terms){
      if(y > pageH - 40){ doc.addPage(); y = margin; }
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(100);
      doc.text('TERMOS', margin, y); y += 4;
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100);
      const split = doc.splitTextToSize(state.settings.terms, pageW-margin*2);
      doc.text(split, margin, y);
    }

    if(quote.signature){
      const py = pageH - 35;
      try { doc.addImage(quote.signature, 'PNG', margin, py, 60, 20); } catch(e){}
      doc.setDrawColor(150); doc.line(margin, py+22, margin+60, py+22);
      doc.setFontSize(8); doc.setTextColor(80);
      doc.text('Assinatura de aceite', margin, py+26);
    }

    return doc;
  }

  function buildPixPayload(key, name, city, amount){
    const k = String(key||'').trim();
    const n = String(name||'').trim().toUpperCase().slice(0,25);
    const c = String(city||'').trim().toUpperCase().slice(0,15);
    const a = (Number(amount)||0).toFixed(2);
    const pad = (id, val) => { const v = String(val); const len = String(v.length).padStart(2,'0'); return id + len + v; };
    const ma = pad('00', 'br.gov.bcb.pix') + pad('01', k);
    const fixed = pad('00','01') + pad('26', ma) + pad('52','0000') + pad('53','986') + pad('54', a) + pad('58','BR') + pad('59', (n||'***').slice(0,25)) + pad('60', (c||'***').slice(0,15)) + '62070503***' + '6304';
    const crc = crc16(fixed);
    return fixed + crc;
  }
  function crc16(str){
    let crc = 0xFFFF;
    for(let i=0;i<str.length;i++){
      crc ^= str.charCodeAt(i) << 8;
      for(let j=0;j<8;j++){
        if(crc & 0x8000) crc = (crc << 1) ^ 0x1021;
        else crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4,'0');
  }
  function hexToRgb(hex){ const h = hex.replace('#',''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
  function hexToRgbArr(hex){ const [r,g,b] = hexToRgb(hex); return {r,g,b}; }

  async function previewPDF(){
    if(!state.ui.currentQuoteItems.length){ toast('Adicione ao menos um item'); return; }
    const q = buildQuoteFromForm(state.quotes.find(x=>x.id===state.ui.currentQuoteId)?.status || 'draft');
    state.ui.currentQuoteId = q.id;
    await previewQuotePDF(q.id);
  }
  async function previewQuotePDF(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    toast('Gerando PDF...');
    try {
      const doc = await generatePDF(q);
      const blob = doc.output('blob');
      state.ui.currentPDFBlob = blob;
      state.ui.currentPDFFilename = `${q.number}.pdf`;
      const url = URL.createObjectURL(blob);
      $('pdf-iframe').src = url;
      openModal('modal-pdf-view');
    } catch(e){ console.error(e); toast('Erro ao gerar PDF'); }
  }
  async function downloadPDF(){
    if(!state.ui.currentQuoteItems.length){ toast('Adicione ao menos um item'); return; }
    const q = buildQuoteFromForm('draft');
    state.ui.currentQuoteId = q.id;
    await downloadQuotePDF(q.id);
  }
  async function downloadQuotePDF(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    toast('Gerando PDF...');
    try {
      const doc = await generatePDF(q);
      doc.save(`${q.number}.pdf`);
    } catch(e){ console.error(e); toast('Erro ao gerar PDF'); }
  }
  async function downloadCurrentPDF(){
    if(!state.ui.currentPDFBlob) return;
    const url = URL.createObjectURL(state.ui.currentPDFBlob);
    const a = document.createElement('a'); a.href = url; a.download = state.ui.currentPDFFilename || 'orcamento.pdf'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }
  async function shareCurrentPDF(){
    if(!state.ui.currentPDFBlob){ toast('PDF não disponível'); return; }
    const file = new File([state.ui.currentPDFBlob], state.ui.currentPDFFilename||'orcamento.pdf', {type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try { await navigator.share({files:[file], title:'Orçamento'}); return; } catch(e){}
    }
    downloadCurrentPDF();
  }

  /* ---------- WHATSAPP / SHARE ---------- */
  function sendWhatsApp(){
    if(!state.ui.currentQuoteItems.length){ toast('Adicione ao menos um item'); return; }
    const q = buildQuoteFromForm('sent');
    state.ui.currentQuoteId = q.id;
    sendQuoteWA(q.id);
  }
  function sendQuoteWA(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    const c = state.clients.find(x=>x.id===q.clientId);
    state.ui.docType = q.docType || 'quote';
    const msg = buildWAMessage(q, true);
    const phone = onlyDigits(c?.whatsapp || c?.phone);
    const url = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast('Abrindo WhatsApp...');
  }

  function shareQuote(){
    if(!state.ui.currentQuoteItems.length){ toast('Adicione ao menos um item'); return; }
    const q = buildQuoteFromForm('sent');
    state.ui.currentQuoteId = q.id;
    shareQuoteById(q.id);
  }
  async function shareQuoteById(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    state.ui.docType = q.docType || 'quote';
    const text = buildWAMessage(q, true);
    if(navigator.share){
      try {
        const doc = await generatePDF(q);
        const blob = doc.output('blob');
        const file = new File([blob], `${q.number}.pdf`, {type:'application/pdf'});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file], text, title:'Orçamento'});
          return;
        }
      } catch(e){}
      try { await navigator.share({text, title:'Orçamento'}); return; } catch(e){}
    }
    try { await navigator.clipboard.writeText(text); toast('Mensagem copiada'); } catch(e){ toast('Compartilhamento não suportado'); }
  }

  /* ---------- VOZ ---------- */
  function openVoiceModal(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ toast('Seu navegador não suporta reconhecimento de voz'); return; }
    $('voice-text').value = '';
    $('voice-status').textContent = 'Toque para começar a falar';
    $('voice-btn').classList.remove('listening');
    openModal('modal-voice');
  }
  function toggleVoice(){
    if(state.ui.voiceListening){ stopVoice(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ toast('Voz não suportada'); return; }
    const rec = new SR();
    rec.lang = 'pt-BR'; rec.continuous = true; rec.interimResults = true;
    let finalText = $('voice-text').value || '';
    rec.onresult = (e) => {
      let interim = '';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t = e.results[i][0].transcript;
        if(e.results[i].isFinal) finalText += t + ' ';
        else interim += t;
      }
      $('voice-text').value = finalText + interim;
    };
    rec.onerror = (e) => { console.warn('voice err', e); toast('Erro no reconhecimento: '+ (e.error||'')); stopVoice(); };
    rec.onend = () => { state.ui.voiceListening = false; $('voice-btn').classList.remove('listening'); $('voice-status').textContent = 'Toque para falar novamente'; };
    rec.start();
    state.ui.voiceRecognition = rec;
    state.ui.voiceListening = true;
    $('voice-btn').classList.add('listening');
    $('voice-status').textContent = 'Ouvindo...';
  }
  function stopVoice(){
    if(state.ui.voiceRecognition){ try{ state.ui.voiceRecognition.stop(); }catch(e){} }
    state.ui.voiceListening = false;
    $('voice-btn')?.classList.remove('listening');
  }
  function applyVoice(){
    const text = ($('voice-text').value||'').trim();
    if(!text){ toast('Fale algo primeiro'); return; }
    const parsed = parseVoice(text);
    if(parsed.clientName){
      const c = state.clients.find(x => x.name.toLowerCase().includes(parsed.clientName.toLowerCase()));
      if(c) selectClient(c.id);
      else { state.ui.pendingClientName = parsed.clientName; toast('Cliente não encontrado - cadastre'); }
    }
    if(parsed.items.length){
      state.ui.currentQuoteItems = parsed.items.map(it => ({ id: uid(), ...it }));
      renderItemsList();
    }
    if(parsed.validity){ $('new-validity').value = parsed.validity; }
    if(parsed.payment){ $('new-payment').value = parsed.payment; }
    if(parsed.notes){ $('new-notes').value = parsed.notes; }
    recalc();
    updateWAPreview();
    closeModal('modal-voice');
    toast('Dados aplicados - revise antes de enviar');
  }
  function parseVoice(text){
    const t = text.toLowerCase();
    const result = { clientName:'', items:[], validity:null, payment:'', notes:'' };
    const cm = t.match(/(?:para|cliente)\s+([a-zá-ú]{3,}(?:\s+[a-zá-ú]+){0,3})/);
    if(cm) result.clientName = cm[1].replace(/\b(de|da|do|para|cliente)\b/g,'').trim().replace(/\b\w/g, c=>c.toUpperCase());
    const vm = t.match(/validade\s+(?:de\s+)?(\d+)\s*(dias?|d)/);
    if(vm) result.validity = Number(vm[1]);
    const pm = t.match(/pagamento\s+([^,.]+)/);
    if(pm) result.payment = pm[1].trim();
    const parts = t.split(/(?:,| e |\.)/).map(s=>s.trim()).filter(Boolean);
    parts.forEach(p => {
      const vm2 = p.match(/(\d+(?:[.,]\d+)?)\s*(?:reais|real|rv?)/);
      if(vm2){
        const price = Number(vm2[1].replace(',','.'));
        const name = p.replace(vm2[0],'').replace(/^(de|por|no valor de|valor)\s+/,'').trim();
        if(name && name.length>2){
          result.items.push({ name: name.replace(/\b\w/g, c=>c.toUpperCase()), desc:'', unit:'un', qty:1, price, type:'servico' });
        }
      }
    });
    return result;
  }

  /* ---------- ASSINATURA ---------- */
  let sigCtx=null, sigDrawing=false;
  function openSignatureForQuote(id){
    state.ui.signatureQuoteId = id;
    openModal('modal-signature');
    setTimeout(initSignatureCanvas, 50);
  }
  function initSignatureCanvas(){
    const c = $('sig-canvas');
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    sigCtx = c.getContext('2d');
    sigCtx.scale(dpr,dpr);
    sigCtx.lineWidth = 2; sigCtx.lineCap = 'round'; sigCtx.strokeStyle = '#0f172a';
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    };
    const start = (e) => { sigDrawing = true; const p = pos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x,p.y); e.preventDefault(); };
    const move = (e) => { if(!sigDrawing) return; const p = pos(e); sigCtx.lineTo(p.x,p.y); sigCtx.stroke(); e.preventDefault(); };
    const end = () => { sigDrawing = false; };
    c.onmousedown = start; c.onmousemove = move; c.onmouseup = end; c.onmouseleave = end;
    c.ontouchstart = start; c.ontouchmove = move; c.ontouchend = end;
  }
  function clearSignature(){
    const c = $('sig-canvas');
    sigCtx.clearRect(0,0,c.width,c.height);
  }
  function confirmSignature(){
    const c = $('sig-canvas');
    const data = c.toDataURL('image/png');
    const ctx = c.getContext('2d');
    const px = ctx.getImageData(0,0,c.width,c.height).data;
    let dark = 0;
    for(let i=3;i<px.length;i+=4){ if(px[i] < 200) dark++; if(dark>50) break; }
    if(dark<50){ toast('Desenhe a assinatura'); return; }
    const id = state.ui.signatureQuoteId;
    const q = state.quotes.find(x=>x.id===id);
    if(q){
      q.signature = data;
      q.signatureAt = new Date().toISOString();
      if(q.status!=='approved'){ q.status = 'approved'; q.approvedAt = q.signatureAt; }
      Storage.saveAll();
      toast('Assinatura registrada');
      closeModal('modal-signature');
      renderQuotes(); renderDashboard();
    }
  }

  /* ---------- RECIBOS ---------- */
  function renderReceipts(){
    const list = [...state.receipts].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
    $('receipts-list').innerHTML = list.length ? list.map(r=>{
      const c = state.clients.find(x=>x.id===r.clientId);
      return `<div class="list-item" onclick="App.downloadReceipt('${r.id}')">
        <div class="ava" style="background:var(--ok)"><i class="fa-solid fa-receipt"></i></div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.92rem">${escapeHtml(r.number)}</div>
          <div style="font-size:.78rem;color:var(--muted)">${escapeHtml(c?.name||'')} · ${fmtDate(r.createdAt)} · <strong style="color:var(--ok)">${brl(r.value||0)}</strong></div>
          <div style="font-size:.78rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.ref||'')}</div>
        </div>
      </div>`;
    }).join('') : `<div class="empty"><i class="fa-solid fa-receipt"></i><div>Nenhum recibo</div></div>`;
  }
  function openReceiptModal(quoteId){
    $('receipt-id').value = '';
    $('receipt-quote-id').value = quoteId || '';
    $('receipt-client').innerHTML = '<option value="">Selecione...</option>' + state.clients.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    if(quoteId){
      const q = state.quotes.find(x=>x.id===quoteId);
      if(q){
        $('receipt-client').value = q.clientId || '';
        $('receipt-value').value = q.total || 0;
        $('receipt-ref').value = (q.items||[]).map(i=>i.name).join(', ').slice(0,120);
      }
    } else {
      $('receipt-value').value = 0; $('receipt-ref').value = '';
    }
    $('receipt-extenso').value = ''; $('receipt-notes').value = '';
    $('receipt-modal-title').textContent = 'Novo recibo';
    openModal('modal-receipt');
  }
  function generateReceiptFromQuote(id){ openReceiptModal(id); }
  function saveReceipt(){
    const clientId = $('receipt-client').value;
    const value = Number($('receipt-value').value)||0;
    if(!clientId){ toast('Selecione o cliente'); return; }
    if(value<=0){ toast('Valor inválido'); return; }
    const quoteId = $('receipt-quote-id').value || null;
    const r = {
      id: uid(),
      number: nextReceiptNumber(),
      clientId,
      quoteId,
      ref: $('receipt-ref').value.trim(),
      value,
      extenso: $('receipt-extenso').value.trim(),
      notes: $('receipt-notes').value.trim(),
      createdAt: new Date().toISOString()
    };
    state.receipts.push(r);
    Storage.saveAll();
    closeModal('modal-receipt');
    toast('Recibo salvo');
    renderReceipts();
    downloadReceipt(r.id);
  }
  async function downloadReceipt(id){
    const r = state.receipts.find(x=>x.id===id); if(!r) return;
    const c = state.clients.find(x=>x.id===r.clientId);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    const brand = state.company.color1 || '#2563eb';
    if(state.company.logo){ try { doc.addImage(state.company.logo, 'PNG', margin, 15, 22, 22); } catch(e){} }
    const tx = state.company.logo ? margin+26 : margin;
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...hexToRgb(brand));
    doc.text(state.company.name || '', tx, 22);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80);
    let y = 30;
    if(state.company.doc){ doc.text(state.company.doc, tx, y); y+=4; }
    if(state.company.phone||state.company.whatsapp){ doc.text([state.company.phone,state.company.whatsapp].filter(Boolean).join(' · '), tx, y); y+=4; }
    y += 4;
    doc.setDrawColor(...hexToRgb(brand)); doc.line(margin, y, pageW-margin, y); y += 10;
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...hexToRgb(brand));
    doc.text('RECIBO', pageW/2, y, {align:'center'}); y += 6;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(40);
    doc.text(r.number, pageW-margin, y, {align:'right'}); y += 8;
    doc.text(`Recebi de *${c?.name||''}* ${c?.doc?'('+(c.doc)+')':''} a quantia de *${brl(r.value)}*${r.extenso?` (${r.extenso})`:''}, referente a *${r.ref||'serviços prestados'}*${r.notes?`. Obs: ${r.notes}`:''}.`, margin, y, {maxWidth: pageW-margin*2});
    y += 20;
    const city = state.company.address ? state.company.address.split(',').pop()?.trim() : '';
    doc.text(`${city||'________________'}, ${fmtDate(r.createdAt)}.`, pageW/2, y, {align:'center'});
    y += 25;
    doc.line(pageW/2-40, y, pageW/2+40, y);
    doc.setFontSize(9); doc.text(state.company.name || '', pageW/2, y+4, {align:'center'});
    if(state.company.doc){ doc.text(state.company.doc, pageW/2, y+8, {align:'center'}); }
    doc.save(`${r.number}.pdf`);
  }

  /* ---------- CARTÃO DIGITAL ---------- */
  function renderCard(){
    $('card-profession').value = state.card.profession || '';
    $('card-desc').value = state.card.desc || '';
    $('card-city').value = state.card.city || '';
    $('card-insta').value = state.card.insta || '';
    $('card-fb').value = state.card.fb || '';
    const logo = state.company.logo ? `<img src="${state.company.logo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--brand)">` : `<div style="width:80px;height:80px;border-radius:50%;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800">${initials(state.company.name||'O')}</div>`;
    $('card-preview').innerHTML = `
      <div style="text-align:center;padding:1rem 0">
        ${logo}
        <div style="font-weight:800;font-size:1.2rem;margin-top:.6rem">${escapeHtml(state.company.name||'Seu Nome')}</div>
        <div style="color:var(--muted);font-size:.9rem">${escapeHtml(state.card.profession||'Profissão')}</div>
        ${state.card.desc?`<div style="margin-top:.5rem;font-size:.88rem">${escapeHtml(state.card.desc)}</div>`:''}
        <div class="divider"></div>
        <div style="font-size:.88rem;line-height:1.9;text-align:left">
          ${state.company.whatsapp?`<div><i class="fa-brands fa-whatsapp" style="color:#25d366"></i> ${escapeHtml(state.company.whatsapp)}</div>`:''}
          ${state.company.phone?`<div><i class="fa-solid fa-phone"></i> ${escapeHtml(state.company.phone)}</div>`:''}
          ${state.company.email?`<div><i class="fa-solid fa-envelope"></i> ${escapeHtml(state.company.email)}</div>`:''}
          ${state.card.city?`<div><i class="fa-solid fa-location-dot"></i> ${escapeHtml(state.card.city)}</div>`:''}
          ${state.card.insta?`<div><i class="fa-brands fa-instagram" style="color:#e1306c"></i> ${escapeHtml(state.card.insta)}</div>`:''}
          ${state.card.fb?`<div><i class="fa-brands fa-facebook" style="color:#1877f2"></i> ${escapeHtml(state.card.fb)}</div>`:''}
        </div>
      </div>
    `;
  }
  function saveCard(){
    state.card.profession = $('card-profession').value;
    state.card.desc = $('card-desc').value;
    state.card.city = $('card-city').value;
    state.card.insta = $('card-insta').value;
    state.card.fb = $('card-fb').value;
    Storage.saveAll();
  }
  function shareCard(){
    const text = buildCardText();
    if(navigator.share){ navigator.share({text, title:'Cartão digital'}).catch(()=>{}); }
    else { navigator.clipboard.writeText(text).then(()=>toast('Cartão copiado')); }
  }
  function shareCardWA(){
    const text = buildCardText();
    const phone = onlyDigits(state.company.whatsapp);
    const url = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url,'_blank');
  }
  function buildCardText(){
    const lines = [`*${state.company.name||''}*`];
    if(state.card.profession) lines.push(state.card.profession);
    if(state.card.desc) lines.push(state.card.desc);
    if(state.company.whatsapp) lines.push(`📱 ${state.company.whatsapp}`);
    if(state.company.email) lines.push(`✉️ ${state.company.email}`);
    if(state.card.city) lines.push(`📍 ${state.card.city}`);
    return lines.join('\n');
  }

  /* ---------- FOLLOW-UP ---------- */
  function reminderWA(id){
    const q = state.quotes.find(x=>x.id===id); if(!q) return;
    const c = state.clients.find(x=>x.id===q.clientId);
    const msg = `Olá${c?` ${c.name.split(' ')[0]}`:''}! Tudo bem? Passando para saber se conseguiu avaliar o orçamento *${q.number}* no valor de *${brl(q.total||0)}*. Qualquer dúvida estou à disposição!`;
    const phone = onlyDigits(c?.whatsapp || c?.phone);
    const url = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url,'_blank');
  }

  /* ---------- GERADOR DE LOGO IA ---------- */
  function openLogoGenerator(){
    // Preenche com dados atuais da empresa
    $('logo-title').value = state.company.name || '';
    $('logo-subtitle').value = state.card.profession || 'Soluções profissionais';
    $('logo-color1').value = state.company.color1 || '#2563eb';
    $('logo-color2').value = state.company.color2 || '#1e40af';
    state.ui.logoGen.icon = 'fa-briefcase';
    state.ui.logoGen.style = 'modern';
    renderIconGrid();
    updateLogoCounts();
    previewLogoGen();
    openModal('modal-logo-gen');
  }

  function renderIconGrid(){
    $('logo-icon-grid').innerHTML = LOGO_ICONS.map(ic =>
      `<button type="button" class="icon-opt ${state.ui.logoGen.icon===ic.k?'selected':''}" data-icon="${ic.k}" title="${ic.l}" onclick="App.selectLogoIcon('${ic.k}')">
        <i class="fa-solid ${ic.k}"></i>
      </button>`
    ).join('');
  }

  function selectLogoIcon(iconKey){
    state.ui.logoGen.icon = iconKey;
    document.querySelectorAll('.icon-opt').forEach(b => b.classList.toggle('selected', b.dataset.icon===iconKey));
    previewLogoGen();
  }

  function setLogoStyle(style){
    state.ui.logoGen.style = style;
    document.querySelectorAll('.logo-style-opt').forEach(b => b.classList.toggle('selected', b.dataset.style===style));
    previewLogoGen();
  }

  function updateLogoCounts(){
  const maxTitle = 10;
  const maxSubtitle = 20;

  const t = $('logo-title').value || '';
  const s = $('logo-subtitle').value || '';

  const remainingTitle = maxTitle - t.length;
  const remainingSubtitle = maxSubtitle - s.length;

  $('logo-title-count').textContent = remainingTitle;
  $('logo-subtitle-count').textContent = remainingSubtitle;

  $('logo-title-count').style.color = remainingTitle >= 0 ? 'var(--ok)' : 'var(--danger)';
  $('logo-subtitle-count').style.color = remainingSubtitle >= 0 ? 'var(--ok)' : 'var(--danger)';
}
  
  function previewLogoGen(){
    updateLogoCounts();
    const title = $('logo-title').value || '';
    const subtitle = $('logo-subtitle').value || '';
    const color1 = $('logo-color1').value;
    const color2 = $('logo-color2').value;
    state.ui.logoGen.title = title;
    state.ui.logoGen.subtitle = subtitle;
    state.ui.logoGen.color1 = color1;
    state.ui.logoGen.color2 = color2;

    const canvas = $('logo-preview-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    const style = state.ui.logoGen.style;
    const iconKey = state.ui.logoGen.icon;

    // Background
    if(style === 'modern'){
      const grd = ctx.createLinearGradient(0,0,W,H);
      grd.addColorStop(0, color1); grd.addColorStop(1, color2);
      ctx.fillStyle = grd;
      roundRect(ctx, 0, 0, W, H, 60); ctx.fill();
    } else if(style === 'classic'){
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, W, H, 60); ctx.fill();
      ctx.strokeStyle = color1; ctx.lineWidth = 12;
      roundRect(ctx, 10, 10, W-20, H-20, 50); ctx.stroke();
    } else if(style === 'bold'){
      ctx.fillStyle = color1;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = color2;
      ctx.beginPath(); ctx.moveTo(0, H*0.7); ctx.lineTo(W, H*0.5); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    } else if(style === 'minimal'){
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, W, H, 60); ctx.fill();
      ctx.strokeStyle = color1; ctx.lineWidth = 4;
      roundRect(ctx, 20, 20, W-40, H-40, 40); ctx.stroke();
    }

    // Ícone (usando Font Awesome via unicode)
    const iconUnicode = getFAUnicode(iconKey);
    if(iconUnicode){
      const iconSize = style==='minimal' ? 100 : 130;
      const iconY = style==='minimal' ? H*0.32 : H*0.35;
      ctx.font = `900 ${iconSize}px "Font Awesome 6 Free"`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = style==='classic' || style==='minimal' ? color1 : 'rgba(255,255,255,0.95)';
      ctx.fillText(iconUnicode, W/2, iconY);
    }

    // Título
    const titleColor = (style==='classic' || style==='minimal') ? color1 : '#ffffff';
    const titleY = iconUnicode ? H*0.58 : H*0.45;
    ctx.fillStyle = titleColor;
    const titleFontSize = Math.max(28, Math.min(56, Math.floor(500 / Math.max(title.length, 6))));
    ctx.font = `800 ${titleFontSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const displayTitle = title.toUpperCase();
    // quebra em 2 linhas se muito longo
    if(displayTitle.length > 16 && displayTitle.includes(' ')){
      const mid = Math.floor(displayTitle.length/2);
      let splitIdx = displayTitle.indexOf(' ', mid-5);
      if(splitIdx<0 || splitIdx > mid+5) splitIdx = displayTitle.indexOf(' ');
      const line1 = displayTitle.slice(0, splitIdx);
      const line2 = displayTitle.slice(splitIdx+1);
      ctx.fillText(line1, W/2, titleY - titleFontSize*0.4);
      ctx.fillText(line2, W/2, titleY + titleFontSize*0.5);
    } else {
      ctx.fillText(displayTitle, W/2, titleY);
    }

    // Subtítulo
    const subColor = (style==='classic' || style==='minimal') ? '#64748b' : 'rgba(255,255,255,0.9)';
    const subY = iconUnicode ? H*0.76 : H*0.62;
    ctx.fillStyle = subColor;
    const subFontSize = Math.max(18, Math.min(32, Math.floor(360 / Math.max(subtitle.length, 8))));
    ctx.font = `500 ${subFontSize}px Inter, Arial, sans-serif`;
    ctx.fillText(subtitle, W/2, subY);
  }

  function getFAUnicode(iconKey){
    // Mapeamento dos ícones Font Awesome 6 Free (solid) mais usados para unicode
    const map = {
      'fa-briefcase':'\uf0b1','fa-laptop-code':'\uf5fc','fa-wrench':'\uf0ad',
      'fa-screwdriver-wrench':'\uf7d9','fa-paint-roller':'\uf5aa','fa-hammer':'\uf6e3',
      'fa-bolt':'\uf0e7','fa-plug':'\uf1e6','fa-car':'\uf1b9',
      'fa-motorcycle':'\uf21c','fa-utensils':'\uf2e7','fa-cake-candles':'\uf1fd',
      'fa-scissors':'\uf0c4','fa-spa':'\uf5bb','fa-dumbbell':'\uf44b',
      'fa-camera':'\uf030','fa-music':'\uf001','fa-video':'\uf03d',
      'fa-graduation-cap':'\uf19d','fa-stethoscope':'\uf0f1','fa-tooth':'\uf5c9',
      'fa-paw':'\uf1b0','fa-seedling':'\uf4d8','fa-house-chimney':'\uf3ab',
      'fa-key':'\uf084','fa-shirt':'\uf553','fa-gem':'\uf3a5',
      'fa-truck':'\uf0d1','fa-plane':'\uf072','fa-dragon':'\uf6d5',
      'fa-rocket':'\uf135','fa-shield-halved':'\uf3ed','fa-scale-balanced':'\uf24e',
      'fa-calculator':'\uf1ec','fa-chart-line':'\uf201','fa-lightbulb':'\uf0eb',
      'fa-crown':'\uf521','fa-fire':'\uf06d','fa-star':'\uf005',
      'fa-leaf':'\uf06c','fa-sun':'\uf185','fa-droplet':'\uf043'
    };
    return map[iconKey] || null;
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  // DEPOIS
function applyGeneratedLogo(){
  const title = $('logo-title').value.trim();
  const subtitle = $('logo-subtitle').value.trim();
  if(!title){ toast('Preencha o título'); return; }
  if(title.length > 10){ toast('Título deve ter no máximo 10 caracteres'); return; }
  if(!subtitle){ toast('Preencha o subtítulo'); return; }
  if(subtitle.length > 20){ toast('Subtítulo deve ter no máximo 20 caracteres'); return; }

    // renderiza em alta resolução
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const style = state.ui.logoGen.style;
    const iconKey = state.ui.logoGen.icon;
    const color1 = state.ui.logoGen.color1;
    const color2 = state.ui.logoGen.color2;

    // Background
    if(style === 'modern'){
      const grd = ctx.createLinearGradient(0,0,W,H);
      grd.addColorStop(0, color1); grd.addColorStop(1, color2);
      ctx.fillStyle = grd;
      roundRect(ctx, 0, 0, W, H, 120); ctx.fill();
    } else if(style === 'classic'){
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, W, H, 120); ctx.fill();
      ctx.strokeStyle = color1; ctx.lineWidth = 24;
      roundRect(ctx, 20, 20, W-40, H-40, 100); ctx.stroke();
    } else if(style === 'bold'){
      ctx.fillStyle = color1;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = color2;
      ctx.beginPath(); ctx.moveTo(0, H*0.7); ctx.lineTo(W, H*0.5); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    } else if(style === 'minimal'){
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, W, H, 120); ctx.fill();
      ctx.strokeStyle = color1; ctx.lineWidth = 8;
      roundRect(ctx, 40, 40, W-80, H-80, 80); ctx.stroke();
    }

    // Ícone
    const iconUnicode = getFAUnicode(iconKey);
    if(iconUnicode){
      const iconSize = style==='minimal' ? 200 : 260;
      const iconY = style==='minimal' ? H*0.32 : H*0.35;
      ctx.font = `900 ${iconSize}px "Font Awesome 6 Free"`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = style==='classic' || style==='minimal' ? color1 : 'rgba(255,255,255,0.95)';
      ctx.fillText(iconUnicode, W/2, iconY);
    }

    // Título
    const titleColor = (style==='classic' || style==='minimal') ? color1 : '#ffffff';
    const titleY = iconUnicode ? H*0.58 : H*0.45;
    ctx.fillStyle = titleColor;
    const titleFontSize = Math.max(56, Math.min(112, Math.floor(1000 / Math.max(title.length, 6))));
    ctx.font = `800 ${titleFontSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const displayTitle = title.toUpperCase();
    if(displayTitle.length > 16 && displayTitle.includes(' ')){
      const mid = Math.floor(displayTitle.length/2);
      let splitIdx = displayTitle.indexOf(' ', mid-5);
      if(splitIdx<0 || splitIdx > mid+5) splitIdx = displayTitle.indexOf(' ');
      const line1 = displayTitle.slice(0, splitIdx);
      const line2 = displayTitle.slice(splitIdx+1);
      ctx.fillText(line1, W/2, titleY - titleFontSize*0.4);
      ctx.fillText(line2, W/2, titleY + titleFontSize*0.5);
    } else {
      ctx.fillText(displayTitle, W/2, titleY);
    }

    // Subtítulo
    const subColor = (style==='classic' || style==='minimal') ? '#64748b' : 'rgba(255,255,255,0.9)';
    const subY = iconUnicode ? H*0.76 : H*0.62;
    ctx.fillStyle = subColor;
    const subFontSize = Math.max(36, Math.min(64, Math.floor(720 / Math.max(subtitle.length, 8))));
    ctx.font = `500 ${subFontSize}px Inter, Arial, sans-serif`;
    ctx.fillText(subtitle, W/2, subY);

    state.company.logo = canvas.toDataURL('image/png', 0.95);
    state.company.name = title;
    if(!state.card.profession) state.card.profession = subtitle;
    Storage.saveAll();
    closeModal('modal-logo-gen');
    renderLogoPreview();
    fillMore();
    toast('Logo aplicada com sucesso!');
  }

  async function createPublicLink(id){
    try {
      const r = await fetch('/.netlify/functions/create-public-link', {method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({quoteId:id})});
      const data = await r.json();
      if(!r.ok) throw new Error(data.message || 'Erro ao criar link');
      await navigator.clipboard?.writeText(data.url);
      toast('Link público copiado');
    } catch(e){ console.error(e); toast(e.message || 'Não foi possível criar o link'); }
  }

  /* ---------- MODAIS ---------- */
  function openModal(id){ $(id).classList.add('open'); }
  function closeModal(id){ $(id).classList.remove('open'); }

  /* ---------- FILTROS ---------- */
  function openQuotesFilter(){
    $('filter-client').innerHTML = '<option value="">Todos</option>' + state.clients.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    const f = state.ui.quotesFilter || {};
    $('filter-status').value = f.status || '';
    $('filter-client').value = f.client || '';
    $('filter-period').value = f.period || '';
    openModal('modal-quotes-filter');
  }
  function applyQuotesFilter(){
    state.ui.quotesFilter = {
      status: $('filter-status').value,
      client: $('filter-client').value,
      period: $('filter-period').value
    };
    closeModal('modal-quotes-filter');
    renderQuotes();
  }
  function clearQuotesFilter(){
    state.ui.quotesFilter = {};
    $('filter-status').value = ''; $('filter-client').value = ''; $('filter-period').value = '';
    closeModal('modal-quotes-filter');
    renderQuotes();
  }

  /* ---------- SOBRE ---------- */
  function openAbout(){
    openModal('modal-about');
  }
  function contactCreator(){
    const msg = 'Olá Jairo! Vi o OrçaZAP Pro e gostaria de saber mais.';
    window.open(`https://wa.me/5585991088705?text=${encodeURIComponent(msg)}`, '_blank');
  }

  /* ---------- EMPRESA / CONFIG ---------- */
  function saveCompany(){
    state.company.name = $('company-name').value;
    state.company.doc = $('company-doc').value;
    state.company.phone = $('company-phone').value;
    state.company.whatsapp = $('company-whatsapp').value;
    state.company.email = $('company-email').value;
    state.company.address = $('company-address').value;
    state.company.color1 = $('company-color1').value;
    state.company.color2 = $('company-color2').value;
    state.company.pixKey = $('pix-key').value;
    state.company.pixName = $('pix-name').value;
    state.company.pixCity = $('pix-city').value;
    Storage.saveAll();
  }
  function saveSettings(){
    state.settings.prefix = $('settings-prefix').value || 'ORC';
    state.settings.validity = Number($('settings-validity').value)||7;
    state.settings.payment = $('settings-payment').value;
    state.settings.deadline = $('settings-deadline').value;
    state.settings.warranty = $('settings-warranty').value;
    state.settings.terms = $('settings-terms').value;
    state.settings.followup = Number($('settings-followup').value)||3;
    Storage.saveAll();
  }
  function fillMore(){
    $('company-name').value = state.company.name||'';
    $('company-doc').value = state.company.doc||'';
    $('company-phone').value = state.company.phone||'';
    $('company-whatsapp').value = state.company.whatsapp||'';
    $('company-email').value = state.company.email||'';
    $('company-address').value = state.company.address||'';
    $('company-color1').value = state.company.color1||'#2563eb';
    $('company-color2').value = state.company.color2||'#16a34a';
    $('pix-key').value = state.company.pixKey||'';
    $('pix-name').value = state.company.pixName||'';
    $('pix-city').value = state.company.pixCity||'';
    $('settings-prefix').value = state.settings.prefix||'ORC';
    $('settings-validity').value = state.settings.validity||7;
    $('settings-payment').value = state.settings.payment||'';
    $('settings-deadline').value = state.settings.deadline||'';
    $('settings-warranty').value = state.settings.warranty||'';
    $('settings-terms').value = state.settings.terms||'';
    $('settings-followup').value = state.settings.followup||3;
    renderLogoPreview();
  }
  function uploadLogo(e){
    const f = e.target.files[0]; if(!f) return;
    if(f.size > 2*1024*1024){ toast('Logo muito grande (máx 2MB)'); return; }
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 400;
        let w = img.width, h = img.height;
        if(w>h && w>max){ h = h*(max/w); w = max; } else if(h>max){ w = w*(max/h); h = max; }
        const cv = document.createElement('canvas'); cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        state.company.logo = cv.toDataURL('image/png', 0.9);
        Storage.saveAll(); renderLogoPreview(); toast('Logo salva');
      };
      img.src = r.result;
    };
    r.readAsDataURL(f);
  }
  function clearLogo(){ state.company.logo=''; Storage.saveAll(); renderLogoPreview(); }
  function renderLogoPreview(){
    $('company-logo-preview').innerHTML = state.company.logo ? `<img src="${state.company.logo}" style="max-height:70px;border-radius:.6rem;border:1px solid var(--border)">` : '';
  }

  /* ---------- BACKUP ---------- */
  function exportBackup(){
    const data = {
      version: 2, exportedAt: new Date().toISOString(),
      company: state.company, settings: state.settings,
      clients: state.clients, catalog: state.catalog,
      quotes: state.quotes, receipts: state.receipts, card: state.card
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `orcacap-backup-${todayISO()}.json`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    toast('Backup exportado');
  }
  function importBackup(e){
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if(!data || typeof data !== 'object'){ toast('Arquivo inválido'); return; }
        if(!confirm('Importar backup? Os dados atuais serão substituídos.')) return;
        if(data.company) Object.assign(state.company, data.company);
        if(data.settings) Object.assign(state.settings, data.settings);
        state.clients = data.clients || [];
        state.catalog = data.catalog || [];
        state.quotes = data.quotes || [];
        state.receipts = data.receipts || [];
        if(data.card) Object.assign(state.card, data.card);
        Storage.saveAll();
        toast('Backup importado');
        goto('dashboard');
      } catch(err){ console.error(err); toast('Erro ao importar'); }
    };
    r.readAsText(f);
    e.target.value = '';
  }

  /* ---------- INIT ---------- */
  function bindNav(){
    document.querySelectorAll('.nav-btn, .side-btn').forEach(b => {
      b.addEventListener('click', () => goto(b.dataset.page));
    });
    document.querySelectorAll('.modal-backdrop').forEach(m => {
      m.addEventListener('click', (e) => { if(e.target === m) m.classList.remove('open'); });
    });
    // Atualiza preview quando campos de condição mudam
    ['new-payment','new-validity','new-deadline','new-warranty','new-notes'].forEach(id => {
      const el = $(id);
      if(el) el.addEventListener('input', updateWAPreview);
    });
    const pixCb = $('new-show-pix');
    if(pixCb) pixCb.addEventListener('change', updateWAPreview);
  }

  function init(){
    Storage.loadAll();
    bindNav();
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW',e));
    }
    renderDashboard();
  }

  return {
    goto, setDocType, openClientModal, saveClient, waClient, openClientDetail, deleteClient,
    openCatalogModal, saveCatalogItem, duplicateCatalog, deleteCatalog,
    renderClientPicker, selectClient, clearNewClient, renderCatalogPicker,
    addCatalogItem, addManualItem, updateItem, removeItem, recalc,
    saveQuote, previewPDF, downloadPDF, sendWhatsApp, shareQuote, copyWAPreview,
    openQuoteDetail, editQuote, duplicateQuote, approveQuote, rejectQuote, deleteQuote,
    previewQuotePDF, downloadQuotePDF, downloadCurrentPDF, shareCurrentPDF, sendQuoteWA, shareQuoteById,
    openVoiceModal, toggleVoice, stopVoice, applyVoice,
    openSignatureForQuote, clearSignature, confirmSignature,
    openReceiptModal, saveReceipt, downloadReceipt, generateReceiptFromQuote,
    saveCard, shareCard, shareCardWA,
    reminderWA,
    openLogoGenerator, selectLogoIcon, setLogoStyle, previewLogoGen, applyGeneratedLogo,
    openAbout, contactCreator,
    openModal, closeModal, createPublicLink,
    openQuotesFilter, applyQuotesFilter, clearQuotesFilter,
    saveCompany, saveSettings, uploadLogo, clearLogo,
    exportBackup, importBackup,
    renderQuotes, renderClients, renderCatalog, renderReceipts, renderDashboard, renderCard,
    init
  };
})();

document.addEventListener('DOMContentLoaded', () => window.App?.init?.());

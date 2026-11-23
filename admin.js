(() => {
  const $ = (id) => document.getElementById(id);
  const authView = $('authView'), appView = $('appView');
  const configReady = window.SAZU_SUPABASE_URL && window.SAZU_SUPABASE_ANON_KEY && !window.SAZU_SUPABASE_URL.includes('YOUR_') && !window.SAZU_SUPABASE_ANON_KEY.includes('YOUR_');
  let db = null, currentUser = null, coursesCache = [];
  const say = (message) => { const el=$('toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2800); };
  const esc = (value='') => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function showAuth(message='') { authView.hidden=false; appView.hidden=true; $('authMessage').textContent=message; }
  function showApp(user) { currentUser=user; authView.hidden=true; appView.hidden=false; $('adminEmail').textContent=user.email||'Admin'; loadDashboard(); }
  async function verifyAdmin(user) {
    const { data, error } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    if (error || !data) {
      await db.auth.signOut();
      showAuth(error ? 'Admin huquqini tekshirib bo‘lmadi: ' + error.message : 'Bu hisobda administrator huquqi yo‘q.');
      return false;
    }
    showApp(user);
    return true;
  }
  if (!configReady || !window.supabase) { showAuth('Avval supabase-config.js fayliga Supabase Project URL va anon key kiriting.'); $('loginForm').addEventListener('submit',e=>e.preventDefault()); return; }
  db = window.supabase.createClient(window.SAZU_SUPABASE_URL, window.SAZU_SUPABASE_ANON_KEY);
  $('loginForm').addEventListener('submit', async e=>{ e.preventDefault(); $('authMessage').textContent='Tekshirilmoqda...'; const {data,error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value}); if(error){$('authMessage').textContent='Kirish amalga oshmadi: '+error.message;return;} await verifyAdmin(data.user); });
  $('logoutBtn').addEventListener('click',async()=>{await db.auth.signOut();showAuth('Hisobdan chiqdingiz.');});
  db.auth.getSession().then(async ({data})=>{if(data.session) await verifyAdmin(data.session.user);});
  $('themeBtn').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('themeBtn').textContent=dark?'☀':'☾';localStorage.setItem('sazu-admin-theme',dark?'dark':'light');});
  document.documentElement.dataset.theme=localStorage.getItem('sazu-admin-theme')||'light';$('themeBtn').textContent=document.documentElement.dataset.theme==='dark'?'☀':'☾';
  document.querySelectorAll('.side-link').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
  function navigate(page){document.querySelectorAll('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));document.querySelectorAll('.page').forEach(p=>p.hidden=p.id!==page+'Page');$('pageTitle').textContent=({overview:'Umumiy ko\'rinish',courses:'Kurslar',leads:'Arizalar',branches:'Filiallar'})[page]||'Admin';if(page==='courses')loadCourses();if(page==='leads')loadLeads();}
  async function loadDashboard(){ $('year').textContent=new Date().getFullYear(); const [c,l]=await Promise.all([db.from('courses').select('id',{count:'exact',head:true}),db.from('leads').select('id,status',{count:'exact'})]); if(c.error||l.error){say('Jadvallar topilmadi. SQL faylni Supabase SQL Editor’da ishga tushiring.');return;} $('courseCount').textContent=c.count??0;$('leadCount').textContent=l.count??0;$('newLeadCount').textContent=(l.data||[]).filter(x=>x.status==='new').length;loadRecent(); }
  async function loadRecent(){const {data,error}=await db.from('leads').select('id,name,phone,course,status,created_at').order('created_at',{ascending:false}).limit(5);$('recentLeads').innerHTML=error?'<tr><td colspan="5" class="empty">'+esc(error.message)+'</td></tr>':(data.length?data.map(leadRow).join(''):'<tr><td colspan="5" class="empty">Hozircha arizalar yo‘q</td></tr>');}
  async function loadCourses(){const {data,error}=await db.from('courses').select('*').order('created_at',{ascending:false});if(error){$('coursesTable').innerHTML='<tr><td colspan="4" class="empty">'+esc(error.message)+'</td></tr>';return;}coursesCache=data||[];$('coursesTable').innerHTML=coursesCache.length?coursesCache.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.category||'—')}</td><td><span class="status ${c.active?'':'pending'}">${c.active?'Faol':'Nofaol'}</span></td><td><div class="row-actions"><button class="mini-btn" data-edit="${c.id}">Tahrirlash</button><button class="mini-btn" data-delete="${c.id}">O‘chirish</button></div></td></tr>`).join(''):'<tr><td colspan="4" class="empty">Kurslar hali qo‘shilmagan</td></tr>';document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editCourse(b.dataset.edit));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteCourse(b.dataset.delete));}
  function leadRow(x){return `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.phone)}</td><td>${esc(x.course||'—')}</td><td>${new Date(x.created_at).toLocaleDateString()}</td><td><span class="status ${x.status==='new'?'pending':''}">${x.status==='new'?'Yangi':x.status==='contacted'?'Bog‘lanildi':'Yakunlandi'}</span></td></tr>`;}
  async function loadLeads(){const {data,error}=await db.from('leads').select('*').order('created_at',{ascending:false});$('leadsTable').innerHTML=error?`<tr><td colspan="6" class="empty">${esc(error.message)}</td></tr>`:(data.length?data.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.phone)}</td><td>${esc(x.course||'—')}</td><td>${new Date(x.created_at).toLocaleString()}</td><td><select class="status-select" data-status="${x.id}"><option value="new" ${x.status==='new'?'selected':''}>Yangi</option><option value="contacted" ${x.status==='contacted'?'selected':''}>Bog‘lanildi</option><option value="done" ${x.status==='done'?'selected':''}>Yakunlandi</option></select></td><td><button class="mini-btn" data-remove-lead="${x.id}">O‘chirish</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Hozircha arizalar yo‘q</td></tr>');document.querySelectorAll('[data-status]').forEach(s=>s.onchange=async()=>{const {error}=await db.from('leads').update({status:s.value}).eq('id',s.dataset.status);say(error?error.message:'Ariza holati yangilandi');loadDashboard();});document.querySelectorAll('[data-remove-lead]').forEach(b=>b.onclick=async()=>{if(!confirm('Arizani o‘chirishni tasdiqlaysizmi?'))return;const {error}=await db.from('leads').delete().eq('id',b.dataset.removeLead);say(error?error.message:'Ariza o‘chirildi');loadLeads();loadDashboard();});}
  $('refreshLeads').onclick=loadLeads;
  const dialog=$('courseDialog');$('addCourseBtn').onclick=()=>{ $('courseForm').reset();$('courseId').value='';$('dialogTitle').textContent='Yangi kurs';dialog.showModal();};
  function editCourse(id){const c=coursesCache.find(x=>String(x.id)===String(id));if(!c)return;$('courseId').value=c.id;$('courseName').value=c.name;$('courseCategory').value=c.category||'';$('courseActive').value=String(c.active);$('dialogTitle').textContent='Kursni tahrirlash';dialog.showModal();}
  $('closeDialog').onclick=$('cancelDialog').onclick=()=>dialog.close();
  $('courseForm').addEventListener('submit',async e=>{e.preventDefault();const id=$('courseId').value,payload={name:$('courseName').value.trim(),category:$('courseCategory').value.trim(),active:$('courseActive').value==='true'};const result=id?await db.from('courses').update(payload).eq('id',id):await db.from('courses').insert(payload);if(result.error){say(result.error.message);return;}dialog.close();say('Kurs saqlandi');loadCourses();loadDashboard();});
  async function deleteCourse(id){if(!confirm('Kursni o‘chirishni tasdiqlaysizmi?'))return;const {error}=await db.from('courses').delete().eq('id',id);say(error?error.message:'Kurs o‘chirildi');loadCourses();loadDashboard();}
})();

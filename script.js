const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    events: [],
    enrollments: [],
    usersList: [],
    paymentTimer: null,
    scanner: null
};

let currentEditId = null; 

window.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    await fetchEvents();

    if(state.user) {
        await fetchUserEnrollments(); 
        const isStaff = state.user.role === 'admin' || state.user.role === 'servidor';
        navigateTo(isStaff ? 'admin-dashboard' : 'home');
    } else {
        navigateTo('home');
    }
});

async function fetchEvents() {
    try {
        const res = await fetch('api_eventos.php');
        state.events = await res.json();
    } catch (err) { state.events = []; }
}

async function fetchUserEnrollments() {
    if (!state.user) return;
    try {
        const res = await fetch(`api_my_events.php?user_id=${state.user.id}`);
        state.enrollments = await res.json();
    } catch (err) { state.enrollments = []; }
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('input-email').value;
    const password = document.getElementById('input-password').value;
    const isRegister = !document.getElementById('field-name').classList.contains('hidden');
    const url = isRegister ? 'api_register.php' : 'api_login.php';
    
    const btn = document.getElementById('auth-btn-text');
    btn.innerText = "Processando...";

    try {
        const body = { email, password };
        if(isRegister) body.name = document.getElementById('auth-input-name').value;

        const res = await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
            loginSuccess(data.user);
        } else { 
            alert(data.message || "Erro ao logar"); 
        }
    } catch (err) { alert("Erro de conexão."); } 
    finally { btn.innerText = isRegister ? "Criar Conta" : "Entrar"; }
}

function loginSuccess(user) {
    state.user = user;
    localStorage.setItem('user', JSON.stringify(state.user));
    fetchUserEnrollments().then(() => {
        const isStaff = state.user.role === 'admin' || state.user.role === 'servidor';
        navigateTo(isStaff ? 'admin-dashboard' : 'home');
    });
}

function logout() {
    localStorage.removeItem('user');
    state.user = null;
    state.enrollments = [];
    navigateTo('home');
}

function toggleAuth(isLogin) {
    document.getElementById('field-name').classList.toggle('hidden', isLogin);
    document.getElementById('auth-input-name').required = !isLogin;
    document.getElementById('auth-btn-text').innerText = isLogin ? 'Entrar' : 'Criar Conta';
    document.getElementById('tab-login').className = isLogin ? "flex-1 py-2.5 rounded-lg bg-white shadow text-sm font-bold text-gray-900 transition-all" : "flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-bold transition-all";
    document.getElementById('tab-register').className = !isLogin ? "flex-1 py-2.5 rounded-lg bg-white shadow text-sm font-bold text-gray-900 transition-all" : "flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-bold transition-all";
}

function navigateTo(pageId) {
    const role = state.user?.role;
    const isStaff = role === 'admin' || role === 'servidor';

    if ((['dashboard', 'profile', 'user-scanner'].includes(pageId)) && !state.user) return navigateTo('login');
    
    if (pageId.startsWith('admin') && !isStaff) return navigateTo('home');

    if (role === 'servidor') {
        if (pageId === 'admin-users') {
            alert("Apenas Administradores podem gerenciar usuários.");
            return;
        }
        if (pageId === 'admin-qrcode') {
            alert("Apenas Administradores podem gerar QR Codes.");
            return;
        }
    }

    if(state.scanner) stopScanner();
    if(state.paymentTimer) clearInterval(state.paymentTimer);
    if(typeof qrInterval !== 'undefined' && qrInterval) clearInterval(qrInterval);
    
    document.querySelectorAll('.page-section').forEach(el => { 
        el.classList.remove('active'); 
        el.style.display = 'none'; 
    });
    
    const target = document.getElementById(`page-${pageId}`);
    if (target) { 
        target.style.display = 'block'; 
        setTimeout(() => target.classList.add('active'), 10); 
        window.scrollTo(0, 0); 
    }
    
    updateNavbar(pageId);

    if(pageId === 'home') renderCards(state.events.slice(0,3), 'home-events-grid');
    if(pageId === 'public-events') renderCards(state.events, 'public-events-grid');
    if(pageId === 'dashboard') loadMyEvents();
    if(pageId === 'profile') renderProfile();
    
    if(pageId === 'admin-dashboard') {
        renderAdminStatsOverview();
        const title = document.getElementById('dashboard-title');
        if(title) title.innerText = role === 'servidor' ? 'Painel Servidor' : 'Painel Admin';
    }
    
    if(pageId === 'admin-users') loadAdminUsers();
    if(pageId === 'admin-qrcode') initAdminQR();
    if(pageId === 'admin-stats') initStatsPage();

    lucide.createIcons();
}

function updateNavbar(currPage) {
    const nav = document.getElementById('nav-items-desktop');
    const mob = document.getElementById('mobile-menu');
    
    let items = [{id:'public-events', l:'Eventos', a:"navigateTo('public-events')", i:'globe'}];
    
    if (state.user) {
        if(state.user.role === 'admin' || state.user.role === 'servidor') {
            const label = state.user.role === 'servidor' ? 'Painel Servidor' : 'Painel Admin';
            items.push({id:'admin-dashboard', l: label, a:"navigateTo('admin-dashboard')", i:'layout-dashboard'});
        } else {
            items.push({id:'dashboard', l:'Meus Ingressos', a:"navigateTo('dashboard')", i:'ticket'});
            items.push({id:'user-scanner', l:'Scanner', a:"navigateTo('user-scanner')", i:'scan'});
        }
        items.push({id:'profile', l:'Perfil', a:"navigateTo('profile')", i:'user'});
        items.push({id:'logout', l:'Sair', a:"logout()", i:'log-out', red:true});
    } else { 
        items.push({id:'login', l:'Entrar', a:"navigateTo('login')", i:'log-in', pri:true}); 
    }
    
    const render = (i) => `<button onclick="${i.a}" class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${currPage === i.id ? 'bg-brand-50 text-brand-600 font-bold' : (i.pri ? 'bg-brand-600 text-white hover:bg-brand-700' : (i.red ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-100'))}"><i data-lucide="${i.i}" class="w-4 h-4"></i> ${i.l}</button>`;
    
    if(nav) nav.innerHTML = items.map(i => render(i)).join('');
    if(mob) mob.innerHTML = items.map(i => render(i)).join('');
    
    lucide.createIcons();
}

function toggleMobileMenu() { 
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden'); 
}

function renderProfile() {
    if (state.user) {
        document.getElementById('profile-name-input').value = state.user.name;
        document.getElementById('profile-email-input').value = state.user.email;
        document.getElementById('profile-display-name').innerText = state.user.name;
        document.getElementById('profile-display-email').innerText = state.user.email;
        
        const initials = state.user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        document.getElementById('profile-avatar').innerText = initials;
        document.getElementById('profile-role-badge').innerText = state.user.role.toUpperCase();
        document.getElementById('profile-stats-events').innerText = state.enrollments.length || '0'; 
    }
}

async function updateProfile(e) {
    e.preventDefault();
    alert('Funcionalidade de atualizar perfil ainda não conectada ao banco.');
}
async function renderAdminStatsOverview() {
    // 1. Atualiza a lista de eventos na memória
    await fetchEvents();

    // 2. Busca os números dos cards (Eventos, Check-ins, Usuários)
    try {
        const res = await fetch('api_dashboard_stats.php');
        const data = await res.json();
        
        if (data.success) {
            // Verifica se os elementos existem antes de preencher
            const elEv = document.getElementById('adm-stat-ev');
            const elCk = document.getElementById('adm-stat-ck');
            const elUs = document.getElementById('adm-stat-us');
            
            if(elEv) elEv.innerText = data.events;
            if(elCk) elCk.innerText = data.checkins;
            if(elUs) elUs.innerText = data.users;
        }
    } catch (err) {
        console.warn("Não foi possível carregar as estatísticas do painel.");
    }

    // 3. Desenha a lista de eventos recentes
    const list = document.getElementById('admin-events-list');
    if (!list) return; // Proteção se o HTML não existir

    if (!state.events || state.events.length === 0) {
        list.innerHTML = '<div class="text-center py-8 text-gray-400">Nenhum evento encontrado.</div>';
        return;
    }

    list.innerHTML = state.events.slice(0, 10).map(e => `
        <div class="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden hidden sm:block flex-shrink-0">
                    <img src="${e.image_url || 'https://via.placeholder.com/150'}" 
                         onerror="this.style.display='none'" 
                         class="w-full h-full object-cover">
                </div>
                
                <div class="min-w-0">
                    <h4 class="font-bold text-gray-800 truncate">${e.name}</h4>
                    <p class="text-xs text-gray-500 flex items-center gap-1">
                        ${new Date(e.date).toLocaleDateString()} • 
                        <span class="font-bold text-brand-600">${e.enrolled_count || 0} inscritos</span>
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
                <button onclick="viewEventAttendees(${e.id}, '${e.name}')" title="Ver Inscritos" class="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
                    <i data-lucide="users" class="w-4 h-4"></i> Ver Lista
                </button>
                
                <button onclick="editEvent(${e.id})" title="Editar" class="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>

                <button onclick="deleteEvent(${e.id})" title="Excluir" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Recarrega os ícones do Lucide
    lucide.createIcons();
}

function previewImage(input) {
    const ui = document.getElementById('upload-ui');
    const img = document.getElementById('image-preview');
    const nameDisplay = document.getElementById('file-name-display');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result; img.classList.remove('hidden'); ui.classList.add('opacity-0');
        }
        reader.readAsDataURL(input.files[0]);
        if(nameDisplay) { nameDisplay.innerText = "Arquivo: " + input.files[0].name; nameDisplay.classList.remove('hidden'); }
    } else {
        img.src = ""; img.classList.add('hidden'); ui.classList.remove('opacity-0');
        if(nameDisplay) nameDisplay.classList.add('hidden');
    }
}

function editEvent(eventId) {
    const event = state.events.find(e => e.id == eventId);
    if(!event) return;
    navigateTo('admin-event-form');
    
    document.getElementById('evt-name').value = event.name;
    document.getElementById('evt-desc').value = event.description;
    const d = new Date(event.date);
    document.getElementById('evt-date').value = d.toISOString().split('T')[0];
    document.getElementById('evt-time').value = d.toTimeString().substring(0,5);
    document.getElementById('evt-loc').value = event.location;
    document.getElementById('evt-price').value = event.price;
    document.getElementById('evt-cap').value = event.capacity || '';
    if(document.getElementById('evt-days')) document.getElementById('evt-days').value = event.required_checkins || 1;

    const ui = document.getElementById('upload-ui');
    const img = document.getElementById('image-preview');
    if (event.image_url && event.image_url.trim() !== "") {
        img.src = event.image_url; img.classList.remove('hidden'); ui.classList.add('opacity-0');
    } else {
        img.src = ""; img.classList.add('hidden'); ui.classList.remove('opacity-0');
    }

    currentEditId = eventId;
    const btn = document.querySelector('#page-admin-event-form form button');
    if(btn) { btn.innerText = "Salvar Alterações"; btn.className = "w-full bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-yellow-700 transition-all"; }
}

function cancelEventForm() {
    currentEditId = null;
    const form = document.querySelector('#page-admin-event-form form');
    if(form) form.reset();

    const ui = document.getElementById('upload-ui');
    const img = document.getElementById('image-preview');
    img.src = ""; img.classList.add('hidden'); ui.classList.remove('opacity-0');

    const btn = document.querySelector('#page-admin-event-form form button');
    if(btn) { btn.innerText = "Publicar Evento"; btn.className = "w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 transition-all"; btn.disabled = false; }
    navigateTo('admin-dashboard');
}

async function handleEventSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('name', document.getElementById('evt-name').value);
    formData.append('description', document.getElementById('evt-desc').value);
    formData.append('date', document.getElementById('evt-date').value);
    formData.append('time', document.getElementById('evt-time').value);
    formData.append('location', document.getElementById('evt-loc').value);
    formData.append('price', document.getElementById('evt-price').value);
    formData.append('capacity', document.getElementById('evt-cap').value);
    formData.append('required_checkins', document.getElementById('evt-days') ? document.getElementById('evt-days').value : 1);

    const fileInput = document.getElementById('evt-img-file');
    if (fileInput && fileInput.files[0]) formData.append('image', fileInput.files[0]);

    try {
        let url = 'api_create_event.php';
        if (currentEditId) {
            url = 'api_update_event.php';
            formData.append('id', currentEditId);
        }

        const res = await fetch(url, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            alert(currentEditId ? "✅ Atualizado!" : "✅ Criado!");
            e.target.reset();
            cancelEventForm(); 
            await fetchEvents();
        } else {
            alert("Erro: " + data.message);
        }
    } catch (err) {
        alert("Erro de conexão.");
    } finally {
        if (!currentEditId) { btn.innerText = originalText; btn.disabled = false; }
    }
}

async function deleteEvent(eventId) {
    if (!confirm("⚠️ Excluir evento?")) return;
    try {
        const res = await fetch('api_delete_event.php', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: eventId })
        });
        const data = await res.json();
        if(data.success) { alert("Excluído!"); await fetchEvents(); renderAdminStatsOverview(); }
    } catch(e) { alert("Erro ao excluir."); }
}

async function viewEventAttendees(eventId, eventName) {
    navigateTo('admin-attendees');
    document.getElementById('attendees-event-title').innerText = eventName;
    const tbody = document.getElementById('attendees-list-body');
    tbody.innerHTML = '<tr><td colspan="4" class="p-12 text-center"><div class="flex justify-center"><i data-lucide="loader-2" class="animate-spin text-brand-600 w-8 h-8"></i></div></td></tr>';
    lucide.createIcons();

    try {
        const res = await fetch(`api_attendees.php?event_id=${eventId}`);
        const attendees = await res.json();
        document.getElementById('attendees-count').innerText = attendees.length;

        if(attendees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-12 text-center text-gray-400 italic bg-gray-50 rounded-lg">Nenhum inscrito neste evento ainda.</td></tr>';
            return;
        }

        tbody.innerHTML = attendees.map(u => {
            const checkins = parseInt(u.checkin_count);
            const required = parseInt(u.required_checkins) || 1;
            const pct = Math.min(100, Math.floor((checkins/required)*100));
            
            const isPending = u.payment_status === 'pending';
            const statusBadge = isPending 
                ? '<span class="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded border border-yellow-200">Pendente</span>' 
                : '<span class="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded border border-green-200">Pago</span>';

            let barColor = pct >= 75 ? 'bg-green-500' : 'bg-yellow-400';
            let textColor = pct >= 75 ? 'text-green-600' : 'text-gray-500';
            const certButton = isPending 
                ? `<span class="text-xs text-gray-400 italic">Aguardando Pgto</span>`
                : `<button onclick="adminOpenCert(${u.user_id}, ${eventId}, '${u.name}')" class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-white hover:shadow-sm transition-all bg-gray-50 group"><i data-lucide="award" class="w-4 h-4 text-gray-400 group-hover:text-brand-600"></i><span class="text-xs font-bold text-gray-500 group-hover:text-brand-700">Certificado</span></button>`;

            return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 ${isPending ? 'bg-yellow-50/30' : ''}">
                <td class="p-4 align-middle">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold border border-brand-200 uppercase">${u.name.charAt(0)}</div>
                        <div class="flex flex-col"><span class="font-bold text-gray-900 text-sm flex items-center gap-2">${u.name} ${statusBadge}</span><span class="text-xs text-gray-500">${u.email}</span></div>
                    </div>
                </td>
                <td class="p-4 align-middle">
                    <div class="w-full max-w-[160px]">
                        <div class="flex justify-between text-xs mb-1 font-bold"><span class="${textColor}">${pct}%</span><span class="text-gray-400 font-normal">${checkins}/${required} aulas</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner"><div class="${barColor} h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div></div>
                    </div>
                </td>
                <td class="p-4 align-middle text-sm"><div class="text-gray-600 font-medium">${new Date(u.enrolled_at).toLocaleDateString()}</div><div class="text-xs text-gray-400">${new Date(u.enrolled_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></td>
                <td class="p-4 align-middle text-right">${certButton}</td>
            </tr>`;
        }).join('');
        lucide.createIcons();
    } catch(e) { tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-red-500">Erro ao carregar lista.</td></tr>'; }
}
async function loadAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = '<tr><td colspan="4" class="p-6 text-center"><i data-lucide="loader-2" class="animate-spin mx-auto text-brand-600"></i></td></tr>';
    lucide.createIcons();

    try {
        const res = await fetch('api_users.php');
        if(res.ok) {
            state.usersList = await res.json();
            
            renderUsersTable(state.usersList);
        } else {
            throw new Error("Falha na API Users");
        }
    } catch(e) {
        list.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-red-500">Erro ao carregar usuários.</td></tr>';
    }
}

function renderUsersTable(users) {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = users.map(u => `
        <tr class="hover:bg-gray-50 border-b border-gray-100">
            <td class="p-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm uppercase">${u.name.charAt(0)}</div><div class="font-bold text-gray-900">${u.name}</div></div></td>
            <td class="p-4 text-gray-600">${u.email}</td>
            <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold ${u.role==='admin'?'bg-purple-100 text-purple-700':(u.role==='servidor'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700')}">${u.role.toUpperCase()}</span></td>
            <td class="p-4 text-right flex items-center justify-end gap-2">
                ${state.user.email === u.email ? '<span class="text-xs text-gray-400 italic">Você</span>' : 
                `<select onchange="changeUserRole(${u.id}, this.value)" class="border rounded text-xs p-1 outline-none">
                    <option value="user" ${u.role==='user'?'selected':''}>Usuário</option>
                    <option value="servidor" ${u.role==='servidor'?'selected':''}>Servidor</option>
                    <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                 </select>
                 <button onclick="deleteUser(${u.id})" title="Excluir Usuário" class="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`}
            </td>
        </tr>`).join('');
    lucide.createIcons();
}

async function changeUserRole(userId, newRole) {
    if(!confirm(`Mudar para ${newRole.toUpperCase()}?`)) { loadAdminUsers(); return; }
    try {
        const res = await fetch('api_user_role.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({user_id: userId, new_role: newRole})});
        if((await res.json()).success) { alert("Alterado!"); loadAdminUsers(); }
    } catch(e) { alert("Erro."); }
}

async function deleteUser(userId) {
    if(!confirm("⚠️ Tem certeza que deseja excluir este usuário?\nIsso apagará todas as inscrições dele.")) return;
    try {
        const res = await fetch('api_delete_user.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: userId})});
        const data = await res.json();
        if(data.success) { alert("Usuário excluído!"); loadAdminUsers(); } else { alert(data.message); }
    } catch(e) { alert("Erro ao excluir."); }
}

function filterUsersTable(text) {
    const filtered = state.usersList.filter(u => u.name.toLowerCase().includes(text.toLowerCase()) || u.email.toLowerCase().includes(text.toLowerCase()));
    renderUsersTable(filtered);
}

function filterEvents(val, gridId) {
    const filtered = state.events.filter(e => e.name.toLowerCase().includes(val.toLowerCase()));
    renderCards(filtered, gridId);
}
function renderCards(evs, id) {
    const c = document.getElementById(id);
    if(!c) return;
    const fallback = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';

    c.innerHTML = evs.length ? evs.map(e => {
        // Lógica das Estrelas
        const rating = parseFloat(e.avg_rating || 0);
        const starIcon = rating > 0 ? '⭐ ' + rating.toFixed(1) : 'Novo';
        const starClass = rating > 0 ? 'text-yellow-500 bg-yellow-50' : 'text-blue-500 bg-blue-50';

        return `
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden flex flex-col h-full relative">
            <div class="h-48 bg-gray-200 relative overflow-hidden">
                <img src="${e.image_url || fallback}" onerror="this.src='${fallback}'" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                <div class="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded text-xs font-bold">${new Date(e.date).toLocaleDateString()}</div>
                
                <div class="absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-bold ${starClass} shadow-sm border border-white/50">
                    ${starIcon}
                </div>
            </div>
            <div class="p-6 flex flex-col flex-1">
                <h3 class="font-bold text-lg mb-2">${e.name}</h3>
                <p class="text-sm text-gray-500 mb-4 line-clamp-2">${e.description}</p>
                <div class="mt-auto flex justify-between items-center pt-4 border-t">
                    <span class="font-bold text-brand-600">${parseFloat(e.price)>0 ? 'R$ '+e.price : 'Grátis'}</span>
                    <button onclick="openEventModal(${e.id})" class="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Ver Detalhes</button>
                </div>
            </div>
        </div>
    `;}).join('') : '<p class="col-span-full text-center text-gray-400 py-10">Sem eventos.</p>';
}
async function loadMyEvents() {
    const grid = document.getElementById('dashboard-grid');
    
    if(!state.enrollments.length) { 
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center">
                <div class="bg-gray-50 p-4 rounded-full mb-4"><i data-lucide="ticket" class="w-12 h-12 text-gray-400"></i></div>
                <h3 class="text-xl font-bold text-gray-900 mb-1">Sem ingressos</h3>
                <p class="text-gray-500 mb-6">Inscreva-se em eventos para vê-los aqui.</p>
                <button onclick="navigateTo('public-events')" class="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors">Explorar</button>
            </div>`; 
        lucide.createIcons();
        return; 
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800';

    grid.innerHTML = state.enrollments.map(e => {
        const dateObj = new Date(e.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
        
        // 1. Verifica Status
        const isPending = e.payment_status === 'pending';
        // 2. Verifica se o evento JÁ PASSOU (Data atual > Data do evento)
        const isPast = new Date() > new Date(e.date);

        // Badge Visual
        const statusHtml = isPending 
            ? '<span class="text-yellow-700 bg-yellow-100 px-2 py-1 rounded-lg text-xs font-bold border border-yellow-200 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> Pendente</span>' 
            : (isPast 
                ? '<span class="text-gray-700 bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3 h-3"></i> Concluído</span>'
                : '<span class="text-green-700 bg-green-100 px-2 py-1 rounded-lg text-xs font-bold border border-green-200 flex items-center gap-1"><i data-lucide="calendar-check" class="w-3 h-3"></i> Confirmado</span>');

        // Lógica dos Botões
        let buttonsHtml = '';

        if (isPending) {
            // CENÁRIO 1: Falta Pagar
            buttonsHtml = `
                <button onclick="initPixPayment(${e.id})" class="flex-1 py-2.5 bg-yellow-500 text-white rounded-xl font-bold shadow-lg shadow-yellow-200 hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"><i data-lucide="qr-code" class="w-4 h-4"></i> Pagar</button>
                <button onclick="cancelEnrollment(${e.id})" class="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-100"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            `;
        } else if (isPast) {
            // CENÁRIO 2: Evento já passou (Avaliar + Certificado)
            buttonsHtml = `
                <button onclick="openReviewModal(${e.id})" class="flex-1 py-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold hover:bg-blue-100 flex items-center justify-center gap-2"><i data-lucide="star" class="w-4 h-4"></i> Avaliar</button>
                <button onclick="openCert('${e.name}', '${e.date}', ${e.id})" class="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 border border-amber-200"><i data-lucide="award" class="w-5 h-5"></i></button>
            `;
        } else {
            // CENÁRIO 3: Evento Futuro Confirmado (Apenas Cancelar ou Ver)
            buttonsHtml = `
                <button disabled class="flex-1 py-2.5 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"><i data-lucide="calendar-clock" class="w-4 h-4"></i> Em breve</button>
                <button onclick="cancelEnrollment(${e.id})" class="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-100"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            `;
        }

        return `
        <div class="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border ${isPending ? 'border-yellow-300 ring-2 ring-yellow-50' : 'border-gray-100'} overflow-hidden flex flex-col h-full relative">
            <div class="h-40 bg-gray-200 relative">
                <img src="${e.image_url || fallbackImage}" onerror="this.src='${fallbackImage}'" class="w-full h-full object-cover ${isPending || isPast ? 'grayscale opacity-80' : ''}">
                <div class="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-xl p-2 text-center shadow-lg min-w-[60px]">
                    <span class="block text-sm font-bold text-gray-500 uppercase tracking-wider">${month}</span>
                    <span class="block text-2xl font-extrabold text-gray-900 leading-none">${day}</span>
                </div>
                <div class="absolute bottom-3 left-3">${statusHtml}</div>
            </div>
            <div class="p-5 flex flex-col flex-1">
                <h3 class="font-bold text-lg mb-1 text-gray-900 line-clamp-1">${e.name}</h3>
                <div class="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <i data-lucide="map-pin" class="w-4 h-4 text-brand-500"></i>
                    <span class="truncate">${e.location || 'Online'}</span>
                </div>
                <div class="mt-auto pt-4 border-t border-gray-100 flex gap-2">${buttonsHtml}</div>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function openEventModal(eventId) {
    const event = state.events.find(e => e.id == eventId);
    if(!event) return;

    document.getElementById('modal-evt-title').innerText = event.name;
    document.getElementById('modal-evt-desc').innerText = event.description;
    document.getElementById('modal-evt-date').innerText = new Date(event.date).toLocaleDateString();
    document.getElementById('modal-evt-img').src = event.image_url || 'https://via.placeholder.com/800x400';
    document.getElementById('modal-evt-price').innerText = parseFloat(event.price) > 0 ? `R$ ${event.price}` : "Grátis";
    
    const enrolled = event.enrolled_count || 0;
    document.getElementById('modal-evt-capacity').innerText = `${enrolled} inscritos`;
    document.getElementById('modal-evt-count-badge').innerText = enrolled;

    const btn = document.getElementById('btn-register-action');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    const role = state.user ? state.user.role : null;
    const isStaff = role === 'admin' || role === 'servidor';
    const isEnrolled = state.enrollments.some(en => en.id == eventId);

    if (isStaff) {
        newBtn.className = "w-full bg-gray-300 text-gray-500 py-3 rounded font-bold cursor-not-allowed";
        newBtn.innerHTML = 'Modo Visualização';
        newBtn.onclick = () => alert("Admin/Servidor não podem se inscrever.");
    } else if (isEnrolled) {
        newBtn.className = "w-full bg-green-100 text-green-700 py-3 rounded font-bold";
        newBtn.innerHTML = 'Já Inscrito';
    } else {
        newBtn.className = "w-full bg-purple-700 text-white py-3 rounded font-bold hover:bg-purple-800";
        newBtn.innerHTML = 'Inscrever-se';
        newBtn.onclick = () => { closeEventModal(); enroll(eventId); };
    }

    document.getElementById('event-details-modal').classList.remove('hidden');
    document.getElementById('event-details-modal').classList.add('flex');
}

function closeEventModal() {
    document.getElementById('event-details-modal').classList.add('hidden');
    document.getElementById('event-details-modal').classList.remove('flex');
}

async function enroll(eventId) {
    if (!state.user) return navigateTo('login');
    
    const event = state.events.find(e => e.id == eventId);
    if (event && parseFloat(event.price) > 0) {
        closeEventModal();
        initPixPayment(eventId);
        return;
    }

    const btn = document.getElementById('btn-register-action');
    if(btn) btn.innerText = "Processando...";

    try {
        const res = await fetch('api_enroll.php', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: state.user.id, event_id: eventId })
        });
        const data = await res.json();

        if(data.success) {
            alert('✅ Inscrição realizada!');
            state.enrollments.push(event);
            navigateTo('dashboard');
        } else { alert(data.message); }
    } catch(err) { alert('Erro de conexão.'); }
}

async function cancelEnrollment(eventId) {
    if(!confirm("Cancelar inscrição?")) return;
    try {
        const res = await fetch('api_cancel_enrollment.php', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ user_id: state.user.id, event_id: eventId })
        });
        if((await res.json()).success) { alert("Cancelado!"); await fetchUserEnrollments(); loadMyEvents(); }
    } catch(e) { alert("Erro."); }
}

function initPixPayment(eventId) {
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const event = state.events.find(e => e.id == eventId);
    document.getElementById('pix-amount').innerText = `R$ ${event.price}`;
    document.getElementById('pix-loader').classList.remove('hidden');

    fetch('api_pix_create.php', {
         method: 'POST', body: JSON.stringify({ user_id: state.user.id, event_id: eventId })
    })
    .then(r => r.json())
    .then(d => {
        document.getElementById('pix-loader').classList.add('hidden');
        if(d.success) {
             document.getElementById('pix-qr-img').src = "data:image/png;base64," + d.qr_img;
             document.getElementById('pix-code-text').value = d.qr_code;
             if(state.paymentTimer) clearInterval(state.paymentTimer);
             state.paymentTimer = setInterval(() => checkPaymentStatus(d.payment_id), 5000);
        } else {
             alert("Erro Pix: " + d.message);
             closePaymentModal();
        }
    })
    .catch(err => {
        alert("Erro de conexão com Mercado Pago.");
        closePaymentModal();
    });
}

async function checkPaymentStatus(pid) {
    try {
        const res = await fetch(`api_check_status.php?payment_id=${pid}`);
        if((await res.json()).status === 'approved') {
            clearInterval(state.paymentTimer);
            document.getElementById('payment-content').classList.add('hidden');
            document.getElementById('payment-success').classList.remove('hidden');
            document.getElementById('payment-success').classList.add('flex');
            await fetchUserEnrollments();
        }
    } catch(e) {}
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    document.getElementById('payment-modal').classList.remove('flex');
    document.getElementById('payment-content').classList.remove('hidden');
    document.getElementById('payment-success').classList.add('hidden');
    document.getElementById('payment-success').classList.remove('flex');
    if(state.paymentTimer) clearInterval(state.paymentTimer);
}

function copyPixCode() {
    navigator.clipboard.writeText(document.getElementById("pix-code-text").value);
    alert("Copiado!");
}

async function adminOpenCert(userId, eventId, userName) {
    if(!confirm(`Gerar certificado de ${userName}?`)) return;
    try {
        const res = await fetch(`api_certificate.php?user_id=${userId}&event_id=${eventId}`);
        const result = await res.json();
        if (result.success) openCertModalData(result.data, userName);
        else alert(`⚠️ Certificado Indisponível.\n\nMotivo: ${result.message}\nPresença: ${result.percentage}%`);
    } catch(e) { alert("Erro."); }
}

async function openCert(eventName, eventDate, eventId) {
    try {
        const res = await fetch(`api_certificate.php?user_id=${state.user.id}&event_id=${eventId}`);
        const result = await res.json();
        if (result.success) openCertModalData(result.data, state.user.name);
        else alert(`🚫 BLOQUEADO\n\nSua presença: ${result.percentage}%\nMínimo exigido: 75%\n\n${result.debug_info}`);
    } catch(e) { alert("Erro."); }
}

function openCertModalData(data, userName) {
    document.getElementById('cert-name').innerText = userName;
    document.getElementById('cert-event').innerText = data.event_name;
    document.getElementById('cert-date').innerText = data.event_date;
    document.getElementById('cert-hash').innerText = data.code;
    const qrBox = document.getElementById('cert-qr-code');
    qrBox.innerHTML = "";
    new QRCode(qrBox, { text: "VALIDADO:" + data.code, width: 80, height: 80 });
    document.getElementById('cert-modal').classList.remove('hidden');
    document.getElementById('cert-modal').classList.add('flex');
}

function closeCert() { 
    document.getElementById('cert-modal').classList.add('hidden'); 
    document.getElementById('cert-modal').classList.remove('flex'); 
}

function initAdminQR() {
    const sel = document.getElementById('qr-sel');
    if(sel) sel.innerHTML = '<option>Selecione...</option>' + state.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

let qrInterval = null;
function startQR() { 
    const eid = document.getElementById('qr-sel').value; 
    if(!eid) return alert("Escolha um evento");
    if(qrInterval) clearInterval(qrInterval);

    const generate = async () => {
        try {
            const res = await fetch('api_refresh_qr.php', { method: 'POST', body: JSON.stringify({ event_id: eid }) });
            const data = await res.json();
            if(data.success) {
                document.getElementById('qr-view').innerHTML = ''; 
                new QRCode(document.getElementById('qr-view'), { text: JSON.stringify({ eid: eid, t: data.token }), width: 256, height: 256 });
            }
        } catch(e) {}
    };
    generate();
    qrInterval = setInterval(generate, 30000);
}

async function onScan(decodedText) {
    stopScanner();
    document.getElementById('scan-result').classList.remove('hidden');
    document.getElementById('scan-result').innerHTML = 'Validando...';

    try {
        const qrData = JSON.parse(decodedText); 
        const res = await fetch('api_checkin.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.user.id, event_id: qrData.eid, token: qrData.t })
        });
        const data = await res.json();
        document.getElementById('scan-result').innerHTML = data.success ? "✅ " + data.message : "❌ " + data.message;
    } catch (err) { document.getElementById('scan-result').innerHTML = "❌ QR Inválido"; }
}

function startScanner() { 
    document.getElementById('scanner-camera-view').classList.remove('hidden'); 
    document.getElementById('scanner-start-view').classList.add('hidden'); 
    state.scanner = new Html5Qrcode("reader"); 
    state.scanner.start({facingMode:"environment"}, {fps:10}, onScan);
}

function stopScanner() { 
    if(state.scanner) {
        state.scanner.stop().then(() => { 
            state.scanner.clear(); 
            document.getElementById('scanner-camera-view').classList.add('hidden'); 
            document.getElementById('scanner-start-view').classList.remove('hidden'); 
            state.scanner = null;
        });
    }
}

function initStatsPage() {
    const sel = document.getElementById('stats-event-select');
    if(sel) sel.innerHTML = '<option>Selecione...</option>' + state.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

async function loadEventStats(eventId) {
    if(!eventId) return;
    const container = document.getElementById('stats-details-container');
    const totalEl = document.getElementById('stats-total-count');
    container.innerHTML = '<div class="flex justify-center py-10"><i data-lucide="loader-2" class="animate-spin"></i></div>';
    lucide.createIcons();

    try {
        const res = await fetch(`api_event_stats.php?event_id=${eventId}`);
        const data = await res.json();
        totalEl.innerText = data.total || 0;

        if (!data.history || data.history.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">Sem dados.</p>'; return;
        }

        const maxCount = Math.max(...data.history.map(d => parseInt(d.count)));
        let html = '<div class="space-y-4">';
        data.history.forEach(day => {
            const dateStr = day.date.split('-').reverse().slice(0,2).join('/');
            const pct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            html += `<div><div class="flex justify-between text-sm mb-1"><span>${dateStr}</span><span>${day.count}</span></div><div class="w-full bg-gray-100 h-2 rounded-full"><div class="bg-brand-600 h-2 rounded-full" style="width: ${pct}%"></div></div></div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch(e) { container.innerHTML = 'Erro.'; }
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function filterUsersTable(text) {
    if (!state.usersList || state.usersList.length === 0) return;

    const term = text.toLowerCase();

    const filtered = state.usersList.filter(u => 
        u.name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
    );

    renderUsersTable(filtered);
}
// --- SISTEMA DE AVALIAÇÃO ---
let currentReviewEventId = null;
let currentRating = 0;

function openReviewModal(eventId) {
    currentReviewEventId = eventId;
    currentRating = 0;
    document.getElementById('review-comment').value = '';
    updateStarsUI(); // Reseta estrelas
    
    const modal = document.getElementById('review-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeReviewModal() {
    document.getElementById('review-modal').classList.add('hidden');
    document.getElementById('review-modal').classList.remove('flex');
}

function setRating(n) {
    currentRating = n;
    updateStarsUI();
}

function updateStarsUI() {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach((btn, index) => {
        if (index < currentRating) {
            btn.classList.remove('text-gray-300');
            btn.classList.add('text-yellow-400');
        } else {
            btn.classList.add('text-gray-300');
            btn.classList.remove('text-yellow-400');
        }
    });
}

async function submitReview() {
    if (currentRating === 0) return alert("Por favor, selecione pelo menos 1 estrela.");

    const comment = document.getElementById('review-comment').value;
    
    try {
        const res = await fetch('api_add_review.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: state.user.id,
                event_id: currentReviewEventId,
                rating: currentRating,
                comment: comment
            })
        });
        
        const data = await res.json();
        if (data.success) {
            alert("Obrigado pela avaliação!");
            closeReviewModal();
        } else {
            alert(data.message);
        }
    } catch(e) { alert("Erro de conexão."); }
}
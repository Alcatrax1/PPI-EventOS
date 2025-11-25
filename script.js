const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    events: [],
    enrollments: [],
    paymentTimer: null,
    scanner: null,
    usersList: []
};

let currentEditId = null;
window.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();

    await fetchEvents();

    if (state.user) {
        await fetchUserEnrollments(); 
 
        const startPage = state.user.role === 'admin' ? 'admin-dashboard' : 'dashboard';
        navigateTo(startPage);
    } else {
        navigateTo('home');
    }
});
async function fetchUserEnrollments() {
    if (!state.user) return;

    try {
        const res = await fetch(`api_my_events.php?user_id=${state.user.id}`);
        const data = await res.json();

        state.enrollments = Array.isArray(data) ? data : [];

        console.log("Inscrições recuperadas:", state.enrollments);
    } catch (err) {
        console.error("Erro ao buscar inscrições:", err);
        state.enrollments = [];
    }
}
async function fetchEvents() {
    try {
        const res = await fetch('api_eventos.php');
        const data = await res.json();
        state.events = Array.isArray(data) ? data : [];
    } catch (err) {
        state.events = [];
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('input-email').value;
    const password = document.getElementById('input-password').value;
    const nameField = document.getElementById('field-name');
    const isRegister = !nameField.classList.contains('hidden');
    const url = isRegister ? 'api_register.php' : 'api_login.php';

    const btn = document.getElementById('auth-btn-text');
    const originalText = btn.innerText;
    btn.innerText = "Processando...";

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name: isRegister ? document.getElementById('auth-input-name').value : ''
            })
        });

        const data = await res.json();

        if (data.success) {
            loginSuccess(data.user);
        } else {
            alert(data.message || "Erro ao logar");
        }
    } catch (err) {
        alert("Erro de conexão com o servidor.");
    } finally {
        btn.innerText = originalText;
    }
}

function loginSuccess(user) {
    state.user = user;
    localStorage.setItem('user', JSON.stringify(state.user));
    navigateTo(state.user.role === 'admin' ? 'admin-dashboard' : 'home');
}

function logout() {
    localStorage.removeItem('user');
    state.user = null;
    state.enrollments = [];
    navigateTo('home');
}

function navigateTo(pageId) {
    if ((['dashboard', 'profile', 'user-scanner'].includes(pageId)) && !state.user) return navigateTo('login');
    if (pageId.startsWith('admin') && state.user?.role !== 'admin') return navigateTo('home');

    stopScanner();

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

    if (pageId === 'home') renderCards(state.events.slice(0, 3), 'home-events-grid');
    if (pageId === 'public-events') renderCards(state.events, 'public-events-grid');
    if (pageId === 'dashboard') loadMyEvents();
    if (pageId === 'profile') renderProfile();
    if (pageId === 'admin-dashboard') renderAdminStatsOverview();
    if (pageId === 'admin-users') loadAdminUsers();
    if (pageId === 'admin-qrcode') initAdminQR();
    if (pageId === 'admin-stats') initStatsPage();

    lucide.createIcons();
}

function updateNavbar(currPage) {
    const nav = document.getElementById('nav-items-desktop');
    const mob = document.getElementById('mobile-menu');
    let items = [{ id: 'public-events', l: 'Eventos', a: "navigateTo('public-events')", i: 'globe' }];

    if (state.user) {
        if (state.user.role === 'admin') {
            items.push({ id: 'admin-dashboard', l: 'Painel Admin', a: "navigateTo('admin-dashboard')", i: 'layout-dashboard' });
        } else {
            items.push({ id: 'dashboard', l: 'Meus Ingressos', a: "navigateTo('dashboard')", i: 'ticket' });
            items.push({ id: 'user-scanner', l: 'Scanner', a: "navigateTo('user-scanner')", i: 'scan' });
        }
        items.push({ id: 'profile', l: 'Perfil', a: "navigateTo('profile')", i: 'user' });
        items.push({ id: 'logout', l: 'Sair', a: "logout()", i: 'log-out', red: true });
    } else {
        items.push({ id: 'login', l: 'Entrar', a: "navigateTo('login')", i: 'log-in', pri: true });
    }

    const render = (i) => {
        const active = currPage === i.id ? 'nav-btn-active' : '';
        const style = i.pri ? 'bg-brand-600 text-white hover:bg-brand-700' : i.red ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-100';
        return `<button onclick="${i.a}" class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${style} ${active}">
            <i data-lucide="${i.i}" class="w-4 h-4"></i> ${i.l}
        </button>`;
    };

    if (nav) nav.innerHTML = items.map(i => render(i)).join('');
    if (mob) mob.innerHTML = items.map(i => render(i)).join('');
}

function toggleAuth(isLogin) {
    document.getElementById('field-name').classList.toggle('hidden', isLogin);
    document.getElementById('auth-input-name').required = !isLogin;
    document.getElementById('auth-btn-text').innerText = isLogin ? 'Entrar' : 'Criar Conta';
    document.getElementById('tab-login').className = isLogin ? "flex-1 py-2.5 rounded-lg bg-white shadow text-sm font-bold text-gray-900 transition-all" : "flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-bold transition-all";
    document.getElementById('tab-register').className = !isLogin ? "flex-1 py-2.5 rounded-lg bg-white shadow text-sm font-bold text-gray-900 transition-all" : "flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-bold transition-all";
}

function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

function renderProfile() {
    if (state.user) {
        document.getElementById('profile-name-input').value = state.user.name;
        document.getElementById('profile-email-input').value = state.user.email;
        document.getElementById('profile-display-name').innerText = state.user.name;
        document.getElementById('profile-display-email').innerText = state.user.email;

        const initials = state.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('profile-avatar').innerText = initials;

        const badge = document.getElementById('profile-role-badge');
        badge.innerText = state.user.role === 'admin' ? 'ADMINISTRADOR' : 'MEMBRO';

        document.getElementById('profile-stats-events').innerText = state.enrollments.length || '0';
    }
}


async function renderAdminStatsOverview() {
    await fetchEvents(); 

    try {
        const res = await fetch('api_dashboard_stats.php');
        const data = await res.json();
        if (data.success) {
            document.getElementById('adm-stat-ev').innerText = data.events;
            document.getElementById('adm-stat-ck').innerText = data.checkins;
            document.getElementById('adm-stat-us').innerText = data.users;
        }
    } catch (err) { console.error(err); }

    const list = document.getElementById('admin-events-list');

    if (state.events.length === 0) {
        list.innerHTML = '<p class="text-gray-400 text-center py-6">Nenhum evento criado.</p>';
        return;
    }

    list.innerHTML = state.events.slice(0, 10).map(e => `
        <div class="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden hidden sm:block">
                    <img src="${e.image_url || ''}" onerror="this.style.display='none'" class="w-full h-full object-cover">
                </div>
                <div>
                    <h4 class="font-bold text-gray-800">${e.name}</h4>
                    <p class="text-xs text-gray-500">
                        ${new Date(e.date).toLocaleDateString()} • 
                        <span class="font-bold text-brand-600">${e.enrolled_count || 0} inscritos</span>
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <button onclick="viewEventAttendees(${e.id}, '${e.name}')" title="Ver Inscritos" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    <i data-lucide="users" class="w-4 h-4"></i>
                </button>
                
                <button onclick="navigateTo('admin-qrcode'); setTimeout(()=>{document.getElementById('qr-sel').value='${e.id}'}, 100)" title="Gerar QR" class="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                    <i data-lucide="qr-code" class="w-4 h-4"></i>
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

    lucide.createIcons();
}

function editEvent(eventId) { 
    const event = state.events.find(e => e.id == eventId);
    if (!event) return;

    navigateTo('admin-event-form');

    document.getElementById('evt-name').value = event.name;
    document.getElementById('evt-desc').value = event.description;

    const dataHora = new Date(event.date);
    document.getElementById('evt-date').value = dataHora.toISOString().split('T')[0];
    document.getElementById('evt-time').value = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('evt-loc').value = event.location;
    document.getElementById('evt-price').value = event.price;

    if (document.getElementById('evt-days')) {
        document.getElementById('evt-days').value = event.required_checkins || 1;
    }

    currentEditId = eventId;

    const btn = document.querySelector('#page-admin-event-form form button');
    if (btn) {
        btn.innerText = "Salvar Alterações";
        btn.className = "w-full bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-yellow-700 transition-all";
    }
}

function cancelEventForm() {
    currentEditId = null;
    const form = document.querySelector('#page-admin-event-form form');
    if (form) form.reset();

    const btn = document.querySelector('#page-admin-event-form form button');
    if (btn) {
        btn.innerText = "Publicar Evento";
        btn.className = "w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 transition-all";
        btn.disabled = false;
    }

    navigateTo('admin-dashboard');
}


async function handleEventSubmit(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Processando...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('name', document.getElementById('evt-name').value);
    formData.append('description', document.getElementById('evt-desc').value);
    formData.append('date', document.getElementById('evt-date').value);
    formData.append('time', document.getElementById('evt-time').value);
    formData.append('location', document.getElementById('evt-loc').value);
    formData.append('price', document.getElementById('evt-price').value);

    const daysInput = document.getElementById('evt-days');
    formData.append('required_checkins', daysInput ? daysInput.value : 1);

    const fileInput = document.getElementById('evt-img-file');
    if (fileInput && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        let url = 'api_create_event.php';
        if (currentEditId) {
            url = 'api_update_event.php';
            formData.append('id', currentEditId);
        }

        const res = await fetch(url, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            alert(currentEditId ? "✅ Evento atualizado!" : "✅ Evento criado!");
            e.target.reset();
            cancelEventForm(); 
            await fetchEvents();
        } else {
            alert("Erro: " + data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Erro de conexão.");
    } finally {
        if (!currentEditId) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

async function deleteEvent(eventId) {
    if (!confirm("⚠️ Tem certeza que deseja EXCLUIR este evento?\n\nEssa ação é irreversível.")) return;

    try {
        const res = await fetch('api_delete_event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: eventId })
        });

        const data = await res.json();

        if (data.success) {
            alert("🗑️ Evento excluído!");
            await fetchEvents();
            renderAdminStatsOverview();
        } else {
            alert("Erro: " + data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Erro de conexão.");
    }
}
async function viewEventAttendees(eventId, eventName) {
    navigateTo('admin-attendees');
    document.getElementById('attendees-event-title').innerText = eventName;
    const tbody = document.getElementById('attendees-list-body');
    tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin mx-auto"></i></td></tr>';
    lucide.createIcons();

    try {
        const res = await fetch(`api_attendees.php?event_id=${eventId}`);
        const attendees = await res.json();
        document.getElementById('attendees-count').innerText = attendees.length;

        if(attendees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400">Nenhum inscrito.</td></tr>';
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

            let barColor = 'bg-gray-300';
            let textColor = 'text-gray-500';
            if(pct >= 75) { barColor = 'bg-green-500'; textColor = 'text-green-600'; }
            else if(pct > 0) { barColor = 'bg-yellow-400'; textColor = 'text-yellow-600'; }

            const certButton = isPending 
                ? `<span class="text-xs text-gray-400 italic mr-2">Aguardando Pagamento</span>`
                : `<button onclick="adminOpenCert(${u.user_id}, ${eventId}, '${u.name}')" class="px-3 py-1 border rounded text-xs font-bold hover:bg-gray-50 flex items-center gap-1 ml-auto">
                     <i data-lucide="award" class="w-3 h-3"></i> Certificado
                   </button>`;

            return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 ${isPending ? 'bg-yellow-50/30' : ''}">
                <td class="p-4 align-middle">
                    <span class="font-bold text-sm text-gray-900">${u.name}</span>
                    ${statusBadge}
                    <br><span class="text-xs text-gray-500">${u.email}</span>
                </td>
                <td class="p-4 align-middle">
                    <div class="w-full max-w-[140px]">
                        <div class="text-xs flex justify-between mb-1"><span class="${textColor}">${pct}%</span><span>${checkins}/${required}</span></div>
                        <div class="w-full bg-gray-100 h-2 rounded-full"><div class="${barColor} h-2 rounded-full" style="width:${pct}%"></div></div>
                    </div>
                </td>
                <td class="p-4 align-middle text-sm text-gray-500">${new Date(u.enrolled_at).toLocaleDateString()}</td>
                <td class="p-4 align-middle text-right">
                    ${certButton}
                </td>
            </tr>`;
        }).join('');
        
        lucide.createIcons();

    } catch(e) { tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-500">Erro na lista.</td></tr>'; }
}async function loadAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = '<tr><td colspan="4" class="p-6 text-center"><i data-lucide="loader-2" class="animate-spin mx-auto text-brand-600"></i></td></tr>';
    lucide.createIcons();

    try {
        const res = await fetch('api_users.php');
        if (res.ok) {
            state.usersList = await res.json();
            renderUsersTable(state.usersList);
        } else {
            throw new Error("Falha na API Users");
        }
    } catch (e) {
        list.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-red-500">Erro ao carregar usuários.</td></tr>';
    }
}

function renderUsersTable(users) {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = users.map(u => `
        <tr class="hover:bg-gray-50 border-b border-gray-100 transition-colors">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm text-gray-600 border border-gray-300">
                        ${u.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="font-bold text-gray-900">${u.name}</div>
                </div>
            </td>
            <td class="p-4 text-gray-600">${u.email}</td>
            <td class="p-4">
                <span class="px-3 py-1 text-xs font-bold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}">
                    ${u.role.toUpperCase()}
                </span>
            </td>
            <td class="p-4 text-right">
                ${state.user.email === u.email ?
            '<span class="text-xs text-gray-400 italic px-2">Você</span>' :
            `<select onchange="changeUserRole(${u.id}, this.value)" class="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg p-2 shadow-sm cursor-pointer outline-none">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuário</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>`
        }
            </td>
        </tr>`).join('');
    lucide.createIcons();
}

async function changeUserRole(userId, newRole) {
    if (!confirm(`Alterar permissão para ${newRole.toUpperCase()}?`)) {
        loadAdminUsers(); return;
    }
    try {
        const res = await fetch('api_user_role.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, new_role: newRole })
        });
        const data = await res.json();
        if (data.success) {
            alert("Permissão alterada!");
            loadAdminUsers();
        } else {
            alert("Erro: " + data.message);
        }
    } catch (err) {
        alert("Erro de conexão.");
    }
}


async function adminOpenCert(userId, eventId, userName) {
    if (!confirm(`Gerar certificado de ${userName}?`)) return;

    try {
        const res = await fetch(`api_certificate.php?user_id=${userId}&event_id=${eventId}`);
        const result = await res.json();

        if (result.success) {
            openCertModalData(result.data, userName);
        } else {
            alert(`⚠️ Certificado Indisponível.\n\nMotivo: ${result.message}\nPresença: ${result.percentage}%`);
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao buscar certificado.");
    }
}

async function openCert(eventName, eventDate, eventId) {
    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i> ...';

    try {
        const res = await fetch(`api_certificate.php?user_id=${state.user.id}&event_id=${eventId}`);
        const result = await res.json();

        if (result.success) {
            openCertModalData(result.data, state.user.name);
        } else {
            alert(`🚫 CERTIFICADO BLOQUEADO\n\nSua presença: ${result.percentage}%\nMínimo exigido: 75%\n\n${result.debug_info || 'Faça check-in no evento.'}`);
        }
    } catch (err) {
        alert("Erro de conexão.");
    } finally {
        btn.innerHTML = originalContent;
        lucide.createIcons();
    }
}

function openCertModalData(data, userName) {
    document.getElementById('cert-name').innerText = userName;
    document.getElementById('cert-event').innerText = data.event_name;
    document.getElementById('cert-date').innerText = data.event_date;
    document.getElementById('cert-loc').innerText = data.event_loc || "Online";
    document.getElementById('cert-hash').innerText = data.code;

    const qrBox = document.getElementById('cert-qr-code');
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
        text: "VALIDADO:" + data.code,
        width: 80, height: 80,
        colorDark: "#854d0e", colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    const modal = document.getElementById('cert-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCert() {
    document.getElementById('cert-modal').classList.add('hidden');
    document.getElementById('cert-modal').classList.remove('flex');
}


function renderCards(evs, id) {
    const c = document.getElementById(id);
    if (!c) return;

    const fallbackImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';

    c.innerHTML = evs.length ? evs.map(e => `
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 group h-full">
            <div class="h-48 overflow-hidden relative bg-gray-200">
                <img src="${e.image_url || fallbackImage}" 
                     alt="${e.name}"
                     onerror="this.onerror=null;this.src='${fallbackImage}';" 
                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow">
                    ${new Date(e.date).toLocaleDateString()}
                </div>
            </div>
            <div class="p-6 flex flex-col flex-1">
                <h3 class="font-bold text-xl mb-2 text-gray-900 line-clamp-1">${e.name}</h3>
                <p class="text-sm text-gray-500 mb-4 line-clamp-2">${e.description}</p>
                <div class="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                    <span class="text-lg font-bold text-brand-600">${parseFloat(e.price) > 0 ? 'R$ ' + e.price : 'Grátis'}</span>
                    <button onclick="openEventModal(${e.id})" class="bg-gray-900 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-brand-600 transition-colors">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        </div>`).join('') : `<p class="col-span-full text-center text-gray-400 py-10">Nenhum evento disponível.</p>`;
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

    const fallback = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800';

    grid.innerHTML = state.enrollments.map(e => {
        const isPending = e.payment_status === 'pending';
        const statusHtml = isPending 
            ? '<span class="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-bold">Pendente</span>' 
            : '<span class="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">Confirmado</span>';
            
        const buttonsHtml = isPending 
            ? `<button onclick="initPixPayment(${e.id})" class="flex-1 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600">Pagar</button>
               <button onclick="cancelEnrollment(${e.id})" class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`
            : `<button onclick="openCert('${e.name}', '${e.date}', ${e.id})" class="flex-1 py-2 bg-amber-100 text-amber-800 rounded font-bold hover:bg-amber-200">Certificado</button>
               <button onclick="cancelEnrollment(${e.id})" class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;

        return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div class="h-40 bg-gray-200 relative">
                <img src="${e.image_url || fallback}" onerror="this.src='${fallback}'" class="w-full h-full object-cover ${isPending?'grayscale':''}">
                <div class="absolute bottom-3 left-3">${statusHtml}</div>
            </div>
            <div class="p-5 flex flex-col flex-1">
                <h3 class="font-bold text-lg mb-2">${e.name}</h3>
                <div class="mt-auto pt-4 border-t flex gap-2">${buttonsHtml}</div>
            </div>
        </div>
    `;
    }).join('');
    lucide.createIcons();
}

function openEventModal(eventId) {
    const event = state.events.find(e => e.id == eventId);
    if (!event) return;

    document.getElementById('modal-evt-img').src = event.image_url || 'https://via.placeholder.com/800x400';
    document.getElementById('modal-evt-title').innerText = event.name;
    document.getElementById('modal-evt-desc').innerText = event.description;
    const price = parseFloat(event.price);
    document.getElementById('modal-evt-price').innerText = price > 0 ? `R$ ${price.toFixed(2)}` : 'Grátis';

    const dateObj = new Date(event.date);
    document.getElementById('modal-evt-date').innerText = dateObj.toLocaleDateString('pt-BR') + ' às ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('modal-evt-loc').innerText = event.location || 'Online';

    const enrolled = event.enrolled_count || 0;
    document.getElementById('modal-evt-capacity').innerText = `${enrolled} inscritos`;
    document.getElementById('modal-evt-count-badge').innerText = enrolled;

    const btn = document.getElementById('btn-register-action');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    if (state.user && state.user.role === 'admin') {
        newBtn.className = "w-full bg-gray-300 text-gray-500 font-bold py-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 mb-6 text-lg border border-gray-200";
        newBtn.innerHTML = '<i data-lucide="shield-alert"></i> Admin (Apenas Visualização)';
        newBtn.onclick = () => alert("Administradores não podem se inscrever em eventos.");
    } else if (state.enrollments.some(en => en.id == eventId)) {
        newBtn.className = "w-full bg-green-100 text-green-700 font-bold py-4 rounded-lg cursor-default flex items-center justify-center gap-2 mb-6 text-lg";
        newBtn.innerHTML = '<i data-lucide="check-circle"></i> Você já está inscrito';
        newBtn.onclick = null;
    } else {
        newBtn.className = "w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-6 text-lg shadow-lg hover:shadow-xl cursor-pointer";
        newBtn.innerHTML = '<i data-lucide="ticket"></i> Inscrever-se Agora';
        newBtn.onclick = () => { closeEventModal(); enroll(eventId); };
    }

    const modal = document.getElementById('event-details-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeEventModal() {
    document.getElementById('event-details-modal').classList.add('hidden');
    document.getElementById('event-details-modal').classList.remove('flex');
    
}async function enroll(eventId) {
    // 1. Verifica se está logado
    if (!state.user) return navigateTo('login');
    
    // 2. Busca os dados do evento
    const event = state.events.find(e => e.id == eventId);

    if (event && event.price && parseFloat(event.price) > 0) {
        console.log("Evento é PAGO. Iniciando fluxo Pix...");
        closeEventModal();
        initPixPayment(eventId);
        return;
    }

    console.log("Evento é GRÁTIS. Inscrevendo direto...");
    const btn = document.getElementById('btn-register-action');
    if(btn) btn.innerText = "Processando...";


    try {
        const res = await fetch('api_enroll.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: state.user.id, event_id: eventId })
        });
        const data = await res.json();

        if(data.success) {
            alert('✅ Inscrição realizada com sucesso!');
            state.enrollments.push(event);
            navigateTo('dashboard');
        } else {
            alert('Atenção: ' + data.message);
        }
    } catch(err) {
        alert('Erro de conexão ao tentar se inscrever.');
    }
}


async function onScan(decodedText) {
    stopScanner();
    const resDiv = document.getElementById('scan-result');
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = '<div class="flex items-center justify-center gap-2"><i data-lucide="loader-2" class="animate-spin"></i> Validando...</div>';
    lucide.createIcons();

    try {
        const qrData = JSON.parse(decodedText);
        if (!qrData.eid) throw new Error("QR Code inválido.");

        const res = await fetch('api_checkin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.user.id, event_id: qrData.eid })
        });
        const data = await res.json();

        if (data.success) {
            resDiv.className = "mt-6 p-4 rounded-xl border border-green-600 bg-green-100 text-green-800 font-bold text-center shadow-inner";
            resDiv.innerHTML = `<div class="flex flex-col items-center"><i data-lucide="check-circle" class="w-8 h-8 mb-2"></i>${data.message}</div>`;
        } else {
            throw new Error(data.message);
        }
    } catch (err) {
        resDiv.className = "mt-6 p-4 rounded-xl border border-red-600 bg-red-100 text-red-800 font-bold text-center";
        resDiv.innerHTML = `<div class="flex flex-col items-center"><i data-lucide="x-circle" class="w-8 h-8 mb-2"></i>${err.message || "Inválido"}</div>`;
    }
    lucide.createIcons();
}

function startScanner() {
    document.getElementById('scanner-camera-view').classList.remove('hidden');
    document.getElementById('scanner-start-view').classList.add('hidden');
    document.getElementById('scan-result').classList.add('hidden');
    state.scanner = new Html5Qrcode("reader");
    state.scanner.start({ facingMode: "environment" }, { fps: 10 }, onScan).catch(err => alert("Erro na câmera: " + err));
}

function stopScanner() {
    if (state.scanner) {
        state.scanner.stop().then(() => {
            state.scanner.clear();
            document.getElementById('scanner-camera-view').classList.add('hidden');
            document.getElementById('scanner-start-view').classList.remove('hidden');
            state.scanner = null;
        });
    }
}


function initAdminQR() {
    const sel = document.getElementById('qr-sel');
    sel.innerHTML = '<option>Selecione...</option>' + state.events.map(e => `<option value="${e.id}">${e.name}</option>`);
}

function startQR() {
    const eid = document.getElementById('qr-sel').value;
    if (eid === 'Selecione...') return alert("Escolha um evento");
    const view = document.getElementById('qr-view');
    view.innerHTML = '';
    new QRCode(view, {
        text: JSON.stringify({ eid: eid, t: Date.now() }),
        width: 256, height: 256
    });
}

function filterEvents(val, gridId) {
    const filtered = state.events.filter(e => e.name.toLowerCase().includes(val.toLowerCase()));
    renderCards(filtered, gridId);
}

function initStatsPage() {
    const sel = document.getElementById('stats-event-select');
    if (!sel) return;

    sel.innerHTML = '<option value="">Selecione um Evento...</option>' +
        state.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

    document.getElementById('stats-details-container').innerHTML =
        '<div class="flex flex-col items-center justify-center h-64 text-gray-400"><i data-lucide="pie-chart" class="w-12 h-12 mb-2 opacity-20"></i><p>Selecione um evento.</p></div>';
    document.getElementById('stats-total-count').innerText = "-";
    lucide.createIcons();
}

async function loadEventStats(eventId) {
    if (!eventId) return;

    const container = document.getElementById('stats-details-container');
    const totalEl = document.getElementById('stats-total-count');

    container.innerHTML = '<div class="flex justify-center py-10"><i data-lucide="loader-2" class="animate-spin w-8 h-8 text-brand-600"></i></div>';
    lucide.createIcons();

    try {
        const res = await fetch(`api_event_stats.php?event_id=${eventId}`);
        const data = await res.json();

        totalEl.innerText = data.total !== undefined ? data.total : 0;

        if (!data.history || data.history.length === 0) {
            container.innerHTML = '<div class="flex flex-col items-center justify-center h-40 text-gray-500"><i data-lucide="clipboard-x" class="w-8 h-8 mb-2"></i><p>Nenhum check-in registrado ainda.</p></div>';
            lucide.createIcons();
            return;
        }

        const maxCount = Math.max(...data.history.map(d => parseInt(d.count)));
        let html = '<div class="space-y-5">';

        data.history.forEach(day => {
            const dateParts = day.date.split('-');
            const dateStr = `${dateParts[2]}/${dateParts[1]}`;
            const pct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

            html += `
                <div class="group">
                    <div class="flex justify-between text-sm font-bold mb-1">
                        <span class="text-gray-700">${dateStr}</span>
                        <span class="text-brand-600">${day.count} check-ins</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div class="bg-brand-600 h-3 rounded-full transition-all duration-1000 group-hover:bg-brand-500" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (err) {
        console.error("Erro stats:", err);
        container.innerHTML = '<p class="text-red-500 text-center bg-red-50 p-4 rounded-lg">Erro ao carregar dados.</p>';
    }
}

let qrInterval = null;

function initAdminQR() {
    const sel = document.getElementById('qr-sel');
    if (sel) {
        sel.innerHTML = '<option value="">Selecione...</option>' +
            state.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    }
}

function startQR() {
    const eid = document.getElementById('qr-sel').value;
    if (!eid || eid === '') return alert("Escolha um evento");

    if (qrInterval) clearInterval(qrInterval);

    const generate = async () => {
        const view = document.getElementById('qr-view');
        view.style.opacity = "0.5";

        try {
            const res = await fetch('api_refresh_qr.php', { method: 'POST', body: JSON.stringify({ event_id: eid }) });
            const data = await res.json();

            if (data.success) {
                view.innerHTML = ''; // Limpa o antigo
                view.style.opacity = "1";

                new QRCode(view, {
                    text: JSON.stringify({ eid: eid, t: data.token }),
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });

                console.log("QR Code atualizado: " + new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error("Erro ao atualizar QR", err);
        }
    };
    generate();
    qrInterval = setInterval(generate, 30000);
}


async function onScan(decodedText) {
    stopScanner();
    const resDiv = document.getElementById('scan-result');
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = '<div class="flex items-center justify-center gap-2"><i data-lucide="loader-2" class="animate-spin"></i> Validando...</div>';
    lucide.createIcons();

    try {
        const qrData = JSON.parse(decodedText);
        if (!qrData.eid || !qrData.t) throw new Error("QR Code inválido ou antigo.");

        const res = await fetch('api_checkin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.user.id,
                event_id: qrData.eid,
                token: qrData.t 
            })
        });

        const data = await res.json();

        if (data.success) {
            resDiv.className = "mt-6 p-4 rounded-xl border border-green-600 bg-green-100 text-green-800 font-bold text-center shadow-inner";
            resDiv.innerHTML = `<div class="flex flex-col items-center"><i data-lucide="check-circle" class="w-8 h-8 mb-2"></i>${data.message}</div>`;
        } else {
            throw new Error(data.message);
        }
    } catch (err) {
        resDiv.className = "mt-6 p-4 rounded-xl border border-red-600 bg-red-100 text-red-800 font-bold text-center";
        resDiv.innerHTML = `<div class="flex flex-col items-center"><i data-lucide="x-circle" class="w-8 h-8 mb-2"></i>${err.message}</div>`;
    }
    lucide.createIcons();
}


function initPixPayment(eventId) {
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const event = state.events.find(e => e.id == eventId);
    const price = parseFloat(event.price).toFixed(2);

    document.getElementById('pix-amount').innerText = `R$ ${price.replace('.', ',')}`;

    document.getElementById('pix-loader').classList.remove('hidden');

    fetch('api_pix_create.php', {
        method: 'POST',
        body: JSON.stringify({ user_id: state.user.id, event_id: eventId })
    })
        .then(r => r.json())
        .then(d => {
            document.getElementById('pix-loader').classList.add('hidden');

            if (d.success) {
                document.getElementById('pix-qr-img').src = "data:image/png;base64," + d.qr_img;
                document.getElementById('pix-code-text').value = d.qr_code;

                if (state.paymentTimer) clearInterval(state.paymentTimer);
                state.paymentTimer = setInterval(() => checkPaymentStatus(d.payment_id), 5000);
            } else {
                alert("Erro ao gerar PIX: " + d.message);
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
        const data = await res.json();

        if (data.status === 'approved') {
            clearInterval(state.paymentTimer);
            document.getElementById('payment-content').classList.add('hidden');
            document.getElementById('payment-success').classList.remove('hidden');
            document.getElementById('payment-success').classList.add('flex');

            state.enrollments.push(state.events.find(e => e.id == state.tempEventId));
            loadMyEvents();
        }
    } catch (e) { console.log("Aguardando pgto..."); }
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    document.getElementById('payment-modal').classList.remove('flex');
    document.getElementById('payment-content').classList.remove('hidden');
    document.getElementById('payment-success').classList.add('hidden');
    document.getElementById('payment-success').classList.remove('flex');

    if (state.paymentTimer) clearInterval(state.paymentTimer);
}

function copyPixCode() {
    const copyText = document.getElementById("pix-code-text");
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert("Código PIX copiado!");
}
async function cancelEnrollment(eventId) {
    if (!confirm("Tem certeza de que deseja cancelar sua inscrição? Caso tenha sido paga, não haverá reembolso.")) return;

    try {
        const res = await fetch('api_cancel_enrollment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.user.id,
                event_id: eventId
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("🗑️ Inscrição cancelada com sucesso!");
            state.enrollments = state.enrollments.filter(e => e.id != eventId);
            loadMyEvents();
        } else {
            alert("Erro: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Erro de conexão ao cancelar.");
    }
}
/**
 * =========================================================================
 * MODUL AUTENTIKASI & MANAJEMEN PENGGUNA (auth.js)
 * PT. ENERGI MAJU JAYA - Web-GIS Penanaman Sawit
 * Desain Login Sesuai Referensi media_1790061422890.png
 * =========================================================================
 */

// Data Akun Bawaan (Default Users)
const DEFAULT_USERS = [
    {
        id: 'USR-001',
        name: 'Ir. Bambang Wijaya',
        email: 'admin@pt-emj.co.id',
        password: 'admin', // Demo password
        role: 'admin', // Administrator (Akses Penuh)
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        last_login: '22 Sep 2026, 08:30',
        status: 'Aktif'
    },
    {
        id: 'USR-002',
        name: 'Joko Susanto',
        email: 'mandor@pt-emj.co.id',
        password: 'mandor',
        role: 'mandor', // Mandor Lapangan (Input & Peta)
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        last_login: '22 Sep 2026, 07:15',
        status: 'Aktif'
    },
    {
        id: 'USR-003',
        name: 'Drs. Hendrawan, M.Si.',
        email: 'manager@pt-emj.co.id',
        password: 'manager',
        role: 'manager', // Estate Manager (Dashboard, Rekap, PDF)
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        last_login: '21 Sep 2026, 16:45',
        status: 'Aktif'
    }
];

// Ambil data pengguna dari localStorage
function getUsersList() {
    const saved = localStorage.getItem('sawit_registered_users');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem('sawit_registered_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
}

function saveUsersList(users) {
    localStorage.setItem('sawit_registered_users', JSON.stringify(users));
}

/**
 * Cek Status Login Saat Memuat Aplikasi
 */
function checkAuthStatus() {
    const sessionUser = localStorage.getItem('sawit_session_user');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainAppContainer');

    if (sessionUser) {
        try {
            currentUser = JSON.parse(sessionUser);
            if (loginScreen) loginScreen.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';
            updateUserDisplay();
            applyRolePermissions();
            return;
        } catch (e) {}
    }

    // Tampilkan Layar Login Split-Screen
    if (loginScreen) loginScreen.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
}

/**
 * Handle Submit Form Login
 */
function handleLoginSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('loginEmail')?.value.trim();
    const passwordInput = document.getElementById('loginPassword')?.value;
    const errorEl = document.getElementById('loginErrorMsg');

    if (errorEl) errorEl.style.display = 'none';

    const users = getUsersList();
    const user = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput);

    if (user) {
        user.last_login = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        saveUsersList(users);

        currentUser = user;
        localStorage.setItem('sawit_session_user', JSON.stringify(user));

        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainAppContainer');
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';

        updateUserDisplay();
        applyRolePermissions();

        if (typeof showToast === 'function') {
            showToast(`Selamat datang, ${user.name} (${user.role.toUpperCase()})`, 'success');
        }

        // Trigger map resize
        setTimeout(() => { if (typeof map !== 'undefined' && map) map.invalidateSize(); }, 300);
    } else {
        if (errorEl) {
            errorEl.textContent = 'Email atau kata sandi tidak cocok. Silakan coba lagi.';
            errorEl.style.display = 'block';
        }
    }
}

/**
 * Quick Login untuk Demo / Pengujian Cepat
 */
function quickLoginAs(role) {
    const users = getUsersList();
    const user = users.find(u => u.role === role);
    if (user) {
        document.getElementById('loginEmail').value = user.email;
        document.getElementById('loginPassword').value = user.password;
        document.getElementById('formLoginSplit').dispatchEvent(new Event('submit'));
    }
}

/**
 * Logout dari Sistem
 */
function handleAppLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
        localStorage.removeItem('sawit_session_user');
        window.location.reload();
    }
}

/**
 * =========================================================================
 * MANAJEMEN AKUN PENGGUNA (CRUD UNTUK ADMINISTRATOR)
 * =========================================================================
 */
function renderUserManagementTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    const users = getUsersList();
    tbody.innerHTML = '';

    users.forEach((u, idx) => {
        const tr = document.createElement('tr');
        const roleBadge = u.role === 'admin' ? 'badge-primary-role' : u.role === 'manager' ? 'badge-emerald-role' : 'badge-amber-role';

        tr.innerHTML = `
            <td style="text-align: center;">${idx + 1}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${u.avatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
                    <span style="font-weight: 600; color: #fff;">${u.name}</span>
                </div>
            </td>
            <td>${u.email}</td>
            <td><span class="badge ${roleBadge}">${u.role.toUpperCase()}</span></td>
            <td style="font-size: 11px; color: #94a3b8;">${u.last_login || '-'}</td>
            <td><span class="status-dot online" style="display:inline-block; margin-right:4px;"></span> ${u.status || 'Aktif'}</td>
            <td class="action-btn-group">
                <button type="button" class="btn-action-edit" onclick="openEditUserModal('${u.id}')" title="Edit Akun">
                    <i class="fas fa-pencil"></i> Edit
                </button>
                ${u.email !== 'admin@pt-emj.co.id' ? `
                <button type="button" class="btn-action-delete" onclick="deleteUserAccount('${u.id}')" title="Hapus Akun">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAddUserModal() {
    let modal = document.getElementById('userModal');
    if (!modal) {
        createUserModal();
        modal = document.getElementById('userModal');
    }

    document.getElementById('userModalTitle').textContent = 'Tambah Akun Pengguna Baru';
    document.getElementById('editUserId').value = '';
    document.getElementById('inpUserName').value = '';
    document.getElementById('inpUserEmail').value = '';
    document.getElementById('inpUserPassword').value = '';
    document.getElementById('inpUserPassword').required = true;
    document.getElementById('inpUserRole').value = 'mandor';

    modal.classList.add('show');
}

function openEditUserModal(userId) {
    let modal = document.getElementById('userModal');
    if (!modal) {
        createUserModal();
        modal = document.getElementById('userModal');
    }

    const users = getUsersList();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('userModalTitle').textContent = `Edit Akun: ${user.name}`;
    document.getElementById('editUserId').value = user.id;
    document.getElementById('inpUserName').value = user.name;
    document.getElementById('inpUserEmail').value = user.email;
    document.getElementById('inpUserPassword').value = '';
    document.getElementById('inpUserPassword').required = false;
    document.getElementById('inpUserPassword').placeholder = 'Kosongkan jika password tidak diganti';
    document.getElementById('inpUserRole').value = user.role;

    modal.classList.add('show');
}

function createUserModal() {
    const html = `
    <div class="modal-overlay" id="userModal">
        <div class="modal-card">
            <div class="modal-header-clean">
                <div class="modal-title-group">
                    <i class="fas fa-user-shield text-emerald text-xl"></i>
                    <div>
                        <h4 class="m-0 font-bold" id="userModalTitle">Manajemen Akun Pengguna</h4>
                        <p class="text-xs text-muted m-0">Atur hak akses login staf dan manajemen perkebunan</p>
                    </div>
                </div>
                <button type="button" class="btn-close-modal" onclick="document.getElementById('userModal').classList.remove('show')">&times;</button>
            </div>
            
            <form id="formUserAccount" onsubmit="saveUserAccount(event)">
                <input type="hidden" id="editUserId">
                <div class="modal-body-clean">
                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Nama Lengkap Pengguna <span class="text-danger">*</span></label>
                        <input type="text" id="inpUserName" class="form-control-clean" required>
                    </div>

                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Email / Akun Login <span class="text-danger">*</span></label>
                        <input type="email" id="inpUserEmail" class="form-control-clean" required>
                    </div>

                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Kata Sandi (Password)</label>
                        <input type="password" id="inpUserPassword" class="form-control-clean" placeholder="Minimal 5 karakter">
                    </div>

                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Peran Akses (Role)</label>
                        <select id="inpUserRole" class="form-control-clean">
                            <option value="mandor">Mandor Lapangan (Input Kegiatan & Peta)</option>
                            <option value="manager">Estate Manager (Monitoring, Approval, Cetak PDF)</option>
                            <option value="admin">Administrator (Akses Penuh Sistem & Pengaturan)</option>
                        </select>
                    </div>
                </div>
                
                <div class="modal-footer-clean">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('userModal').classList.remove('show')">Batal</button>
                    <button type="submit" class="btn btn-emerald btn-sm">
                        <i class="fas fa-check mr-1"></i> Simpan Akun
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function saveUserAccount(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('inpUserName').value.trim();
    const email = document.getElementById('inpUserEmail').value.trim();
    const password = document.getElementById('inpUserPassword').value;
    const role = document.getElementById('inpUserRole').value;

    const users = getUsersList();

    if (userId) {
        // Edit User
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx].name = name;
            users[idx].email = email;
            users[idx].role = role;
            if (password) users[idx].password = password;
        }
    } else {
        // Tambah User
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            showToast('Email sudah terdaftar untuk akun lain!', 'error');
            return;
        }
        const newId = `USR-${Date.now().toString().slice(-4)}`;
        users.push({
            id: newId,
            name: name,
            email: email,
            password: password || '123456',
            role: role,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            last_login: '-',
            status: 'Aktif'
        });
    }

    saveUsersList(users);
    renderUserManagementTable();
    document.getElementById('userModal').classList.remove('show');
    showToast(`Akun "${name}" berhasil disimpan!`, 'success');
}

function deleteUserAccount(userId) {
    const users = getUsersList();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.email})?`)) return;

    const filtered = users.filter(u => u.id !== userId);
    saveUsersList(filtered);
    renderUserManagementTable();
    showToast(`Akun "${user.name}" telah dihapus.`, 'success');
}

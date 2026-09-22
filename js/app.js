/**
 * =========================================================================
 * CORE LOGIC & APLIKASI WEB-GIS ENTERPRISE - PT. ENERGI MAJU JAYA
 * app.js - Branding Customizer, Theme Switcher, Responsive Nav, & Core Logic
 * =========================================================================
 */

const GAS_URL = 'YOUR_GAS_WEB_APP_URL_HERE';
const IS_DEMO = GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE';

// DATA MASTER BLOK PT. EMJ (DISIMPAN DI MEMORY / LOCALSTORAGE)
let DEFAULT_BLOCKS = [
    {
        id_blok: 'OPD A',
        afdeling: 'Afdeling 1',
        estate: 'Estate Sei Semujur',
        luas_ha: 6.68,
        pola_tanam: 'Mata Lima',
        jarak_tanam: '9x9',
        target_sph: 138,
        target_pokok: 922,
        total_tertanam_ha: 0.89,
        total_tertanam: 123,
        todate_lubang_ha: 0.94,
        todate_pancang_ha: 1.73,
        todate_ajir_pcs: 140,
        todate_langsir_ha: 0.89,
        sisa_ha: 5.79,
        persentase: 13.32,
        status: 'Sedang Berjalan',
        varietas_bibit: 'Dami Mas',
        tahun_tanam: 2026
    },
    {
        id_blok: 'OPD C',
        afdeling: 'Afdeling 1',
        estate: 'Estate Sei Semujur',
        luas_ha: 6.66,
        pola_tanam: 'Mata Lima',
        jarak_tanam: '9x9',
        target_sph: 138,
        target_pokok: 919,
        total_tertanam_ha: 3.58,
        total_tertanam: 494,
        todate_lubang_ha: 3.58,
        todate_pancang_ha: 3.66,
        todate_ajir_pcs: 730,
        todate_langsir_ha: 3.58,
        sisa_ha: 3.08,
        persentase: 53.75,
        status: 'Sedang Berjalan',
        varietas_bibit: 'Marihat',
        tahun_tanam: 2026
    },
    {
        id_blok: 'OPD B',
        afdeling: 'Afdeling 1',
        estate: 'Estate Sei Semujur',
        luas_ha: 6.70,
        pola_tanam: 'Mata Lima',
        jarak_tanam: '9x9',
        target_sph: 138,
        target_pokok: 925,
        total_tertanam_ha: 0.00,
        total_tertanam: 0,
        todate_lubang_ha: 0,
        todate_pancang_ha: 0,
        todate_ajir_pcs: 0,
        todate_langsir_ha: 0,
        sisa_ha: 6.70,
        persentase: 0.00,
        status: 'Belum Mulai',
        varietas_bibit: 'Dami Mas',
        tahun_tanam: 2026
    },
    {
        id_blok: 'OPD D',
        afdeling: 'Afdeling 1',
        estate: 'Estate Sei Semujur',
        luas_ha: 6.65,
        pola_tanam: 'Mata Lima',
        jarak_tanam: '9x9',
        target_sph: 138,
        target_pokok: 918,
        total_tertanam_ha: 0.00,
        total_tertanam: 0,
        todate_lubang_ha: 0,
        todate_pancang_ha: 0,
        todate_ajir_pcs: 0,
        todate_langsir_ha: 0,
        sisa_ha: 6.65,
        persentase: 0.00,
        status: 'Belum Mulai',
        varietas_bibit: 'PPKS 239',
        tahun_tanam: 2026
    }
];

// DATA LAPORAN OTENTIK DARI EXCEL PT. EMJ
let DEFAULT_REPORTS = [
    {
        id_laporan: 'LPR-20260902-001',
        tanggal: '2026-09-02',
        jml_tenaga_kerja: 3,
        nama_tenaga_kerja: '1. Sunardi  2. Dedy  3. Fajri',
        kegiatan: 'Pancang tanam',
        id_blok: 'OPD A',
        luas_ha: 6.68,
        uom: 'Ha',
        realisasi_jml: 0.41,
        todate: 1.73,
        sisa_ha: 4.95,
        keterangan: 'Pematokan barisan tanam kontur',
        lat_gps: -1.104212,
        lng_gps: 102.153401,
        foto_url: 'https://images.unsplash.com/photo-1592417817098-8f3d69102553?auto=format&fit=crop&w=600&q=80'
    },
    {
        id_laporan: 'LPR-20260902-002',
        tanggal: '2026-09-02',
        jml_tenaga_kerja: 2,
        nama_tenaga_kerja: '1. Baco  2. Angga',
        kegiatan: 'Pembuatan lubang tanam',
        id_blok: 'OPD A',
        luas_ha: 6.68,
        uom: 'Ha',
        realisasi_jml: 0.20,
        todate: 0.94,
        sisa_ha: 5.74,
        keterangan: 'Ukuran lubang 60x60x40 cm sesuai SOP',
        lat_gps: -1.104501,
        lng_gps: 102.153920,
        foto_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'
    },
    {
        id_laporan: 'LPR-20260902-003',
        tanggal: '2026-09-02',
        jml_tenaga_kerja: 1,
        nama_tenaga_kerja: '1. Harianto',
        kegiatan: 'Langsir bibit dari terminal ke titik tanam',
        id_blok: 'OPD A',
        luas_ha: 6.68,
        uom: 'Ha',
        realisasi_jml: 0.15,
        todate: 0.89,
        sisa_ha: 5.79,
        keterangan: 'Menggunakan angkong & keranjang',
        lat_gps: -1.104720,
        lng_gps: 102.154210,
        foto_url: ''
    },
    {
        id_laporan: 'LPR-20260902-004',
        tanggal: '2026-09-02',
        jml_tenaga_kerja: 1,
        nama_tenaga_kerja: '1. Harianto',
        kegiatan: 'Tanam',
        id_blok: 'OPD A',
        luas_ha: 6.68,
        uom: 'Ha',
        realisasi_jml: 0.15,
        todate: 0.89,
        sisa_ha: 5.79,
        keterangan: 'Aplikasi pupuk dasar RP 500 gr/lubang',
        lat_gps: -1.104890,
        lng_gps: 102.154400,
        foto_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80'
    },
    {
        id_laporan: 'LPR-20260828-001',
        tanggal: '2026-08-28',
        jml_tenaga_kerja: 2,
        nama_tenaga_kerja: '1. Dedy  2. Harianto',
        kegiatan: 'Tanam',
        id_blok: 'OPD C',
        luas_ha: 6.66,
        uom: 'Ha',
        realisasi_jml: 0.36,
        todate: 3.58,
        sisa_ha: 3.08,
        keterangan: 'Penanaman tahap akhir batch 1 Blok OPD C',
        lat_gps: -1.108200,
        lng_gps: 102.158200,
        foto_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80'
    }
];

let appData = {
    blocks: [],
    reports: []
};

let currentUser = {
    id: 'USR-001',
    name: 'Ir. Bambang Wijaya',
    email: 'admin@pt-emj.co.id',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
};

let chartTrendInstance = null;
let chartBlokInstance = null;

// ===== INISIALISASI UTAMA =====
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek Status Login (Split-Screen Login vs Dashboard)
    if (typeof checkAuthStatus === 'function') {
        checkAuthStatus();
    }

    // 2. Terapkan Tema Warna & Branding
    loadAppThemeAndBranding();

    // 3. Muat Data Master Blok & Rekap
    loadPersistedData();

    // 4. Inisialisasi Navigasi Dinamis Responsif (Sidebar & Top Horizontal Pills)
    initDynamicNavigation();

    // 5. Render Komponen Tampilan
    renderDashboard(appData.blocks, appData.reports);
    renderRekapTable(appData.reports);
    renderMasterBlokTable();

    if (typeof initForm === 'function') initForm();
});

function loadPersistedData() {
    const savedBlocks = localStorage.getItem('sawit_master_blocks');
    if (savedBlocks) {
        try { appData.blocks = JSON.parse(savedBlocks); } catch (e) { appData.blocks = DEFAULT_BLOCKS; }
    } else {
        appData.blocks = DEFAULT_BLOCKS;
    }

    const savedReports = localStorage.getItem('sawit_trx_reports');
    if (savedReports) {
        try { appData.reports = JSON.parse(savedReports); } catch (e) { appData.reports = DEFAULT_REPORTS; }
    } else {
        appData.reports = DEFAULT_REPORTS;
    }

    syncBlokMetadata();
}

function syncBlokMetadata() {
    if (typeof BLOK_METADATA !== 'undefined') {
        appData.blocks.forEach(b => {
            BLOK_METADATA[b.id_blok] = {
                luas_ha: b.luas_ha,
                target_sph: b.target_sph || 138,
                target_pokok: b.target_pokok || Math.round(b.luas_ha * 138),
                afdeling: b.afdeling
            };
        });
    }

    const select = document.getElementById('selectBlok');
    if (select) {
        const curVal = select.value;
        select.innerHTML = '<option value="" disabled selected>-- Pilih Blok --</option>';
        appData.blocks.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id_blok;
            opt.textContent = `Blok ${b.id_blok} (${b.luas_ha} Ha - SPH ${b.target_sph || 138})`;
            select.appendChild(opt);
        });
        if (curVal) select.value = curVal;
    }
}

/**
 * =========================================================================
 * 3. KUSTOMISASI BRANDING: LOGO, NAMA APLIKASI, & WARNA TEMA DINAMIS
 * =========================================================================
 */
function loadAppThemeAndBranding() {
    // 1. Warna Tema
    const savedColor = localStorage.getItem('sawit_theme_color');
    if (savedColor) applyThemeColor(savedColor, false);

    // 2. Nama Aplikasi
    const savedAppName = localStorage.getItem('sawit_app_name');
    if (savedAppName) {
        document.querySelectorAll('.app-title').forEach(el => el.textContent = savedAppName);
        const inp = document.getElementById('setAppCustomName');
        if (inp) inp.value = savedAppName;
    }

    // 3. Logo Aplikasi
    const savedLogo = localStorage.getItem('sawit_app_logo');
    if (savedLogo) {
        document.querySelectorAll('.brand-badge').forEach(el => {
            el.innerHTML = `<img src="${savedLogo}" style="width: 24px; height: 24px; object-fit: contain;">`;
        });
    }
}

function applyThemeColor(hexColor, showNotification = true) {
    document.documentElement.style.setProperty('--emerald', hexColor);

    // Hitung variasi warna gelap dan transparan
    const r = parseInt(hexColor.slice(1, 3), 16) || 16;
    const g = parseInt(hexColor.slice(3, 5), 16) || 185;
    const b = parseInt(hexColor.slice(5, 7), 16) || 129;

    const darker = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    const subtle = `rgba(${r}, ${g}, ${b}, 0.15)`;

    document.documentElement.style.setProperty('--emerald-dark', darker);
    document.documentElement.style.setProperty('--emerald-subtle', subtle);

    localStorage.setItem('sawit_theme_color', hexColor);

    const picker = document.getElementById('customColorPicker');
    if (picker) picker.value = hexColor;

    if (showNotification && typeof showToast === 'function') {
        showToast(`Tema warna aplikasi diperbarui (${hexColor})`, 'success');
    }
}

function saveAppBrandingFromUI() {
    const newName = document.getElementById('setAppCustomName')?.value.trim();
    if (newName) {
        localStorage.setItem('sawit_app_name', newName);
        document.querySelectorAll('.app-title').forEach(el => el.textContent = newName);
    }

    const fileInput = document.getElementById('uploadAppLogoFile');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            localStorage.setItem('sawit_app_logo', e.target.result);
            document.querySelectorAll('.brand-badge').forEach(el => {
                el.innerHTML = `<img src="${e.target.result}" style="width: 24px; height: 24px; object-fit: contain;">`;
            });
        };
        reader.readAsDataURL(fileInput.files[0]);
    }

    showToast('Identitas dan logo aplikasi berhasil diperbarui!', 'success');
}

/**
 * =========================================================================
 * 5. NAVIGASI DINAMIS RESPONSIF (HP / TABLET / LAPTOP / DESKTOP)
 * Di HP / Tablet sidebar samping berpindah ke ATAS berbentuk Horizontal Pill Nav
 * =========================================================================
 */
function initDynamicNavigation() {
    // Tombol di sidebar samping desktop
    const sidebarItems = document.querySelectorAll('.sidebar-menu .menu-item');
    // Tombol di bar lonjong atas (Horizontal Pill Nav) untuk Mobile/Tablet
    const topPillItems = document.querySelectorAll('.top-pill-nav .pill-btn');

    const pages = document.querySelectorAll('.page');
    const hamburger = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    function switchPage(targetId) {
        // Sync active class on sidebar items
        sidebarItems.forEach(m => {
            m.classList.toggle('active', m.getAttribute('data-target') === targetId);
        });

        // Sync active class on top pills
        topPillItems.forEach(p => {
            p.classList.toggle('active', p.getAttribute('data-target') === targetId);
        });

        // Switch visible page
        pages.forEach(p => p.classList.toggle('active', p.id === targetId));

        // Hook inisialisasi per modul
        if (targetId === 'page-map' && typeof initMap === 'function') {
            setTimeout(initMap, 100);
        } else if (targetId === 'page-form' && typeof initForm === 'function') {
            setTimeout(initForm, 100);
        } else if (targetId === 'page-upload' && typeof initUploadZone === 'function') {
            setTimeout(initUploadZone, 100);
        } else if (targetId === 'page-settings') {
            loadCompanySettingsToForm();
            renderMasterBlokTable();
            if (typeof renderUserManagementTable === 'function') renderUserManagementTable();
        }

        // Close sidebar if open on mobile
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.remove('expanded');
        }
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => switchPage(item.getAttribute('data-target')));
    });

    topPillItems.forEach(pill => {
        pill.addEventListener('click', () => switchPage(pill.getAttribute('data-target')));
    });

    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
            sidebar.classList.toggle('collapsed');
            if (mainContent) mainContent.classList.toggle('expanded');
            setTimeout(() => { if (typeof map !== 'undefined' && map) map.invalidateSize(); }, 300);
        });
    }
}

// ===== MASTER BLOK CRUD & REKAP ACTION (Sama dengan Turn Sebelumnya) =====
function renderMasterBlokTable() {
    const tbody = document.getElementById('masterBlokTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    appData.blocks.forEach((b) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: #fff;">${b.id_blok}</td>
            <td>${b.afdeling}</td>
            <td><b>${b.luas_ha} Ha</b></td>
            <td>${b.jarak_tanam || '9x9'} (${b.pola_tanam || 'Mata Lima'})</td>
            <td><span class="badge bg-emerald-subtle text-emerald">${b.target_sph || 138} SPH</span></td>
            <td>${(b.target_pokok || 0).toLocaleString('id-ID')} Pkk</td>
            <td>${b.varietas_bibit || '-'}</td>
            <td>${b.tahun_tanam || 2026}</td>
            <td class="action-btn-group">
                <button type="button" class="btn-action-edit" onclick="openEditBlokModal('${b.id_blok}')" title="Edit Data Blok">
                    <i class="fas fa-pencil"></i> Edit
                </button>
                <button type="button" class="btn-action-delete" onclick="deleteBlok('${b.id_blok}')" title="Hapus Blok">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let tempUploadedBlokGeometry = null;

function openAddBlokModal() {
    let modal = document.getElementById('blokModal');
    if (!modal) {
        createBlokModal();
        modal = document.getElementById('blokModal');
    }

    tempUploadedBlokGeometry = null;
    const shpInput = document.getElementById('inpBlokShpFile');
    if (shpInput) shpInput.value = '';
    const statusText = document.getElementById('blokShpStatusText');
    if (statusText) {
        statusText.textContent = 'Unggah file .zip (SHP+SHX+DBF). Sistem otomatis menghitung luas Hektar & target pokok secara akurat.';
        statusText.className = 'text-xs text-muted m-0 mt-1';
    }

    document.getElementById('blokModalTitle').textContent = 'Tambah Blok Kebun Baru';
    document.getElementById('editBlokOriginalId').value = '';
    document.getElementById('inpBlokId').value = '';
    document.getElementById('inpBlokId').readOnly = false;
    document.getElementById('inpBlokAfdeling').value = 'Afdeling 1';
    document.getElementById('inpBlokLuas').value = '';
    document.getElementById('inpBlokVarietas').value = 'Dami Mas';
    document.getElementById('inpBlokTahun').value = '2026';
    document.getElementById('inpBlokPola').value = 'Mata Lima';
    document.getElementById('inpBlokJarak').value = '9x9';
    recalculateSphInModal();

    modal.classList.add('show');
}

function openEditBlokModal(idBlok) {
    let modal = document.getElementById('blokModal');
    if (!modal) {
        createBlokModal();
        modal = document.getElementById('blokModal');
    }

    tempUploadedBlokGeometry = null;
    const shpInput = document.getElementById('inpBlokShpFile');
    if (shpInput) shpInput.value = '';

    const blok = appData.blocks.find(b => b.id_blok === idBlok);
    if (!blok) return;

    document.getElementById('blokModalTitle').textContent = `Edit Data Blok: ${blok.id_blok}`;
    document.getElementById('editBlokOriginalId').value = blok.id_blok;
    document.getElementById('inpBlokId').value = blok.id_blok;
    document.getElementById('inpBlokId').readOnly = true;
    document.getElementById('inpBlokAfdeling').value = blok.afdeling;
    document.getElementById('inpBlokLuas').value = blok.luas_ha;
    document.getElementById('inpBlokVarietas').value = blok.varietas_bibit || 'Dami Mas';
    document.getElementById('inpBlokTahun').value = blok.tahun_tanam || '2026';
    document.getElementById('inpBlokPola').value = blok.pola_tanam || 'Mata Lima';
    document.getElementById('inpBlokJarak').value = blok.jarak_tanam || '9x9';
    document.getElementById('inpBlokSph').value = blok.target_sph || 138;
    document.getElementById('inpBlokTarget').value = blok.target_pokok || Math.round(blok.luas_ha * 138);

    modal.classList.add('show');
}

function createBlokModal() {
    const html = `
    <div class="modal-overlay" id="blokModal">
        <div class="modal-card">
            <div class="modal-header-clean">
                <div class="modal-title-group">
                    <i class="fas fa-layer-group text-emerald text-xl"></i>
                    <div>
                        <h4 class="m-0 font-bold" id="blokModalTitle">Database Blok Kebun</h4>
                        <p class="text-xs text-muted m-0">Kelola perimeter luasan, jarak tanam, dan populasi pokok</p>
                    </div>
                </div>
                <button type="button" class="btn-close-modal" onclick="document.getElementById('blokModal').classList.remove('show')">&times;</button>
            </div>
            
            <form id="formMasterBlok" onsubmit="saveBlok(event)">
                <input type="hidden" id="editBlokOriginalId">
                <div class="modal-body-clean">

                    <!-- Fitur Upload Shapefile Terintegrasi Langsung di Master Blok -->
                    <div class="form-group-clean mb-3 p-2 bg-subtle rounded border-subtle">
                        <div class="flex-between mb-1">
                            <label class="form-label-xs text-emerald font-semibold m-0">
                                <i class="fas fa-file-zipper mr-1"></i> Upload Shapefile Blok Kebun (.zip / GeoJSON)
                            </label>
                            <span class="badge badge-emerald-role">Auto-Detect Luas & SPH</span>
                        </div>
                        <input type="file" id="inpBlokShpFile" class="form-control-clean" accept=".zip,.geojson,.json" onchange="handleBlokShpUpload(event)">
                        <p class="text-xs text-muted m-0 mt-1" id="blokShpStatusText">
                            Unggah file .zip (SHP+SHX+DBF). Sistem otomatis menghitung luas Hektar & target pokok secara akurat.
                        </p>
                    </div>

                    <div class="form-row-2">
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Kode Blok (e.g. OPD E) <span class="text-danger">*</span></label>
                            <input type="text" id="inpBlokId" class="form-control-clean font-bold" required>
                        </div>
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Divisi / Afdeling</label>
                            <input type="text" id="inpBlokAfdeling" class="form-control-clean" value="Afdeling 1">
                        </div>
                    </div>

                    <div class="form-row-2">
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Luas Area Efektif (Ha) <span class="text-danger">*</span></label>
                            <input type="number" step="0.01" id="inpBlokLuas" class="form-control-clean font-bold text-emerald" oninput="recalculateSphInModal()" required>
                        </div>
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Varietas Bibit</label>
                            <input type="text" id="inpBlokVarietas" class="form-control-clean" value="Dami Mas">
                        </div>
                    </div>

                    <div class="p-2 bg-subtle rounded border-subtle mb-3">
                        <span class="form-label-xs font-semibold text-white mb-2 block">Aturan & Pola Tanam:</span>
                        <div class="form-row-2">
                            <div class="form-group-clean mb-1">
                                <label class="text-xs text-muted">Pola Tanam</label>
                                <select id="inpBlokPola" class="form-control-clean" onchange="recalculateSphInModal()">
                                    <option value="Mata Lima">Mata Lima (Segitiga Sama Sisi)</option>
                                    <option value="Segiempat">Segiempat (Bujursangkar)</option>
                                </select>
                            </div>
                            <div class="form-group-clean mb-1">
                                <label class="text-xs text-muted">Jarak Tanam (m)</label>
                                <select id="inpBlokJarak" class="form-control-clean" onchange="recalculateSphInModal()">
                                    <option value="9x9">9.0m x 9.0m (Standar 138 SPH)</option>
                                    <option value="9x8">9.0m x 8.0m (138 SPH Segiempat)</option>
                                    <option value="9.2x7.9">9.2m x 7.9m (138 SPH Segitiga)</option>
                                    <option value="8.5x8.5">8.5m x 8.5m (160 SPH Kerapatan Tinggi)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row-2 mt-2">
                            <div class="form-group-clean">
                                <label class="text-xs text-muted">Target SPH</label>
                                <input type="number" id="inpBlokSph" class="form-control-clean bg-slate-subtle font-bold" readonly>
                            </div>
                            <div class="form-group-clean">
                                <label class="text-xs text-muted">Estimasi Target Pokok</label>
                                <input type="number" id="inpBlokTarget" class="form-control-clean bg-slate-subtle font-bold text-emerald" readonly>
                            </div>
                        </div>
                    </div>

                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Tahun Pelaksanaan Tanam</label>
                        <input type="number" id="inpBlokTahun" class="form-control-clean" value="2026">
                    </div>
                </div>
                
                <div class="modal-footer-clean">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('blokModal').classList.remove('show')">Batal</button>
                    <button type="submit" class="btn btn-emerald btn-sm">
                        <i class="fas fa-check mr-1"></i> Simpan Blok Kebun
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

/**
 * Handle Ekstraksi Shapefile di Modal Blok & Kalkulasi Luas Otomatis
 */
async function handleBlokShpUpload(e) {
    const file = e.target.files[0];
    const statusEl = document.getElementById('blokShpStatusText');
    if (!file) return;

    if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin text-emerald mr-1"></i> Membaca data spasial Shapefile & menghitung luas area...';
        statusEl.className = 'text-xs text-emerald mt-1';
    }

    try {
        let geojson = null;
        const fname = file.name.toLowerCase();

        if (fname.endsWith('.zip')) {
            if (typeof shp === 'undefined') throw new Error('Pustaka shpjs belum siap.');
            const buffer = await file.arrayBuffer();
            geojson = await shp(buffer);
        } else if (fname.endsWith('.geojson') || fname.endsWith('.json')) {
            const text = await file.text();
            geojson = JSON.parse(text);
        } else {
            throw new Error('Format berkas harus berupa .zip (Shapefile) atau .geojson');
        }

        let features = geojson.type === 'FeatureCollection' ? geojson.features : (Array.isArray(geojson) ? geojson[0].features : [geojson]);
        let polyFeature = features.find(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));

        if (!polyFeature) {
            throw new Error('Geometri poligon batas blok tidak ditemukan di dalam berkas.');
        }

        let coords = polyFeature.geometry.coordinates;
        let isPlanar = false;

        const samplePt = polyFeature.geometry.type === 'Polygon' ? coords[0][0] : coords[0][0][0];
        if (Math.abs(samplePt[0]) > 10000 || Math.abs(samplePt[1]) > 10000) {
            isPlanar = true;
        }

        let luasHa = 0;
        if (isPlanar) {
            let ring = polyFeature.geometry.type === 'Polygon' ? coords[0] : coords[0][0];
            let areaM2 = calculateShoelaceArea(ring);
            luasHa = areaM2 / 10000;
            polyFeature = reprojectFeatureToWGS84(polyFeature, 'EPSG:32750');
        } else {
            let ringWgs = polyFeature.geometry.type === 'Polygon' ? coords[0] : coords[0][0];
            let ringUtm = ringWgs.map(pt => {
                try {
                    return (typeof proj4 !== 'undefined') ? proj4('WGS84', 'EPSG:32750', [pt[0], pt[1]]) : pt;
                } catch(err) {
                    return pt;
                }
            });
            let areaM2 = calculateShoelaceArea(ringUtm);
            luasHa = areaM2 / 10000;
        }

        if (luasHa <= 0) luasHa = 1.0;

        const inpLuas = document.getElementById('inpBlokLuas');
        if (inpLuas) inpLuas.value = luasHa.toFixed(2);

        const props = polyFeature.properties || {};
        const blockNameCandidate = props.BLOK || props.KODE_BLOK || props.KODE || props.NAME || props.Id || props.ID_BLOK;
        const inpId = document.getElementById('inpBlokId');
        if (inpId && blockNameCandidate && !inpId.readOnly) {
            inpId.value = String(blockNameCandidate).toUpperCase();
        }

        recalculateSphInModal();

        tempUploadedBlokGeometry = polyFeature.geometry;

        if (statusEl) {
            statusEl.innerHTML = `<i class="fas fa-circle-check text-emerald mr-1"></i> Shapefile sukses dibaca! Luas terdeteksi: <b>${luasHa.toFixed(2)} Ha</b> (${isPlanar ? 'UTM 50S' : 'WGS84'}).`;
            statusEl.className = 'text-xs text-emerald mt-1';
        }
        if (typeof showToast === 'function') {
            showToast(`Shapefile berhasil dimuat! Luas: ${luasHa.toFixed(2)} Ha`, 'success');
        }
    } catch (err) {
        console.error('SHP Upload Error:', err);
        if (statusEl) {
            statusEl.innerHTML = `<i class="fas fa-triangle-exclamation text-danger mr-1"></i> ${err.message || 'Gagal memproses Shapefile'}`;
            statusEl.className = 'text-xs text-danger mt-1';
        }
        if (typeof showToast === 'function') showToast(err.message || 'Gagal membaca Shapefile', 'error');
    }
}

function calculateShoelaceArea(ring) {
    let area = 0;
    const n = ring.length;
    for (let i = 0; i < n - 1; i++) {
        area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    area += ring[n - 1][0] * ring[0][1] - ring[0][0] * ring[n - 1][1];
    return Math.abs(area) / 2;
}

function reprojectFeatureToWGS84(feature, sourceCrs = 'EPSG:32750') {
    const clone = JSON.parse(JSON.stringify(feature));
    const reprojectCoord = (coord) => {
        if (typeof proj4 !== 'undefined') {
            try {
                return proj4(sourceCrs, 'WGS84', [coord[0], coord[1]]);
            } catch(e) {
                return coord;
            }
        }
        return coord;
    };

    if (clone.geometry.type === 'Polygon') {
        clone.geometry.coordinates = clone.geometry.coordinates.map(ring => ring.map(reprojectCoord));
    } else if (clone.geometry.type === 'MultiPolygon') {
        clone.geometry.coordinates = clone.geometry.coordinates.map(poly => poly.map(ring => ring.map(reprojectCoord)));
    }
    return clone;
}

function recalculateSphInModal() {
    const pola = document.getElementById('inpBlokPola')?.value || 'Mata Lima';
    const jarakStr = document.getElementById('inpBlokJarak')?.value || '9x9';
    const luas = parseFloat(document.getElementById('inpBlokLuas')?.value) || 0;

    let sph = 138;
    if (jarakStr === '9x9') {
        sph = (pola === 'Mata Lima') ? 138 : 123;
    } else if (jarakStr === '9x8') {
        sph = 138;
    } else if (jarakStr === '9.2x7.9') {
        sph = 138;
    } else if (jarakStr === '8.5x8.5') {
        sph = (pola === 'Mata Lima') ? 160 : 138;
    }

    const sphInput = document.getElementById('inpBlokSph');
    const targetInput = document.getElementById('inpBlokTarget');
    if (sphInput) sphInput.value = sph;
    if (targetInput) targetInput.value = Math.round(luas * sph);
}

function saveBlok(e) {
    e.preventDefault();
    const origId = document.getElementById('editBlokOriginalId').value;
    const idBlok = document.getElementById('inpBlokId').value.trim().toUpperCase();
    const afdeling = document.getElementById('inpBlokAfdeling').value.trim();
    const luas = parseFloat(document.getElementById('inpBlokLuas').value) || 0;
    const pola = document.getElementById('inpBlokPola').value;
    const jarak = document.getElementById('inpBlokJarak').value;
    const sph = parseInt(document.getElementById('inpBlokSph').value) || 138;
    const target = parseInt(document.getElementById('inpBlokTarget').value) || Math.round(luas * sph);
    const varietas = document.getElementById('inpBlokVarietas').value.trim();
    const tahun = parseInt(document.getElementById('inpBlokTahun').value) || 2026;

    if (!idBlok || luas <= 0) {
        showToast('Kode blok dan luas wajib diisi valid!', 'error');
        return;
    }

    if (origId) {
        const idx = appData.blocks.findIndex(b => b.id_blok === origId);
        if (idx !== -1) {
            appData.blocks[idx] = {
                ...appData.blocks[idx],
                afdeling,
                luas_ha: luas,
                pola_tanam: pola,
                jarak_tanam: jarak,
                target_sph: sph,
                target_pokok: target,
                varietas_bibit: varietas,
                tahun_tanam: tahun,
                geometry: tempUploadedBlokGeometry || appData.blocks[idx].geometry || null
            };
        }
    } else {
        if (appData.blocks.some(b => b.id_blok === idBlok)) {
            showToast(`Blok dengan kode ${idBlok} sudah terdaftar!`, 'error');
            return;
        }
        appData.blocks.push({
            id_blok: idBlok,
            afdeling,
            estate: 'Estate Sei Semujur',
            luas_ha: luas,
            pola_tanam: pola,
            jarak_tanam: jarak,
            target_sph: sph,
            target_pokok: target,
            total_tertanam_ha: 0,
            total_tertanam: 0,
            todate_lubang_ha: 0,
            todate_pancang_ha: 0,
            todate_ajir_pcs: 0,
            todate_langsir_ha: 0,
            sisa_ha: luas,
            persentase: 0,
            status: 'Belum Mulai',
            varietas_bibit: varietas,
            tahun_tanam: tahun,
            geometry: tempUploadedBlokGeometry || null
        });
    }

    tempUploadedBlokGeometry = null;
    localStorage.setItem('sawit_master_blocks', JSON.stringify(appData.blocks));
    syncBlokMetadata();
    renderMasterBlokTable();
    renderDashboard(appData.blocks, appData.reports);

    if (typeof loadBlockLayers === 'function') loadBlockLayers();

    document.getElementById('blokModal').classList.remove('show');
    showToast(`Blok ${idBlok} berhasil disimpan!`, 'success');
}

function deleteBlok(idBlok) {
    if (!confirm(`Apakah Anda yakin ingin menghapus Blok ${idBlok} dari database?`)) return;

    appData.blocks = appData.blocks.filter(b => b.id_blok !== idBlok);
    localStorage.setItem('sawit_master_blocks', JSON.stringify(appData.blocks));
    syncBlokMetadata();
    renderMasterBlokTable();
    renderDashboard(appData.blocks, appData.reports);
    if (typeof loadBlockLayers === 'function') loadBlockLayers();

    showToast(`Blok ${idBlok} berhasil dihapus.`, 'success');
}

// ===== EDIT & HAPUS REKAPITULASI (MULTI-FOTO SUPPORT) =====
function renderRekapTable(reports) {
    const tbody = document.querySelector('#page-rekap .data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    reports.forEach((r, idx) => {
        const photos = Array.isArray(r.foto_kegiatan) && r.foto_kegiatan.length > 0 
            ? r.foto_kegiatan 
            : (r.foto_url || r.foto ? [r.foto_url || r.foto] : []);
        const photoCount = photos.length;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">${idx + 1}</td>
            <td>${formatDateIndo(r.tanggal || r.tanggal_tanam)}</td>
            <td style="text-align: center;">${r.jml_tenaga_kerja || 1}</td>
            <td style="font-size: 8.5pt;">${r.nama_tenaga_kerja || r.mandor || '-'}</td>
            <td style="font-weight: 600; color: #f8fafc;">${r.kegiatan}</td>
            <td style="text-align: center; font-weight: bold;">${r.id_blok}</td>
            <td style="text-align: right;">${r.luas_ha || 6.66}</td>
            <td style="text-align: center;">${r.uom || 'Ha'}</td>
            <td style="text-align: right; font-weight: bold; color: var(--emerald);">${Number(r.realisasi_jml).toLocaleString('id-ID')}</td>
            <td style="text-align: right;">${Number(r.todate || r.realisasi_jml).toLocaleString('id-ID')}</td>
            <td style="text-align: right;">${r.sisa_ha !== undefined ? r.sisa_ha : '-'}</td>
            <td style="font-size: 8pt; color: #94a3b8;">${r.keterangan || r.catatan || '-'}</td>
            <td style="text-align: center;">
                ${photoCount > 0 
                    ? `<button type="button" class="btn btn-xs btn-outline-clean" onclick="openPhotoGalleryModal('${r.id_laporan}')" title="Buka ${photoCount} Foto Dokumentasi">
                         <i class="fas fa-camera text-emerald mr-1"></i> ${photoCount} Foto
                       </button>`
                    : `<span class="text-xs text-muted">-</span>`
                }
            </td>
            <td class="action-btn-group">
                <button type="button" class="btn-action-edit" onclick="openEditReportModal('${r.id_laporan}')" title="Edit Laporan">
                    <i class="fas fa-pencil"></i>
                </button>
                <button type="button" class="btn-action-delete" onclick="deleteReport('${r.id_laporan}')" title="Hapus Laporan">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const countEl = document.getElementById('rekapRecordCount');
    if (countEl) countEl.textContent = `Menampilkan ${reports.length} catatan kegiatan`;
}

function openPhotoGalleryModal(idLaporan) {
    const rep = appData.reports.find(r => r.id_laporan === idLaporan);
    if (!rep) return;

    const photos = Array.isArray(rep.foto_kegiatan) && rep.foto_kegiatan.length > 0 
        ? rep.foto_kegiatan 
        : (rep.foto_url || rep.foto ? [rep.foto_url || rep.foto] : []);

    if (photos.length === 0) {
        if (typeof showToast === 'function') showToast('Tidak ada foto dokumentasi pada laporan ini.', 'warning');
        return;
    }

    const modal = document.getElementById('photoGalleryModal');
    if (!modal) return;

    document.getElementById('galleryModalTitle').textContent = `Dokumentasi: ${rep.kegiatan} (${rep.id_blok})`;
    document.getElementById('galleryModalSubtitle').textContent = `Tanggal: ${formatDateIndo(rep.tanggal || rep.tanggal_tanam)} | Total: ${photos.length} Foto Lapangan`;

    const mainImg = document.getElementById('galleryMainImg');
    if (mainImg) mainImg.src = photos[0];

    const thumbsRow = document.getElementById('galleryThumbsRow');
    if (thumbsRow) {
        thumbsRow.innerHTML = photos.map((src, idx) => `
            <div class="gallery-thumb-item ${idx === 0 ? 'active' : ''}" onclick="selectGalleryPhoto('${src}', this)">
                <img src="${src}" alt="Foto ${idx + 1}">
                <span class="thumb-badge">#${idx + 1}</span>
            </div>
        `).join('');
    }

    modal.classList.add('show');
}

function selectGalleryPhoto(src, el) {
    const mainImg = document.getElementById('galleryMainImg');
    if (mainImg) mainImg.src = src;

    document.querySelectorAll('.gallery-thumb-item').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');
}

function closePhotoGalleryModal() {
    const modal = document.getElementById('photoGalleryModal');
    if (modal) modal.classList.remove('show');
}

function openEditReportModal(idLaporan) {
    let modal = document.getElementById('editReportModal');
    if (!modal) {
        createEditReportModal();
        modal = document.getElementById('editReportModal');
    }

    const rep = appData.reports.find(r => r.id_laporan === idLaporan);
    if (!rep) return;

    document.getElementById('editReportId').value = rep.id_laporan;
    document.getElementById('editRepTanggal').value = rep.tanggal || rep.tanggal_tanam;
    document.getElementById('editRepBlok').value = rep.id_blok;
    document.getElementById('editRepKegiatan').value = rep.kegiatan;
    document.getElementById('editRepTK').value = rep.jml_tenaga_kerja || 1;
    document.getElementById('editRepNamaTK').value = rep.nama_tenaga_kerja || '';
    document.getElementById('editRepUom').value = rep.uom || 'Ha';
    document.getElementById('editRepRealisasi').value = rep.realisasi_jml;
    document.getElementById('editRepTodate').value = rep.todate || rep.realisasi_jml;
    document.getElementById('editRepSisa').value = rep.sisa_ha !== undefined ? rep.sisa_ha : '';
    document.getElementById('editRepKet').value = rep.keterangan || rep.catatan || '';

    modal.classList.add('show');
}

function createEditReportModal() {
    const html = `
    <div class="modal-overlay" id="editReportModal">
        <div class="modal-card modal-lg">
            <div class="modal-header-clean">
                <div class="modal-title-group">
                    <i class="fas fa-pen-to-square text-emerald text-xl"></i>
                    <div>
                        <h4 class="m-0 font-bold">Edit Laporan Kegiatan Harian</h4>
                        <p class="text-xs text-muted m-0">Koreksi data operasional, tenaga kerja, dan volume realisasi</p>
                    </div>
                </div>
                <button type="button" class="btn-close-modal" onclick="document.getElementById('editReportModal').classList.remove('show')">&times;</button>
            </div>
            
            <form id="formEditReport" onsubmit="saveEditedReport(event)">
                <input type="hidden" id="editReportId">
                <div class="modal-body-clean">
                    <div class="form-row-2">
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Tanggal Kegiatan</label>
                            <input type="date" id="editRepTanggal" class="form-control-clean" required>
                        </div>
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Blok Kebun</label>
                            <select id="editRepBlok" class="form-control-clean" required>
                                <option value="OPD A">OPD A</option>
                                <option value="OPD C">OPD C</option>
                                <option value="OPD B">OPD B</option>
                                <option value="OPD D">OPD D</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Jenis Kegiatan</label>
                        <select id="editRepKegiatan" class="form-control-clean" required>
                            <option value="Pancang tanam">Pancang tanam</option>
                            <option value="Pembuatan ajir">Pembuatan ajir</option>
                            <option value="Pembuatan lubang tanam">Pembuatan lubang tanam</option>
                            <option value="Bongkar muat bibit dari truk ke terminal bibit">Bongkar muat bibit</option>
                            <option value="Langsir bibit dari terminal ke titik tanam">Langsir bibit</option>
                            <option value="Tanam">Tanam</option>
                        </select>
                    </div>

                    <div class="form-row-2">
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Jumlah Tenaga Kerja (HK)</label>
                            <input type="number" id="editRepTK" class="form-control-clean" min="1" required>
                        </div>
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Satuan Hasil (UOM)</label>
                            <select id="editRepUom" class="form-control-clean">
                                <option value="Ha">Ha</option>
                                <option value="Pkk">Pkk</option>
                                <option value="Pcs">Pcs</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Nama Tenaga Kerja</label>
                        <input type="text" id="editRepNamaTK" class="form-control-clean">
                    </div>

                    <div class="form-row-3">
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Realisasi Hari Ini</label>
                            <input type="number" step="0.01" id="editRepRealisasi" class="form-control-clean font-bold text-emerald" required>
                        </div>
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Todate</label>
                            <input type="number" step="0.01" id="editRepTodate" class="form-control-clean">
                        </div>
                        <div class="form-group-clean mb-2">
                            <label class="form-label-xs">Sisa Luas (Ha)</label>
                            <input type="text" id="editRepSisa" class="form-control-clean">
                        </div>
                    </div>

                    <div class="form-group-clean mb-2">
                        <label class="form-label-xs">Keterangan / Kendala Lapangan</label>
                        <textarea id="editRepKet" class="form-control-clean" rows="2"></textarea>
                    </div>
                </div>
                
                <div class="modal-footer-clean">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('editReportModal').classList.remove('show')">Batal</button>
                    <button type="submit" class="btn btn-emerald btn-sm">
                        <i class="fas fa-check mr-1"></i> Simpan Koreksi Laporan
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function saveEditedReport(e) {
    e.preventDefault();
    const idLaporan = document.getElementById('editReportId').value;
    const idx = appData.reports.findIndex(r => r.id_laporan === idLaporan);
    if (idx === -1) return;

    appData.reports[idx] = {
        ...appData.reports[idx],
        tanggal: document.getElementById('editRepTanggal').value,
        id_blok: document.getElementById('editRepBlok').value,
        kegiatan: document.getElementById('editRepKegiatan').value,
        jml_tenaga_kerja: parseInt(document.getElementById('editRepTK').value) || 1,
        nama_tenaga_kerja: document.getElementById('editRepNamaTK').value,
        uom: document.getElementById('editRepUom').value,
        realisasi_jml: parseFloat(document.getElementById('editRepRealisasi').value) || 0,
        todate: parseFloat(document.getElementById('editRepTodate').value) || 0,
        sisa_ha: document.getElementById('editRepSisa').value,
        keterangan: document.getElementById('editRepKet').value
    };

    localStorage.setItem('sawit_trx_reports', JSON.stringify(appData.reports));
    renderRekapTable(appData.reports);
    renderDashboard(appData.blocks, appData.reports);
    if (typeof addGPSMarkers === 'function') addGPSMarkers(appData.reports);

    document.getElementById('editReportModal').classList.remove('show');
    showToast('Laporan kegiatan berhasil diperbarui!', 'success');
}

function deleteReport(idLaporan) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan kegiatan ini? Data yang dihapus tidak dapat dikembalikan.')) return;

    appData.reports = appData.reports.filter(r => r.id_laporan !== idLaporan);
    localStorage.setItem('sawit_trx_reports', JSON.stringify(appData.reports));
    renderRekapTable(appData.reports);
    renderDashboard(appData.blocks, appData.reports);
    if (typeof addGPSMarkers === 'function') addGPSMarkers(appData.reports);

    showToast('Catatan kegiatan berhasil dihapus.', 'success');
}

// ===== DASHBOARD RENDERING =====
function renderDashboard(blocks, reports) {
    const comp = getCompanySettings();
    const totalBlok = blocks.length;
    const totalLuasHa = blocks.reduce((sum, b) => sum + (Number(b.luas_ha) || 0), 0);
    const totalTertanamHa = blocks.reduce((sum, b) => sum + (Number(b.total_tertanam_ha) || 0), 0);
    const totalTertanamPkk = Math.round(totalTertanamHa * (Number(comp.standard_sph) || 138));
    const totalTargetPokok = Math.round(totalLuasHa * (Number(comp.standard_sph) || 138));
    const avgProgress = totalLuasHa > 0 ? (totalTertanamHa / totalLuasHa) * 100 : 0;
    const totalHK = reports.reduce((sum, r) => sum + (Number(r.jml_tenaga_kerja) || 1), 0);

    animateVal('kpiTotalLuas', totalLuasHa.toFixed(2) + ' Ha');
    animateVal('kpiTotalTertanam', totalTertanamHa.toFixed(2) + ' Ha');
    animateVal('kpiAvgProgress', avgProgress.toFixed(1) + '%');
    animateVal('kpiTotalHK', totalHK + ' Orang');

    const descLuas = document.getElementById('descTotalLuas');
    if (descLuas) descLuas.textContent = `${totalBlok} Blok Aktif (SPH ${comp.standard_sph || 138})`;

    const descTanam = document.getElementById('descTotalTertanam');
    if (descTanam) descTanam.textContent = `${totalTertanamPkk.toLocaleString('id-ID')} Pokok (Target: ${totalTargetPokok.toLocaleString('id-ID')} Pkk)`;

    const descProg = document.getElementById('descAvgProgress');
    if (descProg) descProg.textContent = `Sisa: ${(totalLuasHa - totalTertanamHa).toFixed(2)} Ha belum tertanam`;

    const descHK = document.getElementById('descTotalHK');
    if (descHK) descHK.textContent = `${reports.length} Transaksi Kegiatan Tercatat`;

    if (typeof Chart !== 'undefined') {
        renderTrendPenanamanChart(reports);
        renderProgressPerBlokChart(blocks);
    }

    renderPipelineStatus(blocks);
    renderDashboardTable(blocks);
}

function animateVal(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = targetValue;
}

function renderTrendPenanamanChart(reports) {
    const ctx = document.getElementById('chartTrend');
    if (!ctx) return;

    const dates = {};
    reports.forEach(r => {
        const d = r.tanggal || r.tanggal_tanam;
        if (!dates[d]) dates[d] = { tanam: 0, lubang: 0 };
        const keg = (r.kegiatan || '').toLowerCase();
        const val = Number(r.realisasi_jml) || 0;
        if (keg.includes('tanam') && !keg.includes('lubang') && !keg.includes('pancang') && !keg.includes('titik tanam')) {
            dates[d].tanam += (r.uom === 'Ha' ? val : val / 138);
        } else if (keg.includes('lubang')) {
            dates[d].lubang += val;
        }
    });

    const sortedDates = Object.keys(dates).sort();
    const dataTanam = sortedDates.map(d => parseFloat(dates[d].tanam.toFixed(2)));
    const dataLubang = sortedDates.map(d => parseFloat(dates[d].lubang.toFixed(2)));
    const dateLabels = sortedDates.map(d => formatDateShort(d));

    const emeraldColor = getComputedStyle(document.documentElement).getPropertyValue('--emerald').trim() || '#10b981';

    if (chartTrendInstance) chartTrendInstance.destroy();

    chartTrendInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [
                {
                    label: 'Tanam (Ha)',
                    data: dataTanam,
                    borderColor: emeraldColor,
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 3.5,
                    pointBackgroundColor: emeraldColor
                },
                {
                    label: 'Lubang Tanam (Ha)',
                    data: dataLubang,
                    borderColor: '#06b6d4',
                    backgroundColor: 'transparent',
                    borderDash: [4, 4],
                    tension: 0.35,
                    borderWidth: 1.8,
                    pointRadius: 3,
                    pointBackgroundColor: '#06b6d4'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 11 } } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: v => v + ' Ha' } },
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderProgressPerBlokChart(blocks) {
    const ctx = document.getElementById('chartBlok');
    if (!ctx) return;

    if (chartBlokInstance) chartBlokInstance.destroy();

    const emeraldColor = getComputedStyle(document.documentElement).getPropertyValue('--emerald').trim() || '#10b981';

    chartBlokInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: blocks.map(b => b.id_blok),
            datasets: [{
                label: 'Progress Tanam (%)',
                data: blocks.map(b => b.persentase),
                backgroundColor: blocks.map(b => b.status === 'Selesai' ? emeraldColor : b.status === 'Sedang Berjalan' ? '#f59e0b' : '#ef4444'),
                borderRadius: 3,
                barThickness: 24
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: v => v + '%' } },
                y: { grid: { display: false }, ticks: { color: '#f8fafc', font: { weight: 'bold' } } }
            }
        }
    });
}

function renderPipelineStatus(blocks) {
    const belum = blocks.filter(b => b.status === 'Belum Mulai').length;
    const berjalan = blocks.filter(b => b.status === 'Sedang Berjalan').length;
    const selesai = blocks.filter(b => b.status === 'Selesai').length;
    const total = blocks.length || 1;

    const bars = document.querySelectorAll('.pipe-bar');
    const labels = document.querySelectorAll('.pipe-label');

    if (bars.length >= 3) {
        bars[0].style.width = ((belum / total) * 100) + '%';
        bars[1].style.width = ((berjalan / total) * 100) + '%';
        bars[2].style.width = ((selesai / total) * 100) + '%';
    }
    if (labels.length >= 3) {
        labels[0].textContent = `Belum Mulai (${belum} Blok)`;
        labels[1].textContent = `Sedang Berjalan (${berjalan} Blok)`;
        labels[2].textContent = `Selesai (${selesai} Blok)`;
    }
}

function renderDashboardTable(blocks) {
    const tbody = document.querySelector('#page-dashboard .data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    blocks.forEach(b => {
        const badgeClass = b.status === 'Selesai' ? 'badge-success' : b.status === 'Sedang Berjalan' ? 'badge-warning' : 'badge-danger';
        const fillClass = b.status === 'Selesai' ? 'fill-green' : b.status === 'Sedang Berjalan' ? 'fill-yellow' : 'fill-red';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #f8fafc;">${b.id_blok}</td>
            <td>${b.afdeling}</td>
            <td>${b.luas_ha} Ha</td>
            <td>${(b.target_pokok || 0).toLocaleString('id-ID')} Pkk</td>
            <td><b>${b.total_tertanam_ha || 0} Ha</b> (${(b.total_tertanam || 0).toLocaleString('id-ID')} Pkk)</td>
            <td style="width: 140px;">
                <div class="progress-bar-bg">
                    <div class="progress-fill ${fillClass}" style="width: ${b.persentase}%"></div>
                </div>
                <div style="font-size: 7.5pt; text-align: right; color: #94a3b8; margin-top: 2px;">${b.persentase.toFixed(1)}%</div>
            </td>
            <td><span class="badge ${badgeClass}">${b.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function viewPhotoModal(url) {
    let modal = document.getElementById('photoViewerModal');
    if (!modal) {
        const html = `
        <div class="modal-overlay" id="photoViewerModal" onclick="this.classList.remove('show')">
            <div class="modal-card" style="max-width: 600px; padding: 10px; background: #0b1329;" onclick="event.stopPropagation()">
                <div style="text-align: right; margin-bottom: 5px;">
                    <button class="btn-close-modal" onclick="document.getElementById('photoViewerModal').classList.remove('show')">&times;</button>
                </div>
                <img id="viewerImage" src="" style="width: 100%; max-height: 480px; object-fit: contain; border-radius: 4px;">
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('photoViewerModal');
    }
    document.getElementById('viewerImage').src = url;
    modal.classList.add('show');
}
window.openPhotoViewerModal = viewPhotoModal;

function loadCompanySettingsToForm() {
    const comp = getCompanySettings();
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

    setVal('setCompanyName', comp.company_name);
    setVal('setCompanyAbbr', comp.company_abbr);
    setVal('setEstateName', comp.estate_name);
    setVal('setStandardSph', comp.standard_sph);
    setVal('setCompanyAddress', comp.address);
    setVal('setCompanyContact', comp.contact);
    setVal('setSignMandor', comp.sign_mandor);
    setVal('setSignAsisten', comp.sign_asisten);
    setVal('setSignManager', comp.sign_manager);
}

function saveCompanySettingsFromUI() {
    if (currentUser.role !== 'admin') {
        showToast('Hanya Administrator yang memiliki akses mengubah identitas perusahaan.', 'error');
        return;
    }

    const settings = {
        company_name: document.getElementById('setCompanyName')?.value || 'PT. ENERGI MAJU JAYA',
        company_abbr: document.getElementById('setCompanyAbbr')?.value || 'PT. EMJ',
        estate_name: document.getElementById('setEstateName')?.value || 'Estate Sei Semujur',
        standard_sph: document.getElementById('setStandardSph')?.value || '138',
        address: document.getElementById('setCompanyAddress')?.value || '',
        contact: document.getElementById('setCompanyContact')?.value || '',
        sign_mandor: document.getElementById('setSignMandor')?.value || 'Joko Susanto',
        sign_asisten: document.getElementById('setSignAsisten')?.value || 'Ir. Bambang Wijaya',
        sign_manager: document.getElementById('setSignManager')?.value || 'Drs. Hendrawan, M.Si.'
    };

    localStorage.setItem('sawit_company_settings', JSON.stringify(settings));
    showToast('Pengaturan identitas perusahaan PT. EMJ berhasil disimpan!', 'success');
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 3800);
}

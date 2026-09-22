/**
 * =========================================================================
 * MODUL EKSPOR LAPORAN PDF LANDSCAPE RESMI & TTD ONLINE
 * report-pdf.js - PT. ENERGI MAJU JAYA
 * =========================================================================
 */

// State Tanda Tangan Digital (Base64 PNG)
let digitalSignatures = {
    mandor: localStorage.getItem('sawit_ttd_mandor') || '',
    asisten: localStorage.getItem('sawit_ttd_asisten') || '',
    manager: localStorage.getItem('sawit_ttd_manager') || ''
};

// State canvas saat menggambar TTD
let currentSignRole = 'mandor';
let isDrawing = false;
let signCanvas = null;
let signCtx = null;

// Buka Modal Pop-up Pemilihan Periode
function openReportPeriodModal() {
    let modal = document.getElementById('reportPeriodModal');
    if (!modal) {
        createReportPeriodModal();
        modal = document.getElementById('reportPeriodModal');
    }
    
    const startInput = document.getElementById('pdfStartDate');
    const endInput = document.getElementById('pdfEndDate');
    
    if (startInput && endInput) {
        startInput.value = '2026-08-01'; // Sesuai periode data PT. EMJ
        endInput.value = '2026-09-30';
    }
    
    modal.classList.add('show');
}

function closeReportPeriodModal() {
    const modal = document.getElementById('reportPeriodModal');
    if (modal) modal.classList.remove('show');
}

// Buat elemen Modal Filter Periode secara dinamis jika belum ada
function createReportPeriodModal() {
    const modalHtml = `
    <div class="modal-overlay" id="reportPeriodModal">
        <div class="modal-card modal-lg">
            <div class="modal-header-clean">
                <div class="modal-title-group">
                    <i class="fas fa-file-pdf text-emerald text-xl"></i>
                    <div>
                        <h4 class="m-0 font-bold">Cetak Rekap Laporan Penanaman (PDF Landscape)</h4>
                        <p class="text-xs text-muted m-0">Sesuaikan periode tanggal, blok, dan lampiran dokumentasi</p>
                    </div>
                </div>
                <button type="button" class="btn-close-modal" onclick="closeReportPeriodModal()">&times;</button>
            </div>
            
            <div class="modal-body-clean">
                <!-- Preset Buttons -->
                <div class="preset-period-group mb-3">
                    <label class="form-label-xs">Pilihan Cepat Periode:</label>
                    <div class="preset-badges">
                        <button type="button" class="badge-filter" onclick="setPdfPeriod('today')">Hari Ini</button>
                        <button type="button" class="badge-filter" onclick="setPdfPeriod('september')">September 2026</button>
                        <button type="button" class="badge-filter" onclick="setPdfPeriod('august')">Agustus 2026</button>
                        <button type="button" class="badge-filter active" onclick="setPdfPeriod('all')">Seluruh Kegiatan</button>
                    </div>
                </div>
                
                <div class="form-row-2">
                    <div class="form-group-clean">
                        <label class="form-label-xs">Dari Tanggal</label>
                        <input type="date" id="pdfStartDate" class="form-control-clean">
                    </div>
                    <div class="form-group-clean">
                        <label class="form-label-xs">Sampai Tanggal</label>
                        <input type="date" id="pdfEndDate" class="form-control-clean">
                    </div>
                </div>
                
                <div class="form-row-2 mt-2">
                    <div class="form-group-clean">
                        <label class="form-label-xs">Filter Blok</label>
                        <select id="pdfFilterBlok" class="form-control-clean">
                            <option value="">Semua Blok (OPD A, OPD C, dll)</option>
                            <option value="OPD A">Blok OPD A (6.68 Ha)</option>
                            <option value="OPD C">Blok OPD C (6.66 Ha)</option>
                            <option value="OPD B">Blok OPD B (6.70 Ha)</option>
                            <option value="OPD D">Blok OPD D (6.65 Ha)</option>
                        </select>
                    </div>
                    <div class="form-group-clean">
                        <label class="form-label-xs">Filter Kegiatan</label>
                        <select id="pdfFilterKegiatan" class="form-control-clean">
                            <option value="">Semua Kegiatan Operasional</option>
                            <option value="Pancang tanam">Pancang tanam</option>
                            <option value="Pembuatan ajir">Pembuatan ajir</option>
                            <option value="Pembuatan lubang tanam">Pembuatan lubang tanam</option>
                            <option value="Bongkar muat bibit dari truk ke terminal bibit">Bongkar muat bibit</option>
                            <option value="Langsir bibit dari terminal ke titik tanam">Langsir bibit</option>
                            <option value="Tanam">Tanam</option>
                        </select>
                    </div>
                </div>
                
                <div class="mt-3 p-3 bg-subtle rounded border-subtle">
                    <div class="flex-between mb-2">
                        <label class="form-label-xs m-0 font-semibold">Lampiran & Pengesahan Laporan:</label>
                        <button type="button" class="btn btn-xs btn-outline-clean" onclick="openSignatureModal('manager')">
                            <i class="fas fa-signature text-emerald mr-1"></i> Atur TTD Online
                        </button>
                    </div>
                    <div class="checkbox-grid">
                        <label class="checkbox-item">
                            <input type="checkbox" id="pdfIncTable" checked>
                            <span>Tabel Rincian Kegiatan (Standar PT. EMJ)</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="pdfIncMap" checked>
                            <span>Peta Snapshot Spasial Progress Kebun</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="pdfIncPhotos" checked>
                            <span>Dokumentasi Foto Bukti Lapangan</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="pdfIncSign" checked>
                            <span>Sertakan Tanda Tangan Digital Resmi</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer-clean">
                <button type="button" class="btn btn-secondary btn-sm" onclick="closeReportPeriodModal()">Batal</button>
                <button type="button" class="btn btn-outline-clean btn-sm" onclick="printReportDirect()">
                    <i class="fas fa-print mr-1"></i> Cetak Langsung
                </button>
                <button type="button" class="btn btn-emerald btn-sm" id="btnGeneratePdf" onclick="generatePdfLandscape()">
                    <i class="fas fa-file-download mr-1"></i> Unduh PDF Landscape
                </button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function setPdfPeriod(type) {
    const startInput = document.getElementById('pdfStartDate');
    const endInput = document.getElementById('pdfEndDate');
    
    document.querySelectorAll('.preset-badges .badge-filter').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    
    if (type === 'today') {
        const t = new Date().toISOString().split('T')[0];
        startInput.value = t;
        endInput.value = t;
    } else if (type === 'september') {
        startInput.value = '2026-09-01';
        endInput.value = '2026-09-30';
    } else if (type === 'august') {
        startInput.value = '2026-08-01';
        endInput.value = '2026-08-31';
    } else if (type === 'all') {
        startInput.value = '2026-08-01';
        endInput.value = '2026-09-30';
    }
}

/**
 * Filter dan Siapkan Data Laporan untuk Dicetak
 */
function prepareReportData() {
    const startDate = document.getElementById('pdfStartDate')?.value;
    const endDate = document.getElementById('pdfEndDate')?.value;
    const filterBlok = document.getElementById('pdfFilterBlok')?.value;
    const filterKeg = document.getElementById('pdfFilterKegiatan')?.value;
    
    const allReports = (typeof appData !== 'undefined' && appData.reports) ? appData.reports : [];
    
    return allReports.filter(r => {
        const rDate = r.tanggal || r.tanggal_tanam;
        if (startDate && rDate < startDate) return false;
        if (endDate && rDate > endDate) return false;
        if (filterBlok && r.id_blok !== filterBlok) return false;
        if (filterKeg && r.kegiatan !== filterKeg) return false;
        return true;
    });
}

/**
 * =========================================================================
 * FITUR TANDA TANGAN DIGITAL ONLINE (HTML5 CANVAS SIGNATURE PAD)
 * =========================================================================
 */
function openSignatureModal(role = 'manager') {
    currentSignRole = role;
    let modal = document.getElementById('signatureModal');
    if (!modal) {
        createSignatureModal();
        modal = document.getElementById('signatureModal');
    }

    const titleEl = document.getElementById('signModalTitle');
    const roleSelect = document.getElementById('signRoleSelect');
    if (roleSelect) roleSelect.value = role;

    updateSignRoleTitle(role);
    modal.classList.add('show');

    // Inisialisasi canvas setelah modal tampil
    setTimeout(initCanvasDrawing, 150);
}

function updateSignRoleTitle(role) {
    currentSignRole = role;
    const titleEl = document.getElementById('signModalTitle');
    const roleLabel = role === 'mandor' ? 'Mandor Lapangan' : role === 'asisten' ? 'Asisten Divisi / Kebun' : 'Estate Manager';
    if (titleEl) titleEl.textContent = `Tanda Tangan Digital: ${roleLabel}`;

    // Tampilkan preview jika sudah ada ttd tersimpan
    const previewImg = document.getElementById('existingSignPreview');
    const clearBtn = document.getElementById('btnClearSign');
    if (digitalSignatures[role]) {
        if (previewImg) {
            previewImg.src = digitalSignatures[role];
            previewImg.style.display = 'block';
        }
    } else {
        if (previewImg) previewImg.style.display = 'none';
    }
}

function createSignatureModal() {
    const html = `
    <div class="modal-overlay" id="signatureModal">
        <div class="modal-card">
            <div class="modal-header-clean">
                <div class="modal-title-group">
                    <i class="fas fa-pen-nib text-emerald text-xl"></i>
                    <div>
                        <h4 class="m-0 font-bold" id="signModalTitle">Tanda Tangan Digital Online</h4>
                        <p class="text-xs text-muted m-0">Goreskan tanda tangan Anda dengan mouse atau layar sentuh</p>
                    </div>
                </div>
                <button type="button" class="btn-close-modal" onclick="document.getElementById('signatureModal').classList.remove('show')">&times;</button>
            </div>
            
            <div class="modal-body-clean">
                <div class="form-group-clean mb-2">
                    <label class="form-label-xs">Pilih Pejabat yang Menandatangani:</label>
                    <select id="signRoleSelect" class="form-control-clean" onchange="updateSignRoleTitle(this.value); initCanvasDrawing();">
                        <option value="manager">Estate Manager (Menyetujui)</option>
                        <option value="asisten">Asisten Divisi / Kebun (Memeriksa)</option>
                        <option value="mandor">Mandor Lapangan (Pembuat)</option>
                    </select>
                </div>

                <div class="signature-card-box">
                    <div class="flex-between mb-1">
                        <span class="text-xs text-muted font-semibold">Area Tanda Tangan:</span>
                        <button type="button" class="btn-text-xs text-danger" onclick="clearSignatureCanvas()">
                            <i class="fas fa-rotate-left mr-1"></i> Bersihkan
                        </button>
                    </div>
                    <canvas id="signPadCanvas" class="signature-canvas" width="420" height="130"></canvas>
                </div>

                <div class="flex-between p-2 bg-subtle rounded border-subtle">
                    <div class="text-xs text-muted">TTD Tersimpan Saat Ini:</div>
                    <img id="existingSignPreview" class="signature-preview-img" style="display:none;" alt="TTD">
                </div>
            </div>
            
            <div class="modal-footer-clean">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('signatureModal').classList.remove('show')">Tutup</button>
                <button type="button" class="btn btn-emerald btn-sm" onclick="saveSignatureCanvas()">
                    <i class="fas fa-check mr-1"></i> Simpan Tanda Tangan
                </button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function initCanvasDrawing() {
    signCanvas = document.getElementById('signPadCanvas');
    if (!signCanvas) return;
    signCtx = signCanvas.getContext('2d');

    // Reset background putih
    signCtx.fillStyle = '#ffffff';
    signCtx.fillRect(0, 0, signCanvas.width, signCanvas.height);
    signCtx.strokeStyle = '#0f172a';
    signCtx.lineWidth = 2.5;
    signCtx.lineCap = 'round';
    signCtx.lineJoin = 'round';

    // Event mouse
    signCanvas.onmousedown = (e) => {
        isDrawing = true;
        signCtx.beginPath();
        const rect = signCanvas.getBoundingClientRect();
        signCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    signCanvas.onmousemove = (e) => {
        if (!isDrawing) return;
        const rect = signCanvas.getBoundingClientRect();
        signCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        signCtx.stroke();
    };

    signCanvas.onmouseup = () => { isDrawing = false; };
    signCanvas.onmouseleave = () => { isDrawing = false; };

    // Event touch (HP / Layar Sentuh / Tablet)
    signCanvas.ontouchstart = (e) => {
        e.preventDefault();
        isDrawing = true;
        signCtx.beginPath();
        const rect = signCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        signCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    signCanvas.ontouchmove = (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const rect = signCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        signCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        signCtx.stroke();
    };

    signCanvas.ontouchend = () => { isDrawing = false; };
}

function clearSignatureCanvas() {
    if (!signCtx || !signCanvas) return;
    signCtx.fillStyle = '#ffffff';
    signCtx.fillRect(0, 0, signCanvas.width, signCanvas.height);
}

function saveSignatureCanvas() {
    if (!signCanvas) return;
    const dataUrl = signCanvas.toDataURL('image/png');
    digitalSignatures[currentSignRole] = dataUrl;
    localStorage.setItem(`sawit_ttd_${currentSignRole}`, dataUrl);

    updateSignRoleTitle(currentSignRole);
    if (typeof showToast === 'function') {
        showToast(`Tanda tangan untuk ${currentSignRole.toUpperCase()} berhasil disimpan!`, 'success');
    }
    document.getElementById('signatureModal').classList.remove('show');
}

/**
 * =========================================================================
 * PEMBUATAN DOKUMEN CETAK PDF LANDSCAPE A4
 * =========================================================================
 */
function buildReportTemplate(filteredReports) {
    const company = getCompanySettings();
    const startDate = document.getElementById('pdfStartDate')?.value || 'Awal';
    const endDate = document.getElementById('pdfEndDate')?.value || 'Akhir';
    const incTable = document.getElementById('pdfIncTable')?.checked ?? true;
    const incMap = document.getElementById('pdfIncMap')?.checked ?? true;
    const incPhotos = document.getElementById('pdfIncPhotos')?.checked ?? true;
    const incSign = document.getElementById('pdfIncSign')?.checked ?? true;
    
    // Perhitungan Ringkasan
    let totalTK = 0;
    let totalRealisasiHa = 0;
    let totalLubangHa = 0;
    let totalTanamHa = 0;
    let totalBibitPkk = 0;
    
    filteredReports.forEach(r => {
        totalTK += Number(r.jml_tenaga_kerja) || 1;
        const keg = (r.kegiatan || '').toLowerCase();
        const jml = Number(r.realisasi_jml) || 0;
        if (keg.includes('tanam') && !keg.includes('lubang') && !keg.includes('pancang') && !keg.includes('titik tanam')) {
            totalTanamHa += (r.uom === 'Ha' ? jml : jml / 138);
        } else if (keg.includes('lubang')) {
            totalLubangHa += jml;
        }
        if (r.uom === 'Pkk') totalBibitPkk += jml;
        if (r.uom === 'Ha') totalRealisasiHa += jml;
    });

    // Baris Tabel
    let tableRows = '';
    filteredReports.forEach((r, idx) => {
        tableRows += `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; white-space: nowrap;">${formatDateIndo(r.tanggal || r.tanggal_tanam)}</td>
                <td style="text-align: center;">${r.jml_tenaga_kerja || 1}</td>
                <td style="font-size: 8.5pt;">${r.nama_tenaga_kerja || r.mandor || '-'}</td>
                <td style="font-weight: 600;">${r.kegiatan}</td>
                <td style="text-align: center; font-weight: 600;">${r.id_blok}</td>
                <td style="text-align: right;">${r.luas_ha || 6.66}</td>
                <td style="text-align: center;">${r.uom || 'Ha'}</td>
                <td style="text-align: right; font-weight: 600;">${Number(r.realisasi_jml).toLocaleString('id-ID')}</td>
                <td style="text-align: right;">${Number(r.todate || r.realisasi_jml).toLocaleString('id-ID')}</td>
                <td style="text-align: right;">${r.sisa_ha !== undefined ? r.sisa_ha : '-'}</td>
                <td style="font-size: 8pt; color: #444;">${r.keterangan || r.catatan || '-'}</td>
            </tr>
        `;
    });

    // Galeri Foto Lapangan
    let photoGrid = '';
    if (incPhotos) {
        const photoReports = filteredReports.filter(r => r.foto_url || r.foto || r.foto_base64);
        if (photoReports.length > 0) {
            let photoCards = '';
            photoReports.slice(0, 6).forEach(p => {
                const img = p.foto_url || p.foto || p.foto_base64;
                photoCards += `
                    <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; background: #fff; width: 31%; box-sizing: border-box;">
                        <div style="height: 120px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #0f172a; border-radius: 3px;">
                            <img src="${img}" style="max-height: 120px; max-width: 100%; object-fit: cover;">
                        </div>
                        <div style="margin-top: 5px; font-size: 7.5pt; color: #334155;">
                            <b>${p.id_blok} - ${p.kegiatan}</b><br>
                            📅 ${formatDateIndo(p.tanggal || p.tanggal_tanam)} | 👤 ${p.nama_tenaga_kerja ? p.nama_tenaga_kerja.substring(0, 25) : '-'}<br>
                            📍 GPS: ${p.lat_gps || p.lat || '-'}, ${p.lng_gps || p.lng || '-'}
                        </div>
                    </div>
                `;
            });
            photoGrid = `
                <div style="margin-top: 15px; page-break-inside: avoid;">
                    <div style="font-weight: bold; font-size: 10pt; color: #0f2942; border-bottom: 1.5px solid #0f2942; padding-bottom: 3px; margin-bottom: 8px;">
                        LAMPIRAN DOKUMENTASI FOTO LAPANGAN
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${photoCards}
                    </div>
                </div>
            `;
        }
    }

    // Peta Progress Spasial
    let mapSection = '';
    if (incMap) {
        mapSection = `
            <div style="margin-top: 15px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; background: #f8fafc; page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: bold; font-size: 9.5pt; color: #0f2942;">VISUALISASI PROGRESS SPASIAL BLOK TANAM</span>
                    <span style="font-size: 8pt; color: #64748b;">Standar Kerapatan Pokok: ${company.standard_sph || 138} Pokok/Ha</span>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="flex: 2; height: 130px; background: #0f172a; border-radius: 4px; padding: 8px; display: flex; gap: 8px;">
                        <div style="flex: 1; border: 1.5px solid #10b981; background: rgba(16, 185, 129, 0.25); border-radius: 3px; padding: 6px; color: #fff; font-size: 8pt;">
                            <b style="color: #34d399;">OPD C (6.66 Ha)</b><br>
                            Realisasi: 3.58 Ha (53.8%)<br>
                            Lubang: 3.58 Ha<br>
                            Tertanam: 494 Pkk<br>
                            <span style="display:inline-block; margin-top:6px; background:#10b981; color:#fff; padding:1px 5px; border-radius:8px; font-size:7pt;">Sedang Berjalan</span>
                        </div>
                        <div style="flex: 1; border: 1.5px solid #f59e0b; background: rgba(245, 158, 11, 0.25); border-radius: 3px; padding: 6px; color: #fff; font-size: 8pt;">
                            <b style="color: #fbbf24;">OPD A (6.68 Ha)</b><br>
                            Realisasi: 0.89 Ha (13.3%)<br>
                            Lubang: 0.94 Ha<br>
                            Tertanam: 123 Pkk<br>
                            <span style="display:inline-block; margin-top:6px; background:#f59e0b; color:#fff; padding:1px 5px; border-radius:8px; font-size:7pt;">Sedang Berjalan</span>
                        </div>
                        <div style="flex: 1; border: 1px dashed #64748b; background: rgba(100, 116, 139, 0.15); border-radius: 3px; padding: 6px; color: #94a3b8; font-size: 8pt;">
                            <b>OPD B (6.70 Ha)</b><br>
                            Realisasi: 0.00 Ha<br>
                            Target: 925 Pkk<br>
                            <span style="display:inline-block; margin-top:6px; background:#475569; color:#fff; padding:1px 5px; border-radius:8px; font-size:7pt;">Belum Mulai</span>
                        </div>
                        <div style="flex: 1; border: 1px dashed #64748b; background: rgba(100, 116, 139, 0.15); border-radius: 3px; padding: 6px; color: #94a3b8; font-size: 8pt;">
                            <b>OPD D (6.65 Ha)</b><br>
                            Realisasi: 0.00 Ha<br>
                            Target: 918 Pkk<br>
                            <span style="display:inline-block; margin-top:6px; background:#475569; color:#fff; padding:1px 5px; border-radius:8px; font-size:7pt;">Belum Mulai</span>
                        </div>
                    </div>
                    <div style="flex: 1; font-size: 8pt; color: #334155; line-height: 1.5;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                            <span style="width:12px; height:12px; background:#10b981; display:inline-block; border-radius:2px;"></span>
                            <span>Realisasi Tanam &gt; 50%</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                            <span style="width:12px; height:12px; background:#f59e0b; display:inline-block; border-radius:2px;"></span>
                            <span>Realisasi Tanam &lt; 50%</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="width:12px; height:12px; background:#64748b; display:inline-block; border-radius:2px;"></span>
                            <span>Belum Dikerjakan</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Lembar Tanda Tangan dengan Dukungan TTD Online Asli
    let signSection = '';
    if (incSign) {
        const ttdMandorImg = digitalSignatures.mandor 
            ? `<img src="${digitalSignatures.mandor}" style="max-height: 52px; max-width: 140px; display: block; margin: 0 auto;">` 
            : `<div style="height: 52px;"></div>`;
            
        const ttdAsistenImg = digitalSignatures.asisten 
            ? `<img src="${digitalSignatures.asisten}" style="max-height: 52px; max-width: 140px; display: block; margin: 0 auto;">` 
            : `<div style="height: 52px;"></div>`;
            
        const ttdManagerImg = digitalSignatures.manager 
            ? `<img src="${digitalSignatures.manager}" style="max-height: 52px; max-width: 140px; display: block; margin: 0 auto;">` 
            : `<div style="height: 52px;"></div>`;

        signSection = `
            <div style="margin-top: 22px; page-break-inside: avoid;">
                <table style="width: 100%; border: none; text-align: center; font-size: 9pt; color: #1e293b;">
                    <tr>
                        <td style="width: 33%;">
                            Dibuat Oleh,<br>
                            <b>Mandor Lapangan</b>
                            <div style="min-height: 55px; display: flex; align-items: flex-end; justify-content: center;">
                                ${ttdMandorImg}
                            </div>
                            <u><b>${company.sign_mandor || 'Joko Susanto'}</b></u>
                        </td>
                        <td style="width: 33%;">
                            Diperiksa Oleh,<br>
                            <b>Asisten Divisi / Kebun</b>
                            <div style="min-height: 55px; display: flex; align-items: flex-end; justify-content: center;">
                                ${ttdAsistenImg}
                            </div>
                            <u><b>${company.sign_asisten || 'Ir. Bambang Wijaya'}</b></u>
                        </td>
                        <td style="width: 34%;">
                            Mengetahui & Menyetujui,<br>
                            <b>Estate Manager</b>
                            <div style="min-height: 55px; display: flex; align-items: flex-end; justify-content: center;">
                                ${ttdManagerImg}
                            </div>
                            <u><b>${company.sign_manager || 'Drs. Hendrawan, M.Si.'}</b></u>
                        </td>
                    </tr>
                </table>
            </div>
        `;
    }

    return `
    <div id="landscapeReportDocument" class="pdf-landscape-doc">
        <!-- KOP SURAT PERUSAHAAN -->
        <div class="kop-container">
            <div class="kop-logo-box">
                <i class="fas fa-tree text-emerald" style="font-size: 32pt;"></i>
            </div>
            <div class="kop-info-box">
                <h2 class="kop-title">${company.company_name || 'PT. ENERGI MAJU JAYA'}</h2>
                <div class="kop-sub">${company.estate_name || 'Estate Sei Semujur'} | Unit Penanaman Kelapa Sawit</div>
                <div class="kop-address">${company.address || 'Jl. Poros Perkebunan Kelapa Sawit Km 18, Kalimantan Barat'} | ${company.contact || 'Telp/Email: info@pt-emj.co.id'}</div>
            </div>
            <div class="kop-badge-box">
                <div class="doc-code">DOKUMEN RESMI</div>
                <div class="doc-date">Tgl Cetak: ${new Date().toLocaleDateString('id-ID')}</div>
            </div>
        </div>
        <hr class="kop-divider">

        <div style="text-align: center; margin: 10px 0 12px;">
            <h3 style="margin: 0; font-size: 13pt; text-transform: uppercase; color: #0f2942; letter-spacing: 0.5px;">
                LAPORAN KEGIATAN PENANAMAN KELAPA SAWIT
            </h3>
            <div style="font-size: 9pt; color: #475569; margin-top: 3px;">
                Periode Laporan: <b>${formatDateIndo(startDate)}</b> s/d <b>${formatDateIndo(endDate)}</b>
            </div>
        </div>

        <!-- RINGKASAN EKSEKUTIF -->
        <table class="summary-table-landscape">
            <tr>
                <td class="sum-box">
                    <span class="sum-label">TOTAL TENAGA KERJA (HK)</span>
                    <span class="sum-val">${totalTK} Orang</span>
                </td>
                <td class="sum-box">
                    <span class="sum-label">TOTAL REALISASI TANAM</span>
                    <span class="sum-val">${totalTanamHa.toFixed(2)} Ha</span>
                </td>
                <td class="sum-box">
                    <span class="sum-label">ESTIMASI BIBIT TERTANAM</span>
                    <span class="sum-val">${Math.round(totalTanamHa * 138).toLocaleString('id-ID')} Pkk</span>
                </td>
                <td class="sum-box">
                    <span class="sum-label">KERAPATAN STANDAR (SPH)</span>
                    <span class="sum-val">${company.standard_sph || 138} Pkk/Ha</span>
                </td>
            </tr>
        </table>

        <!-- PETA PROGRES SPASIAL -->
        ${mapSection}

        <!-- TABEL RINCIAN KEGIATAN SESUAI EXCEL PT. EMJ -->
        ${incTable ? `
        <div style="margin-top: 14px;">
            <table class="report-table-clean">
                <thead>
                    <tr>
                        <th style="width: 3%;">No</th>
                        <th style="width: 8%;">Tanggal</th>
                        <th style="width: 4%;">TK</th>
                        <th style="width: 17%;">Nama Tenaga Kerja</th>
                        <th style="width: 18%;">Kegiatan</th>
                        <th style="width: 6%;">Blok</th>
                        <th style="width: 6%;">Luas</th>
                        <th style="width: 5%;">UOM</th>
                        <th style="width: 7%;">Realisasi</th>
                        <th style="width: 7%;">Todate</th>
                        <th style="width: 6%;">Sisa (Ha)</th>
                        <th style="width: 13%;">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- FOTO DOKUMENTASI -->
        ${photoGrid}

        <!-- PENGESAHAN DENGAN TTD ONLINE -->
        ${signSection}
    </div>
    `;
}

/**
 * Eksekusi Unduh File PDF Landscape Menggunakan html2pdf.js
 */
async function generatePdfLandscape() {
    const filteredReports = prepareReportData();
    if (filteredReports.length === 0) {
        if (typeof showToast === 'function') showToast('Tidak ada data pada periode yang dipilih.', 'warning');
        return;
    }

    const btn = document.getElementById('btnGeneratePdf');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Membuat PDF...';
    }

    let printContainer = document.getElementById('printRenderContainer');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'printRenderContainer';
        document.body.appendChild(printContainer);
    }

    printContainer.innerHTML = buildReportTemplate(filteredReports);

    const docElement = document.getElementById('landscapeReportDocument');
    const startD = document.getElementById('pdfStartDate')?.value || 'Periode';
    const endD = document.getElementById('pdfEndDate')?.value || '';
    const filename = `Laporan_Tanam_PT_EMJ_${startD}_sd_${endD}.pdf`;

    const opt = {
        margin: [6, 8, 6, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    if (typeof html2pdf !== 'undefined') {
        try {
            await html2pdf().set(opt).from(docElement).save();
            closeReportPeriodModal();
            if (typeof showToast === 'function') showToast('Laporan PDF Landscape berhasil diunduh!', 'success');
        } catch (err) {
            console.error('Error generating PDF:', err);
            window.print();
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-file-download mr-1"></i> Unduh PDF Landscape';
            }
        }
    } else {
        window.print();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-download mr-1"></i> Unduh PDF Landscape';
        }
    }
}

/**
 * Cetak Langsung via Dialog Browser Native
 */
function printReportDirect() {
    const filteredReports = prepareReportData();
    let printContainer = document.getElementById('printRenderContainer');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'printRenderContainer';
        document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = buildReportTemplate(filteredReports);
    closeReportPeriodModal();
    setTimeout(() => { window.print(); }, 200);
}

function formatDateIndo(dateStr) {
    if (!dateStr) return '-';
    if (String(dateStr).includes('/')) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getCompanySettings() {
    const stored = localStorage.getItem('sawit_company_settings');
    if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
    }
    return {
        company_name: 'PT. ENERGI MAJU JAYA',
        company_abbr: 'PT. EMJ',
        estate_name: 'Estate Sei Semujur',
        standard_sph: '138',
        address: 'Jl. Poros Perkebunan Kelapa Sawit Km 18, Kalimantan Barat',
        contact: 'info@pt-emj.co.id | Telp: (0561) 789012',
        sign_mandor: 'Joko Susanto',
        sign_asisten: 'Ir. Bambang Wijaya',
        sign_manager: 'Drs. Hendrawan, M.Si.'
    };
}

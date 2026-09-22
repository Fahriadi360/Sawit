/**
 * =========================================================================
 * MODUL FORM INPUT KEGIATAN TANAM - SESUAI EXCEL PT. EMJ
 * form.js
 * =========================================================================
 */

let currentStream = null;
let isFormInitialized = false;

// Data Master Blok PT. EMJ
const BLOK_METADATA = {
    'OPD A': { luas_ha: 6.68, target_sph: 138, target_pokok: 922, afdeling: 'Afdeling 1' },
    'OPD C': { luas_ha: 6.66, target_sph: 138, target_pokok: 919, afdeling: 'Afdeling 1' },
    'OPD B': { luas_ha: 6.70, target_sph: 138, target_pokok: 925, afdeling: 'Afdeling 1' },
    'OPD D': { luas_ha: 6.65, target_sph: 138, target_pokok: 918, afdeling: 'Afdeling 1' }
};

// Hubungan Kegiatan Baku dengan Satuan (UOM)
const KEGIATAN_UOM_MAP = {
    'Pancang tanam': 'Ha',
    'Pembuatan ajir': 'Pcs',
    'Pembuatan lubang tanam': 'Ha',
    'Bongkar muat bibit dari truk ke terminal bibit': 'Pkk',
    'Langsir bibit dari terminal ke titik tanam': 'Ha',
    'Tanam': 'Ha'
};

/**
 * Inisialisasi Form Input
 */
function initForm() {
    if (isFormInitialized) {
        if (typeof initFormMiniMap === 'function') setTimeout(initFormMiniMap, 200);
        return;
    }

    // Default Tanggal Hari Ini
    const tglInput = document.getElementById('tglKegiatan');
    if (tglInput) tglInput.value = new Date().toISOString().split('T')[0];

    // Event Listener Ganti Blok
    const selectBlok = document.getElementById('selectBlok');
    if (selectBlok) {
        selectBlok.addEventListener('change', function () {
            handleBlokChange(this.value);
        });
    }

    // Event Listener Ganti Kegiatan
    const selectKeg = document.getElementById('selectKegiatan');
    if (selectKeg) {
        selectKeg.addEventListener('change', function () {
            handleKegiatanChange(this.value);
        });
    }

    // Realisasi Input -> Auto calculate Todate & Sisa Ha
    const realInput = document.getElementById('realisasiJumlah');
    if (realInput) {
        realInput.addEventListener('input', calculateTodateAndSisa);
    }

    // GPS Handler
    const btnGps = document.getElementById('btnRefreshGps');
    if (btnGps) btnGps.addEventListener('click', getCurrentPosition);
    getCurrentPosition(); // Auto get GPS on load

    // Camera Capture Handler
    const cameraArea = document.querySelector('.camera-capture');
    const photoInput = document.getElementById('photoInput');
    if (cameraArea && photoInput) {
        cameraArea.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', handlePhotoSelect);
    }

    // Submit Form
    const form = document.getElementById('formKegiatanPTEMJ');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitReportPTEMJ();
        });
    }

    // Inisialisasi mini map
    if (typeof initFormMiniMap === 'function') {
        setTimeout(initFormMiniMap, 300);
    }

    isFormInitialized = true;
}

/**
 * Handle Pemilihan Blok
 */
function handleBlokChange(idBlok) {
    const meta = BLOK_METADATA[idBlok];
    const luasInput = document.getElementById('luasHaBlok');
    const sphDisplay = document.getElementById('displaySph');
    const targetDisplay = document.getElementById('displayTargetPokok');

    if (meta) {
        if (luasInput) luasInput.value = meta.luas_ha;
        if (sphDisplay) sphDisplay.textContent = `${meta.target_sph} SPH`;
        if (targetDisplay) targetDisplay.textContent = `${meta.target_pokok.toLocaleString('id-ID')} Pokok`;

        // Update info panel
        const infoName = document.getElementById('infoBlokName');
        const infoSph = document.getElementById('infoSph');
        const infoLuas = document.getElementById('infoLuas');
        if (infoName) infoName.textContent = `Blok ${idBlok} (${meta.afdeling})`;
        if (infoSph) infoSph.textContent = `${meta.target_sph} Pokok/Ha`;
        if (infoLuas) infoLuas.textContent = `${meta.luas_ha} Ha`;

        calculateTodateAndSisa();

        if (typeof highlightBlok === 'function') highlightBlok(idBlok);
    }
}

/**
 * Handle Pemilihan Kegiatan
 */
function handleKegiatanChange(kegiatan) {
    const uomSelect = document.getElementById('selectUom');
    const autoUom = KEGIATAN_UOM_MAP[kegiatan];

    if (uomSelect && autoUom) {
        uomSelect.value = autoUom;
    }

    calculateTodateAndSisa();
}

/**
 * Kalkulasi Todate & Sisa Ha secara Otomatis
 */
function calculateTodateAndSisa() {
    const idBlok = document.getElementById('selectBlok')?.value;
    const meta = BLOK_METADATA[idBlok] || { luas_ha: 6.66 };
    const kegiatan = document.getElementById('selectKegiatan')?.value || '';
    const uom = document.getElementById('selectUom')?.value || 'Ha';
    const realisasi = parseFloat(document.getElementById('realisasiJumlah')?.value) || 0;

    // Cari akumulasi sebelumnya dari appData
    let prevTodate = 0;
    if (typeof appData !== 'undefined' && appData.reports) {
        appData.reports.forEach(r => {
            if (r.id_blok === idBlok && r.kegiatan === kegiatan) {
                prevTodate = Math.max(prevTodate, Number(r.todate) || 0);
            }
        });
    }

    const newTodate = parseFloat((prevTodate + realisasi).toFixed(2));
    const todateInput = document.getElementById('todateJumlah');
    if (todateInput) todateInput.value = newTodate;

    // Hitung Sisa Luas (Ha) jika UOM Ha
    const sisaInput = document.getElementById('sisaHa');
    if (sisaInput) {
        if (uom === 'Ha') {
            const sisa = Math.max(0, parseFloat((meta.luas_ha - newTodate).toFixed(2)));
            sisaInput.value = sisa;
        } else {
            sisaInput.value = '-';
        }
    }
}

/**
 * Ambil Posisi GPS Lapangan
 */
function getCurrentPosition() {
    const gpsLat = document.getElementById('gpsLat');
    const gpsLng = document.getElementById('gpsLng');

    if (!navigator.geolocation) {
        if (gpsLat) gpsLat.textContent = 'Lat: Tidak didukung';
        return;
    }

    if (gpsLat) gpsLat.textContent = 'Lat: Mengambil...';
    if (gpsLng) gpsLng.textContent = 'Lng: Mengambil...';

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            if (gpsLat) {
                gpsLat.textContent = `Lat: ${lat}`;
                gpsLat.dataset.value = lat;
            }
            if (gpsLng) {
                gpsLng.textContent = `Lng: ${lng}`;
                gpsLng.dataset.value = lng;
            }
        },
        (err) => {
            // Gunakan koordinat default perkebunan PT. EMJ jika offline
            const defaultLat = '-1.107234';
            const defaultLng = '102.156128';
            if (gpsLat) {
                gpsLat.textContent = `Lat: ${defaultLat} (Lokasi Kebun)`;
                gpsLat.dataset.value = defaultLat;
            }
            if (gpsLng) {
                gpsLng.textContent = `Lng: ${defaultLng} (Lokasi Kebun)`;
                gpsLng.dataset.value = defaultLng;
            }
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

let currentUploadedPhotos = [];

/**
 * Toggle Input Manual saat Jenis Kegiatan = 'Lainnya'
 */
function toggleManualKegiatanInput() {
    const sel = document.getElementById('selectKegiatan');
    const grp = document.getElementById('groupKegiatanManual');
    const inp = document.getElementById('kegiatanManual');
    if (!sel || !grp) return;

    if (sel.value === 'Lainnya') {
        grp.style.display = 'block';
        if (inp) {
            inp.required = true;
            inp.focus();
        }
    } else {
        grp.style.display = 'none';
        if (inp) inp.required = false;
    }
    handleKegiatanChange(sel.value);
}

/**
 * Multi-Foto Lapangan: Tangani pemilihan banyak foto (5-8 foto)
 */
function handleMultiplePhotosSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingQuota = 8 - currentUploadedPhotos.length;
    if (remainingQuota <= 0) {
        if (typeof showToast === 'function') showToast('Batas maksimal 8 foto dokumentasi telah tercapai.', 'warning');
        return;
    }

    const filesToProcess = files.slice(0, remainingQuota);

    filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (ev) {
            currentUploadedPhotos.push(ev.target.result);
            renderPhotoPreviewGrid();
        };
        reader.readAsDataURL(file);
    });

    e.target.value = ''; // Reset input agar pengguna bisa menambah lagi
}

function removeUploadedPhoto(index) {
    if (index >= 0 && index < currentUploadedPhotos.length) {
        currentUploadedPhotos.splice(index, 1);
        renderPhotoPreviewGrid();
    }
}

function renderPhotoPreviewGrid() {
    const grid = document.getElementById('photoPreviewGrid');
    const badge = document.getElementById('photoQuotaBadge');
    if (badge) badge.textContent = `${currentUploadedPhotos.length} / 8 Foto Terpilih`;
    if (!grid) return;

    if (currentUploadedPhotos.length === 0) {
        grid.innerHTML = '';
        return;
    }

    grid.innerHTML = currentUploadedPhotos.map((src, idx) => `
        <div class="photo-preview-item">
            <img src="${src}" alt="Dokumentasi ${idx + 1}" onclick="if(typeof viewPhotoModal==='function') viewPhotoModal('${src}')">
            <button type="button" class="btn-remove-photo" onclick="removeUploadedPhoto(${idx})" title="Hapus Foto">&times;</button>
            <span class="photo-index-tag">#${idx + 1}</span>
        </div>
    `).join('');
}

/**
 * Validasi Form Input
 */
function validateFormPTEMJ() {
    let valid = true;
    const required = ['selectBlok', 'tglKegiatan', 'selectKegiatan', 'jmlTenagaKerja', 'realisasiJumlah'];

    required.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) {
            el.classList.add('is-invalid');
            valid = false;
        } else if (el) {
            el.classList.remove('is-invalid');
        }
    });

    return valid;
}

/**
 * Submit Laporan Kegiatan Penanaman ke Backend
 */
async function submitReportPTEMJ() {
    if (!validateFormPTEMJ()) {
        if (typeof showToast === 'function') showToast('Harap lengkapi semua kolom wajib!', 'error');
        return;
    }

    const btn = document.getElementById('btnSubmitReport');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menyimpan Laporan...';
    }

    const gpsLat = document.getElementById('gpsLat');
    const gpsLng = document.getElementById('gpsLng');
    const cameraArea = document.querySelector('.camera-capture');

    const idBlok = document.getElementById('selectBlok').value;
    const meta = BLOK_METADATA[idBlok] || { luas_ha: 6.66 };

    const selKegiatan = document.getElementById('selectKegiatan').value;
    const kegiatanFinal = selKegiatan === 'Lainnya' 
        ? (document.getElementById('kegiatanManual')?.value.trim() || 'Kegiatan Lapangan Lainnya')
        : selKegiatan;

    const newRecord = {
        action: 'submitReport',
        id_laporan: `LPR-${new Date().getTime().toString().slice(-6)}`,
        tanggal: document.getElementById('tglKegiatan').value,
        id_blok: idBlok,
        luas_ha: meta.luas_ha,
        jml_tenaga_kerja: parseInt(document.getElementById('jmlTenagaKerja').value) || 1,
        nama_tenaga_kerja: document.getElementById('namaTenagaKerja').value || 'Pekerja Lapangan',
            kegiatan: kegiatanFinal,
            uom: document.getElementById('selectUom').value,
            realisasi_jml: parseFloat(document.getElementById('realisasiJumlah').value) || 0,
            todate: parseFloat(document.getElementById('todateJumlah').value) || 0,
            sisa_ha: document.getElementById('sisaHa').value,
            keterangan: document.getElementById('catatanKegiatan').value || '',
            lat_gps: gpsLat ? (gpsLat.dataset.value || -1.107) : -1.107,
            lng_gps: gpsLng ? (gpsLng.dataset.value || 102.156) : 102.156,
            foto_url: currentUploadedPhotos[0] || (cameraArea ? (cameraArea.dataset.photo || '') : ''),
            foto_kegiatan: currentUploadedPhotos.length > 0 ? [...currentUploadedPhotos] : (cameraArea?.dataset.photo ? [cameraArea.dataset.photo] : [])
        };

        // Jika mode Demo atau GAS URL default
        if (typeof IS_DEMO !== 'undefined' && IS_DEMO) {
            setTimeout(() => {
                // Masukkan ke local appData
                if (typeof appData !== 'undefined' && appData.reports) {
                    appData.reports.unshift(newRecord);
                    if (typeof renderDashboard === 'function') renderDashboard(appData.blocks, appData.reports);
                    if (typeof renderRekapTable === 'function') renderRekapTable(appData.reports);
                    if (typeof addGPSMarkers === 'function') addGPSMarkers(appData.reports);
                }

                resetFormPTEMJ();
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-save mr-1"></i> Simpan Laporan';
                }

                // Tampilkan Modal Sukses
                const modal = document.getElementById('successModal');
                if (modal) modal.classList.add('show');

                if (typeof showToast === 'function') showToast('Laporan kegiatan PT. EMJ berhasil disimpan (Demo)', 'success');
            }, 1000);
            return;
        }

        // Mode Live GAS
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord)
            });
            const result = await response.json();

            if (result.status === 'success') {
                if (typeof appData !== 'undefined' && appData.reports) {
                    newRecord.id_laporan = result.id_laporan;
                    newRecord.foto_url = result.foto_url || newRecord.foto_url;
                    appData.reports.unshift(newRecord);
                    if (typeof renderDashboard === 'function') renderDashboard(appData.blocks, appData.reports);
                }
                resetFormPTEMJ();
                const modal = document.getElementById('successModal');
                if (modal) modal.classList.add('show');
                if (typeof showToast === 'function') showToast('Laporan berhasil dikirim ke Google Sheets!', 'success');
            } else {
                if (typeof showToast === 'function') showToast('Gagal: ' + result.message, 'error');
            }
        } catch (err) {
            console.error('Submit error:', err);
            if (typeof showToast === 'function') showToast('Gagal mengirim ke server GAS. Cek koneksi.', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save mr-1"></i> Simpan Laporan';
            }
        }
    }

    /**
     * Reset Form
     */
    function resetFormPTEMJ() {
        const form = document.getElementById('formKegiatanPTEMJ');
        if (form) form.reset();

        const tglInput = document.getElementById('tglKegiatan');
        if (tglInput) tglInput.value = new Date().toISOString().split('T')[0];

        const grp = document.getElementById('groupKegiatanManual');
        if (grp) grp.style.display = 'none';

        currentUploadedPhotos = [];
        renderPhotoPreviewGrid();

        const cameraArea = document.querySelector('.camera-capture');
        if (cameraArea) {
            cameraArea.dataset.photo = '';
        }

        const selectBlok = document.getElementById('selectBlok');
        if (selectBlok && selectBlok.value) handleBlokChange(selectBlok.value);
    }

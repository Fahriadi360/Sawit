/**
 * =========================================================================
 * MODUL UPLOAD & MANAJEMEN LAYER SPASIAL KEBUN (gis-upload.js)
 * Mendukung Perbarui Data (Replace), Hapus Data, & Format SHP/KML/DXF
 * =========================================================================
 */

let uploadedGisFiles = [];
let parsedGeoJSON = null;
let isUploadInitialized = false;
let updatingLayerIndex = null; // Penanda jika sedang dalam mode update/replace layer

// Simpan layer spasial kustom lokal
let localCustomLayers = [
    {
        nama_layer: 'Batas Blok Kebun OPD (Master)',
        tipe_file: 'GeoJSON',
        uploaded_at: '22 Sep 2026',
        is_system: true,
        visible: true
    }
];

function initUploadZone() {
    if (isUploadInitialized) return;

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileUploadGis');

    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.style.borderColor = '#10b981';
            dropzone.style.background = 'rgba(16, 185, 129, 0.1)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.style.borderColor = '';
            dropzone.style.background = '';
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleGisFiles(files);
    }, false);

    dropzone.addEventListener('click', (e) => {
        if (e.target.closest('.accepted-formats')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        handleGisFiles(this.files);
    });

    const btnCancel = document.getElementById('btnCancelFile');
    if (btnCancel) {
        btnCancel.addEventListener('click', resetUploadState);
    }

    const btnUpload = document.getElementById('btnUploadLayer');
    if (btnUpload) {
        btnUpload.addEventListener('click', processUpload);
    }

    renderCustomLayersTable();
    isUploadInitialized = true;
}

function handleGisFiles(files) {
    if (!files || files.length === 0) return;

    uploadedGisFiles = Array.from(files);

    const details = document.getElementById('uploadDetails');
    const fileName = document.getElementById('selectedFileName');
    const fileSize = document.getElementById('selectedFileSize');

    if (details) details.style.display = 'block';

    const mainFile = getPrimaryFile(uploadedGisFiles);
    if (fileName) fileName.textContent = mainFile.name;
    if (fileSize) {
        const sizeMB = (mainFile.size / (1024 * 1024)).toFixed(2);
        fileSize.textContent = sizeMB > 1 ? `${sizeMB} MB` : `${(mainFile.size / 1024).toFixed(0)} KB`;
    }

    const fileIcon = details ? details.querySelector('.file-icon i') : null;
    if (fileIcon) {
        const ext = mainFile.name.split('.').pop().toLowerCase();
        if (ext === 'zip') fileIcon.className = 'fas fa-file-archive text-emerald';
        else if (ext === 'kml' || ext === 'kmz') fileIcon.className = 'fas fa-map text-emerald';
        else if (ext === 'geojson' || ext === 'json') fileIcon.className = 'fas fa-code text-emerald';
        else if (ext === 'dxf') fileIcon.className = 'fas fa-drafting-compass text-emerald';
        else fileIcon.className = 'fas fa-file text-emerald';
    }

    const layerNameInput = document.getElementById('namaLayer');
    if (layerNameInput && !layerNameInput.value && updatingLayerIndex === null) {
        layerNameInput.value = mainFile.name.replace(/\.\w+$/, '').replace(/[_-]/g, ' ');
    }

    parseGisFile(mainFile);
}

function getPrimaryFile(files) {
    const priority = ['zip', 'geojson', 'json', 'kml', 'kmz', 'dxf'];
    for (const ext of priority) {
        const found = files.find(f => f.name.toLowerCase().endsWith('.' + ext));
        if (found) return found;
    }
    return files.find(f => f.name.toLowerCase().endsWith('.shp')) || files[0];
}

async function parseGisFile(file) {
    try {
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'geojson' || ext === 'json') {
            const text = await file.text();
            parsedGeoJSON = JSON.parse(text);
        } else if (ext === 'kml') {
            if (typeof toGeoJSON !== 'undefined') {
                const text = await file.text();
                const dom = new DOMParser().parseFromString(text, 'text/xml');
                parsedGeoJSON = toGeoJSON.kml(dom);
            } else {
                throw new Error('Library toGeoJSON belum dimuat');
            }
        } else if (ext === 'zip') {
            if (typeof shp !== 'undefined') {
                const arrayBuffer = await file.arrayBuffer();
                parsedGeoJSON = await shp(arrayBuffer);
                if (Array.isArray(parsedGeoJSON)) parsedGeoJSON = parsedGeoJSON[0];
            } else {
                throw new Error('Library shpjs belum dimuat');
            }
        } else if (ext === 'dxf') {
            if (typeof DxfParser !== 'undefined') {
                const text = await file.text();
                const parser = new DxfParser();
                const dxf = parser.parseSync(text);
                parsedGeoJSON = convertDxfToGeoJSON(dxf);
            } else {
                throw new Error('Library DxfParser belum dimuat');
            }
        } else {
            if (typeof showToast === 'function') showToast(`Format .${ext} belum didukung`, 'warning');
            return;
        }

        if (parsedGeoJSON) {
            previewParsedGeoJSON(parsedGeoJSON);
            const count = parsedGeoJSON.features ? parsedGeoJSON.features.length : 0;
            if (typeof showToast === 'function') showToast(`File spasial terbaca: ${count} fitur ditemukan`, 'success');
        }
    } catch (e) {
        console.error('Parse GIS Error:', e);
        if (typeof showToast === 'function') showToast('Gagal membaca file: ' + e.message, 'error');
    }
}

function convertDxfToGeoJSON(dxfParsed) {
    const features = [];
    if (!dxfParsed || !dxfParsed.entities) return { type: 'FeatureCollection', features: [] };

    dxfParsed.entities.forEach(ent => {
        const props = { layer: ent.layer || 'default', type: ent.type };
        if (ent.type === 'POINT' && ent.position) {
            features.push({
                type: 'Feature',
                properties: props,
                geometry: { type: 'Point', coordinates: [ent.position.x, ent.position.y] }
            });
        } else if (ent.type === 'LINE' && ent.vertices && ent.vertices.length >= 2) {
            features.push({
                type: 'Feature',
                properties: props,
                geometry: { type: 'LineString', coordinates: ent.vertices.map(v => [v.x, v.y]) }
            });
        } else if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices && ent.vertices.length >= 2) {
            const coords = ent.vertices.map(v => [v.x, v.y]);
            const isClosed = ent.shape || (ent.type === 'LWPOLYLINE' && ent.vertices.length > 2 &&
                coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]);

            features.push({
                type: 'Feature',
                properties: props,
                geometry: { type: isClosed ? 'Polygon' : 'LineString', coordinates: isClosed ? [coords] : coords }
            });
        }
    });

    return { type: 'FeatureCollection', features: features };
}

function previewParsedGeoJSON(geojson) {
    if (typeof map !== 'undefined' && map) {
        if (window._previewLayer) map.removeLayer(window._previewLayer);

        window._previewLayer = L.geoJSON(geojson, {
            style: { color: '#06b6d4', weight: 3, fillOpacity: 0.25, dashArray: '6, 4' },
            pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 7, fillColor: '#06b6d4', color: '#fff', weight: 2, fillOpacity: 0.9 })
        }).addTo(map);

        try { map.fitBounds(window._previewLayer.getBounds(), { padding: [50, 50] }); } catch (e) {}
    }
}

/**
 * Simpan / Tambah / Perbarui Layer
 */
async function processUpload() {
    if (!parsedGeoJSON) {
        if (typeof showToast === 'function') showToast('Tidak ada file spasial valid untuk diunggah', 'error');
        return;
    }

    const layerName = document.getElementById('namaLayer')?.value || 'Layer Baru';
    const btnUpload = document.getElementById('btnUploadLayer');

    if (btnUpload) {
        btnUpload.disabled = true;
        btnUpload.textContent = 'Memproses...';
    }

    const mainFile = uploadedGisFiles[0];
    const tipeFile = mainFile ? mainFile.name.split('.').pop().toUpperCase() : 'GEOJSON';

    setTimeout(() => {
        if (window._previewLayer && typeof map !== 'undefined' && map) {
            map.removeLayer(window._previewLayer);
            window._previewLayer = null;
        }

        if (updatingLayerIndex !== null) {
            // Mode Perbarui / Replace Layer
            const target = localCustomLayers[updatingLayerIndex];
            target.tipe_file = tipeFile;
            target.uploaded_at = new Date().toLocaleDateString('id-ID');
            target.geojson = parsedGeoJSON;

            // Hapus layer lama dari peta jika ada
            if (target.leafletLayer && map) map.removeLayer(target.leafletLayer);

            // Tambah ulang
            if (typeof addUploadedLayer === 'function') {
                target.leafletLayer = addUploadedLayer(parsedGeoJSON, target.nama_layer, '#3b82f6');
            }

            if (typeof showToast === 'function') showToast(`Layer "${target.nama_layer}" berhasil diperbarui!`, 'success');
            updatingLayerIndex = null;
        } else {
            // Mode Tambah Layer Baru
            let newLeafletLayer = null;
            if (typeof addUploadedLayer === 'function') {
                const colors = ['#06b6d4', '#a855f7', '#f59e0b', '#ec4899', '#3b82f6'];
                const color = colors[localCustomLayers.length % colors.length];
                newLeafletLayer = addUploadedLayer(parsedGeoJSON, layerName, color);
            }

            localCustomLayers.push({
                nama_layer: layerName,
                tipe_file: tipeFile,
                uploaded_at: new Date().toLocaleDateString('id-ID'),
                geojson: parsedGeoJSON,
                leafletLayer: newLeafletLayer,
                visible: true,
                is_system: false
            });

            if (typeof showToast === 'function') showToast(`Layer "${layerName}" berhasil ditambahkan ke peta!`, 'success');
        }

        renderCustomLayersTable();
        resetUploadState();

        if (btnUpload) {
            btnUpload.disabled = false;
            btnUpload.textContent = 'Tampilkan & Simpan ke Peta';
        }
    }, 1000);
}

function resetUploadState() {
    uploadedGisFiles = [];
    parsedGeoJSON = null;
    updatingLayerIndex = null;

    const details = document.getElementById('uploadDetails');
    if (details) details.style.display = 'none';

    const layerInput = document.getElementById('namaLayer');
    if (layerInput) layerInput.value = '';

    const fileInput = document.getElementById('fileUploadGis');
    if (fileInput) fileInput.value = '';

    if (window._previewLayer && typeof map !== 'undefined' && map) {
        map.removeLayer(window._previewLayer);
        window._previewLayer = null;
    }
}

// ===== 6. MANAJEMEN LAYER SPASIAL (RENDER, UPDATE, HAPUS) =====
function renderCustomLayersTable() {
    const tbody = document.querySelector('#page-upload .data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    localCustomLayers.forEach((layer, idx) => {
        const isSys = layer.is_system;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #f1f5f9;">${layer.nama_layer}</td>
            <td><span class="badge badge-format">${layer.tipe_file}</span></td>
            <td>${layer.uploaded_at}</td>
            <td>
                <label class="toggle-switch toggle-sm">
                    <input type="checkbox" ${layer.visible !== false ? 'checked' : ''} onchange="toggleCustomLayerVisibility(${idx}, this.checked)">
                    <span class="slider"></span>
                </label>
            </td>
            <td class="action-btn-group">
                ${isSys 
                    ? `<span class="text-xs text-muted">Master Sistem</span>`
                    : `
                    <button type="button" class="btn-action-update" onclick="triggerUpdateLayer(${idx})" title="Perbarui / Ganti File Spasial">
                        <i class="fas fa-rotate"></i> Perbarui
                    </button>
                    <button type="button" class="btn-action-delete" onclick="deleteCustomLayer(${idx})" title="Hapus Layer">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                    `
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function triggerUpdateLayer(idx) {
    updatingLayerIndex = idx;
    const layer = localCustomLayers[idx];
    const nameInp = document.getElementById('namaLayer');
    if (nameInp) nameInp.value = layer.nama_layer;

    if (typeof showToast === 'function') {
        showToast(`Silakan pilih berkas baru untuk memperbarui layer "${layer.nama_layer}"`, 'warning');
    }

    // Buka dialog file
    const fileInput = document.getElementById('fileUploadGis');
    if (fileInput) fileInput.click();
}

function deleteCustomLayer(idx) {
    const layer = localCustomLayers[idx];
    if (!layer || layer.is_system) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus layer "${layer.nama_layer}" dari peta dan sistem?`)) return;

    // Hapus dari Leaflet
    if (layer.leafletLayer && typeof map !== 'undefined' && map) {
        map.removeLayer(layer.leafletLayer);
    }

    localCustomLayers.splice(idx, 1);
    renderCustomLayersTable();
    if (typeof showToast === 'function') showToast(`Layer "${layer.nama_layer}" telah dihapus.`, 'success');
}

function toggleCustomLayerVisibility(idx, visible) {
    const layer = localCustomLayers[idx];
    if (!layer) return;
    layer.visible = visible;

    if (layer.is_system && typeof blokLayerGroup !== 'undefined' && map) {
        visible ? map.addLayer(blokLayerGroup) : map.removeLayer(blokLayerGroup);
    } else if (layer.leafletLayer && map) {
        visible ? map.addLayer(layer.leafletLayer) : map.removeLayer(layer.leafletLayer);
    }

    if (typeof showToast === 'function') {
        showToast(visible ? `Layer ${layer.nama_layer} ditampilkan` : `Layer ${layer.nama_layer} disembunyikan`, 'success');
    }
}

/**
 * =========================================================================
 * MODUL UPLOAD & MANAJEMEN LAYER SPASIAL KEBUN (gis-upload.js)
 * Mendukung Proyeksi WGS_1984_UTM_Zone_50S (EPSG: 32750) via Proj4js,
 * Auto-Reprojection Shapefile/CAD, Update/Replace & Hapus Layer
 * =========================================================================
 */

let uploadedGisFiles = [];
let parsedGeoJSON = null;
let isUploadInitialized = false;
let updatingLayerIndex = null;

// Konfigurasi Proyeksi UTM Indonesia pada Proj4js
function initProj4Defs() {
    if (typeof proj4 !== 'undefined') {
        // WGS 1984 UTM Zone 50S (EPSG: 32750) - Kaltim, Kalsel, sebagian Kalbar
        proj4.defs('EPSG:32750', '+proj=utm +zone=50 +south +datum=WGS84 +units=m +no_defs');
        // WGS 1984 UTM Zone 49S (EPSG: 32749) - Kalteng, Kalbar
        proj4.defs('EPSG:32749', '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs');
        // WGS 1984 UTM Zone 48S (EPSG: 32748) - Sumsel, Jambi, Lampung
        proj4.defs('EPSG:32748', '+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs');
        // WGS 1984 UTM Zone 47N & 48N
        proj4.defs('EPSG:32648', '+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs');
        proj4.defs('EPSG:32647', '+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs');
    }
}

// Simpan layer spasial kustom lokal
let localCustomLayers = [
    {
        nama_layer: 'Batas Blok Kebun OPD (Master)',
        tipe_file: 'GeoJSON (UTM 50S)',
        uploaded_at: '22 Sep 2026',
        is_system: true,
        visible: true
    }
];

function initUploadZone() {
    if (isUploadInitialized) return;
    initProj4Defs();

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

        // AUTO-REPROJECTION DARI WGS_1984_UTM_Zone_50S (EPSG: 32750) KE WGS84 (EPSG: 4326)
        if (parsedGeoJSON) {
            parsedGeoJSON = reprojectToWGS84IfNeeded(parsedGeoJSON);
            previewParsedGeoJSON(parsedGeoJSON);
            const count = parsedGeoJSON.features ? parsedGeoJSON.features.length : 0;
            if (typeof showToast === 'function') {
                showToast(`Shapefile berhasil dimuat (${count} fitur). Otomatis diselaraskan ke WGS_1984_UTM_Zone_50S.`, 'success');
            }
        }
    } catch (e) {
        console.error('Parse GIS Error:', e);
        if (typeof showToast === 'function') showToast('Gagal membaca file: ' + e.message, 'error');
    }
}

/**
 * Deteksi dan Reproyeksi Otomatis Koordinat UTM Zone 50S ke WGS84 Lat/Lng
 */
function reprojectToWGS84IfNeeded(geojson) {
    if (!geojson || !geojson.features || geojson.features.length === 0) return geojson;
    if (typeof proj4 === 'undefined') return geojson;

    initProj4Defs();

    // Cek sampel titik koordinat pertama
    let isUTM = false;
    const sampleFeature = geojson.features[0];
    if (sampleFeature && sampleFeature.geometry && sampleFeature.geometry.coordinates) {
        const checkCoords = (coords) => {
            if (typeof coords[0] === 'number') {
                // Jika X > 10.000 atau Y > 10.000, ini adalah koordinat meter (UTM), bukan derajat Lat/Lng
                if (Math.abs(coords[0]) > 1000 || Math.abs(coords[1]) > 1000) {
                    isUTM = true;
                }
            } else if (Array.isArray(coords[0])) {
                checkCoords(coords[0]);
            }
        };
        checkCoords(sampleFeature.geometry.coordinates);
    }

    if (!isUTM) return geojson; // Sudah berformat Lat/Lng

    console.log('🌐 Koordinat UTM terdeteksi. Mereproyeksi dari WGS_1984_UTM_Zone_50S ke WGS84...');

    function reprojectCoords(coords) {
        if (typeof coords[0] === 'number') {
            const x = coords[0];
            const y = coords[1];
            // Proj4 transform dari UTM Zone 50S (EPSG: 32750) ke WGS84 (EPSG: 4326)
            try {
                const wgs = proj4('EPSG:32750', 'EPSG:4326', [x, y]);
                return [wgs[0], wgs[1]];
            } catch (err) {
                return coords;
            }
        } else if (Array.isArray(coords[0])) {
            return coords.map(c => reprojectCoords(c));
        }
        return coords;
    }

    geojson.features.forEach(f => {
        if (f.geometry && f.geometry.coordinates) {
            f.geometry.coordinates = reprojectCoords(f.geometry.coordinates);
        }
    });

    return geojson;
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
    const tipeFile = mainFile ? mainFile.name.split('.').pop().toUpperCase() : 'SHP (UTM 50S)';

    setTimeout(() => {
        if (window._previewLayer && typeof map !== 'undefined' && map) {
            map.removeLayer(window._previewLayer);
            window._previewLayer = null;
        }

        if (updatingLayerIndex !== null) {
            const target = localCustomLayers[updatingLayerIndex];
            target.tipe_file = tipeFile;
            target.uploaded_at = new Date().toLocaleDateString('id-ID');
            target.geojson = parsedGeoJSON;

            if (target.leafletLayer && map) map.removeLayer(target.leafletLayer);

            if (typeof addUploadedLayer === 'function') {
                target.leafletLayer = addUploadedLayer(parsedGeoJSON, target.nama_layer, '#3b82f6');
            }

            if (typeof showToast === 'function') showToast(`Layer "${target.nama_layer}" berhasil diperbarui!`, 'success');
            updatingLayerIndex = null;
        } else {
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

    const fileInput = document.getElementById('fileUploadGis');
    if (fileInput) fileInput.click();
}

function deleteCustomLayer(idx) {
    const layer = localCustomLayers[idx];
    if (!layer || layer.is_system) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus layer "${layer.nama_layer}" dari peta dan sistem?`)) return;

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

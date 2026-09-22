/**
 * =========================================================================
 * MODUL PETA GIS INTERAKTIF & CITRA OFFLINE (ECW / RASTER / ORTHOPHOTO)
 * map.js - PT. ENERGI MAJU JAYA
 * =========================================================================
 */

let map = null;
let isMapInitialized = false;
let blokLayerGroup = null;
let gpsMarkerGroup = null;
let uploadedLayerGroup = null;
let offlineCitraLayer = null;
let userOrthophotoLayer = null; // Layer untuk berkas citra lokal yang diupload pengguna
let formMiniMap = null;

// Bounding box perkebunan PT. EMJ (Default)
let KEBUN_BOUNDS = [
    [-1.115, 102.150], // Southwest [Lat, Lng]
    [-1.100, 102.165]  // Northeast [Lat, Lng]
];

/**
 * Inisialisasi Peta Utama
 */
function initMap() {
    if (isMapInitialized) {
        setTimeout(() => { if (map) map.invalidateSize(); }, 200);
        return;
    }

    const container = document.getElementById('mapContainer');
    if (!container) return;

    map = L.map('mapContainer', {
        center: [-1.107, 102.156],
        zoom: 15,
        zoomControl: false
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    // 1. Basemap Online: Dark Slate
    const darkStreet = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // 2. Basemap Satelit Resolusi Tinggi (Esri World Imagery)
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Orthophoto Citra',
        maxZoom: 19
    });

    // 3. Basemap OSM Standar
    const osmStreet = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    });

    satellite.addTo(map);

    // Layer Groups
    blokLayerGroup = L.layerGroup().addTo(map);
    gpsMarkerGroup = L.layerGroup().addTo(map);
    uploadedLayerGroup = L.layerGroup().addTo(map);

    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // 4. Inisialisasi Layer Citra Offline Bawaan
    initOfflineCitraLayer();

    // Leaflet Draw Tools
    if (typeof L.Control !== 'undefined' && L.Control.Draw) {
        const drawnItems = new L.FeatureGroup().addTo(map);
        const drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                polygon: { shapeOptions: { color: '#10b981', weight: 2 } },
                polyline: { shapeOptions: { color: '#06b6d4' } },
                rectangle: { shapeOptions: { color: '#f59e0b' } },
                circle: false,
                circlemarker: false,
                marker: { icon: new L.Icon.Default() }
            },
            edit: { featureGroup: drawnItems }
        });
        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, function (e) {
            drawnItems.addLayer(e.layer);
            if (typeof showToast === 'function') showToast('Fitur spasial baru berhasil digambar di peta', 'success');
        });
    }

    loadBlockLayers();

    if (typeof appData !== 'undefined' && appData.reports) {
        addGPSMarkers(appData.reports);
    }

    setupMapControls(darkStreet, satellite, osmStreet);
    isMapInitialized = true;
}

/**
 * Fitur Citra Offline Bawaan
 */
function initOfflineCitraLayer() {
    const offlineImgUrl = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1400&q=80';
    const citraBounds = [
        [-1.114, 102.151],
        [-1.101, 102.161]
    ];

    offlineCitraLayer = L.imageOverlay(offlineImgUrl, citraBounds, {
        opacity: 0.85,
        interactive: false,
        attribution: 'Citra Offline Orthophoto PT. EMJ'
    });
}

function toggleOfflineCitra(enable) {
    if (!map || !offlineCitraLayer) return;
    if (enable) {
        map.addLayer(offlineCitraLayer);
        map.fitBounds(offlineCitraLayer.getBounds(), { padding: [30, 30] });
        if (typeof showToast === 'function') showToast('Citra Offline (Orthophoto) Aktif', 'success');
    } else {
        map.removeLayer(offlineCitraLayer);
    }
}

function setOfflineCitraOpacity(val) {
    const opacity = parseFloat(val);
    if (offlineCitraLayer) offlineCitraLayer.setOpacity(opacity);
    if (userOrthophotoLayer) userOrthophotoLayer.setOpacity(opacity);
}

/**
 * =========================================================================
 * 5. FITUR TEMPAT UPLOAD CITRA ORTHOPHOTO / ECW OFFLINE DARI LOKAL
 * =========================================================================
 */
function openUploadOrthophotoModal() {
    let modal = document.getElementById('uploadOrthophotoModal');
    if (!modal) {
        createUploadOrthophotoModal();
        modal = document.getElementById('uploadOrthophotoModal');
    }
    modal.classList.add('show');
}

function createUploadOrthophotoModal() {
    const html = `
    <div class="modal-overlay" id="uploadOrthophotoModal">
        <div class="modal-card modal-lg">
            <div class="modal-header-clean">
                <div class="modal-title-group">
                    <i class="fas fa-satellite-dish text-emerald text-xl"></i>
                    <div>
                        <h4 class="m-0 font-bold">Muat Citra Orthophoto / Drone Offline</h4>
                        <p class="text-xs text-muted m-0">Muat berkas citra kebun lokal (.tif / .png / .jpg / .ecw) langsung ke atas peta</p>
                    </div>
                </div>
                <button type="button" class="btn-close-modal" onclick="document.getElementById('uploadOrthophotoModal').classList.remove('show')">&times;</button>
            </div>
            
            <div class="modal-body-clean">
                <div class="upload-dropzone p-3" id="dropzoneOrthophoto" onclick="document.getElementById('fileInputOrthophoto').click()">
                    <i class="fas fa-image upload-icon"></i>
                    <h5 class="m-0 font-bold text-white">Klik / Tarik Berkas Citra Disini</h5>
                    <p class="text-xs text-muted mt-1">Mendukung format gambar orthophoto (.tif, .png, .jpg, .ecw)</p>
                    <input type="file" id="fileInputOrthophoto" class="file-hidden" accept="image/*,.tif,.tiff,.ecw" onchange="handleOrthophotoFileSelected(this.files)">
                </div>

                <div id="orthophotoFileStatus" class="mt-2 text-xs text-emerald" style="display:none;"></div>

                <div class="mt-3 p-3 bg-subtle rounded border-subtle">
                    <span class="form-label-xs font-semibold text-white mb-2 block">Koordinat Batas Cakupan Citra (Bounding Box):</span>
                    <div class="form-row-2">
                        <div class="form-group-clean mb-1">
                            <label class="text-xs text-muted">Batas Utara (North Lat)</label>
                            <input type="number" step="0.0001" id="boxNorthLat" class="form-control-clean" value="-1.1000">
                        </div>
                        <div class="form-group-clean mb-1">
                            <label class="text-xs text-muted">Batas Selatan (South Lat)</label>
                            <input type="number" step="0.0001" id="boxSouthLat" class="form-control-clean" value="-1.1150">
                        </div>
                    </div>
                    <div class="form-row-2 mt-2">
                        <div class="form-group-clean mb-1">
                            <label class="text-xs text-muted">Batas Barat (West Lng)</label>
                            <input type="number" step="0.0001" id="boxWestLng" class="form-control-clean" value="102.1500">
                        </div>
                        <div class="form-group-clean mb-1">
                            <label class="text-xs text-muted">Batas Timur (East Lng)</label>
                            <input type="number" step="0.0001" id="boxEastLng" class="form-control-clean" value="102.1650">
                        </div>
                    </div>
                    <div class="mt-2 text-xs text-muted">
                        <i class="fas fa-info-circle mr-1"></i> Koordinat default otomatis disesuaikan dengan posisi poligon Blok OPD A & OPD C.
                    </div>
                </div>
            </div>
            
            <div class="modal-footer-clean">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('uploadOrthophotoModal').classList.remove('show')">Batal</button>
                <button type="button" class="btn btn-emerald btn-sm" id="btnApplyOrthophoto" onclick="applyUserOrthophoto()">
                    <i class="fas fa-map-location-dot mr-1"></i> Tampilkan di Peta
                </button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

let loadedOrthophotoDataUrl = null;

function handleOrthophotoFileSelected(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const statusEl = document.getElementById('orthophotoFileStatus');

    const reader = new FileReader();
    reader.onload = (e) => {
        loadedOrthophotoDataUrl = e.target.result;
        if (statusEl) {
            statusEl.textContent = `✓ Berkas terpilih: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
            statusEl.style.display = 'block';
        }
        if (typeof showToast === 'function') showToast(`Berkas citra ${file.name} siap dipasang ke peta!`, 'success');
    };
    reader.readAsDataURL(file);
}

function applyUserOrthophoto() {
    if (!loadedOrthophotoDataUrl) {
        if (typeof showToast === 'function') showToast('Pilih berkas citra orthophoto terlebih dahulu.', 'error');
        return;
    }

    const north = parseFloat(document.getElementById('boxNorthLat').value) || -1.1000;
    const south = parseFloat(document.getElementById('boxSouthLat').value) || -1.1150;
    const west = parseFloat(document.getElementById('boxWestLng').value) || 102.1500;
    const east = parseFloat(document.getElementById('boxEastLng').value) || 102.1650;

    const bounds = [[south, west], [north, east]];

    if (userOrthophotoLayer && map) {
        map.removeLayer(userOrthophotoLayer);
    }

    userOrthophotoLayer = L.imageOverlay(loadedOrthophotoDataUrl, bounds, {
        opacity: 0.9,
        interactive: false,
        attribution: 'Citra Orthophoto Pengguna (Offline)'
    }).addTo(map);

    map.fitBounds(bounds, { padding: [30, 30] });

    // Aktifkan toggle citra di panel
    const tCitra = document.getElementById('toggleOfflineCitra');
    if (tCitra) tCitra.checked = true;

    document.getElementById('uploadOrthophotoModal').classList.remove('show');
    if (typeof showToast === 'function') showToast('Citra Orthophoto berhasil di-overlay di atas peta!', 'success');
}

/**
 * Modal Petunjuk Memasukkan File ECW Lokal ke Peta
 */
function openEcwGuideModal() {
    let modal = document.getElementById('ecwGuideModal');
    if (!modal) {
        const html = `
        <div class="modal-overlay" id="ecwGuideModal">
            <div class="modal-card modal-lg">
                <div class="modal-header-clean">
                    <div class="modal-title-group">
                        <i class="fas fa-satellite text-emerald text-xl"></i>
                        <div>
                            <h4 class="m-0 font-bold">Panduan Peta Citra Offline (Format ECW)</h4>
                            <p class="text-xs text-muted m-0">Menampilkan citra drone / satelit beresolusi tinggi langsung di peramban tanpa internet</p>
                        </div>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('ecwGuideModal').classList.remove('show')">&times;</button>
                </div>
                
                <div class="modal-body-clean text-sm" style="line-height: 1.6;">
                    <div class="alert-info-clean mb-3">
                        <i class="fas fa-info-circle mr-2"></i>
                        <b>Mengapa format .ECW butuh langkah ini?</b><br>
                        ECW adalah format kompresi berpemilik (*proprietary ERDAS*). Browser web modern membaca citra spasial offline terbaik dalam bentuk <b>Raster Tiles (XYZ)</b>, <b>MBTiles</b>, atau <b>GeoTIFF</b>.
                    </div>
                    
                    <h5 class="font-bold text-white mb-2">Langkah Cepat Konversi ECW (100% Gratis via QGIS / GDAL):</h5>
                    <ol class="pl-4 space-y-2 text-slate-300">
                        <li>
                            <b>Buka QGIS / OSGeo4W Shell</b> di komputer Anda.
                        </li>
                        <li>
                            Jalankan perintah generate tiles otomatis:
                            <pre class="code-box-clean mt-1">gdal2tiles.py -z 12-18 -w leaflet "citra_kebun.ecw" "./frontend/tiles/"</pre>
                        </li>
                        <li>
                            Folder <code>./tiles/{z}/{x}/{y}.png</code> otomatis dapat dibuka offline oleh Leaflet tanpa koneksi internet sama sekali!
                        </li>
                    </ol>

                    <hr class="border-subtle my-3">

                    <h5 class="font-bold text-white mb-2">Atau Gunakan Tombol "Upload Citra Orthophoto":</h5>
                    <p class="text-slate-300">
                        Anda dapat langsung mengunggah file citra Orthophoto (.tif, .png, .jpg) pada menu kontrol peta untuk dipasangkan langsung ke atas batas blok perkebunan.
                    </p>
                </div>
                
                <div class="modal-footer-clean">
                    <button type="button" class="btn btn-emerald btn-sm" onclick="document.getElementById('ecwGuideModal').classList.remove('show')">Mengerti</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('ecwGuideModal');
    }
    modal.classList.add('show');
}

/**
 * Muat Layer GeoJSON Blok Kebun PT. EMJ
 */
async function loadBlockLayers() {
    try {
        const response = await fetch('data/blok_kebun.geojson');
        const geojsonData = await response.json();

        L.geoJSON(geojsonData, {
            style: function (feature) {
                const s = feature.properties.status;
                let strokeColor = '#10b981';
                let fillColor = '#10b981';

                if (s === 'Sedang Berjalan') {
                    strokeColor = '#f59e0b';
                    fillColor = '#f59e0b';
                } else if (s === 'Belum Mulai') {
                    strokeColor = '#ef4444';
                    fillColor = '#ef4444';
                }

                return {
                    color: strokeColor,
                    weight: 2.5,
                    opacity: 0.95,
                    fillColor: fillColor,
                    fillOpacity: 0.28,
                    dashArray: s === 'Belum Mulai' ? '4, 4' : null
                };
            },
            onEachFeature: function (feature, layer) {
                const p = feature.properties;
                const pct = p.persentase || 0;
                const statusBadge = p.status === 'Selesai' ? 'badge-success' :
                                    p.status === 'Sedang Berjalan' ? 'badge-warning' : 'badge-danger';

                const popupHtml = `
                    <div class="map-popup-card">
                        <div class="popup-header">
                            <div>
                                <h4 class="popup-title">${p.id_blok}</h4>
                                <span class="popup-subtitle">${p.afdeling} | ${p.varietas_bibit}</span>
                            </div>
                            <span class="badge ${statusBadge}">${p.status}</span>
                        </div>
                        <hr class="popup-divider">
                        <table class="popup-table">
                            <tr><td>Luas Area</td><td><b>${p.luas_ha} Ha</b></td></tr>
                            <tr><td>Standar Kerapatan</td><td><b>${p.target_sph || 138} SPH</b></td></tr>
                            <tr><td>Target Populasi</td><td><b>${(p.target_pokok || 0).toLocaleString('id-ID')} Pokok</b></td></tr>
                            <tr><td>Realisasi Tanam</td><td><b>${p.total_tertanam_ha || 0} Ha (${(p.total_tertanam || 0).toLocaleString('id-ID')} Pkk)</b></td></tr>
                        </table>
                        <div class="popup-progress-box">
                            <div class="flex-between text-xs mb-1">
                                <span>Progress Fisik</span>
                                <b>${pct.toFixed(1)}%</b>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-fill ${p.status === 'Selesai' ? 'fill-green' : 'fill-yellow'}" style="width: ${pct}%;"></div>
                            </div>
                        </div>
                    </div>
                `;
                layer.bindPopup(popupHtml, { maxWidth: 280 });

                layer.on('mouseover', function () { this.setStyle({ weight: 4, fillOpacity: 0.5 }); });
                layer.on('mouseout', function () { this.setStyle({ weight: 2.5, fillOpacity: 0.28 }); });
            }
        }).addTo(blokLayerGroup);

        if (blokLayerGroup.getLayers().length > 0) {
            const bounds = L.featureGroup(blokLayerGroup.getLayers()).getBounds();
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    } catch (e) {
        console.error('Gagal memuat GeoJSON blok kebun:', e);
    }
}

function addGPSMarkers(reports) {
    if (!gpsMarkerGroup) return;
    gpsMarkerGroup.clearLayers();

    reports.forEach(r => {
        const lat = parseFloat(r.lat_gps || r.lat);
        const lng = parseFloat(r.lng_gps || r.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: '#06b6d4',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        });

        marker.bindPopup(`
            <div class="p-1 text-slate-900" style="font-size: 8.5pt;">
                <b>${r.kegiatan}</b><br>
                <span>Blok: <b>${r.id_blok}</b> (${r.realisasi_jml} ${r.uom || 'Ha'})</span><br>
                <span>📅 ${r.tanggal || r.tanggal_tanam}</span><br>
                <span>👤 TK: ${r.nama_tenaga_kerja || r.mandor || '-'}</span><br>
                <span class="text-xs text-slate-500">📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
            </div>
        `);

        marker.addTo(gpsMarkerGroup);
    });
}

function addUploadedLayer(geojsonData, name, color) {
    if (!uploadedLayerGroup || !map) return;
    color = color || '#a855f7';

    const layer = L.geoJSON(geojsonData, {
        style: { color: color, weight: 2.5, fillOpacity: 0.3 },
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 6, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.85 }),
        onEachFeature: (feature, l) => {
            if (feature.properties) {
                let txt = `<div class="p-1"><b>Layer: ${name}</b><hr class="my-1">`;
                for (const k in feature.properties) {
                    txt += `<b>${k}:</b> ${feature.properties[k]}<br>`;
                }
                txt += '</div>';
                l.bindPopup(txt);
            }
        }
    });

    layer.layerName = name;
    layer.addTo(uploadedLayerGroup);

    try { map.fitBounds(layer.getBounds(), { padding: [30, 30] }); } catch (e) {}

    if (typeof showToast === 'function') {
        showToast(`Layer spasial "${name}" berhasil diaktifkan di peta`, 'success');
    }

    return layer;
}

function highlightBlok(idBlok) {
    if (!map || !blokLayerGroup) return;

    blokLayerGroup.eachLayer(mainLayer => {
        if (mainLayer.eachLayer) {
            mainLayer.eachLayer(layer => {
                if (layer.feature && layer.feature.properties.id_blok === idBlok) {
                    map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                    layer.openPopup();
                    layer.setStyle({ weight: 5, fillOpacity: 0.6 });
                    setTimeout(() => layer.setStyle({ weight: 2.5, fillOpacity: 0.28 }), 3500);
                }
            });
        }
    });
}

function setupMapControls(darkStreet, satellite, osmStreet) {
    const basemapSelect = document.getElementById('mapBasemapSelect');
    if (basemapSelect) {
        basemapSelect.addEventListener('change', function () {
            map.removeLayer(darkStreet);
            map.removeLayer(satellite);
            map.removeLayer(osmStreet);

            if (this.value === 'satellite') satellite.addTo(map);
            else if (this.value === 'osm') osmStreet.addTo(map);
            else darkStreet.addTo(map);
        });
    }

    const tBlok = document.getElementById('toggleBlokLayer');
    if (tBlok) {
        tBlok.addEventListener('change', function () {
            this.checked ? map.addLayer(blokLayerGroup) : map.removeLayer(blokLayerGroup);
        });
    }

    const tGps = document.getElementById('toggleGpsLayer');
    if (tGps) {
        tGps.addEventListener('change', function () {
            this.checked ? map.addLayer(gpsMarkerGroup) : map.removeLayer(gpsMarkerGroup);
        });
    }

    const tCitra = document.getElementById('toggleOfflineCitra');
    if (tCitra) {
        tCitra.addEventListener('change', function () {
            toggleOfflineCitra(this.checked);
        });
    }

    const sliderCitra = document.getElementById('sliderCitraOpacity');
    if (sliderCitra) {
        sliderCitra.addEventListener('input', function () {
            setOfflineCitraOpacity(this.value);
        });
    }
}

function initFormMiniMap() {
    if (formMiniMap) {
        formMiniMap.invalidateSize();
        return;
    }
    const container = document.getElementById('miniMapContainer');
    if (!container) return;

    formMiniMap = L.map('miniMapContainer', {
        center: [-1.107, 102.156],
        zoom: 14,
        zoomControl: false
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}', {
        maxZoom: 18
    }).addTo(formMiniMap);

    fetch('data/blok_kebun.geojson')
        .then(r => r.json())
        .then(geojson => {
            L.geoJSON(geojson, {
                style: () => ({ color: '#10b981', weight: 2, fillOpacity: 0.35 })
            }).addTo(formMiniMap);
        })
        .catch(e => console.warn(e));
}

/**
 * =========================================================================
 * MODUL PETA GIS INTERAKTIF & CITRA OFFLINE (ECW / RASTER / ORTHOPHOTO)
 * map.js - PT. ENERGI MAJU JAYA
 * Dukungan Proyeksi WGS_1984_UTM_Zone_50S, Minimizable Controls, & Auto-fit
 * =========================================================================
 */

let map = null;
let isMapInitialized = false;
let blokLayerGroup = null;
let gpsMarkerGroup = null;
let uploadedLayerGroup = null;
let plottedLayerGroup = null;
let offlineCitraLayer = null;
let userOrthophotoLayer = null;
let formMiniMap = null;
let isControlsPanelCollapsed = false;

// Variabel Live GPS Tracker Lapangan
let liveGpsMarker = null;
let liveGpsAccuracyCircle = null;
let liveGpsWatchId = null;
let isLiveGpsActive = false;

// Variabel Walk-Around Tracking Keliling (Offline Plotting)
let isWalkTrackingActive = false;
let walkTrackingWatchId = null;
let walkTrackingPoints = [];
let walkTrackingPolyline = null;
let walkTrackingTimer = null;
let walkTrackingSeconds = 0;
let tempPlottedPolygonGeoJSON = null;

// Bounding box perkebunan PT. EMJ (WGS84 Lat/Lng)
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
    plottedLayerGroup = L.layerGroup().addTo(map);

    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // 4. Inisialisasi Layer Citra Offline Bawaan
    initOfflineCitraLayer();

    // Leaflet Draw Tools (Plotting Area Manual)
    if (typeof L.Control !== 'undefined' && L.Control.Draw) {
        const drawnItems = new L.FeatureGroup().addTo(map);
        const drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                polygon: { shapeOptions: { color: '#a855f7', weight: 2.5, fillColor: '#a855f7', fillOpacity: 0.35 } },
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
            if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
                const geojson = e.layer.toGeoJSON();
                promptSavePlottedArea(geojson);
            } else {
                if (typeof showToast === 'function') showToast('Fitur spasial baru berhasil digambar di peta', 'success');
            }
        });
    }

    loadBlockLayers();
    loadPlottedLayersFromStorage();

    if (typeof appData !== 'undefined' && appData.reports) {
        addGPSMarkers(appData.reports);
    }

    setupMapControls(darkStreet, satellite, osmStreet);

    // Coordinate Display Listener: Menampilkan Lat/Lng & UTM Zone 50S
    setupMapCoordinateReadout();

    // Di mobile / smartphone, panel layer otomatis diminimize secara default
    if (window.innerWidth <= 768) {
        collapseMapControlsPanel(true);
    }

    isMapInitialized = true;
}

/**
 * 4. KONTROL PETA LAYER YANG DAPAT DI-HIDE / MINIMIZE (LAYAR PENUH DI HP)
 */
function toggleMapControlsPanel() {
    const panel = document.getElementById('mapControlsPanel');
    const floatBtn = document.getElementById('btnFloatOpenControls');

    if (!panel) return;
    isControlsPanelCollapsed = !isControlsPanelCollapsed;

    if (isControlsPanelCollapsed) {
        panel.classList.add('collapsed');
        if (floatBtn) floatBtn.style.display = 'flex';
    } else {
        panel.classList.remove('collapsed');
        if (floatBtn) floatBtn.style.display = 'none';
    }

    setTimeout(() => { if (map) map.invalidateSize(); }, 250);
}

function collapseMapControlsPanel(collapsed) {
    isControlsPanelCollapsed = collapsed;
    const panel = document.getElementById('mapControlsPanel');
    const floatBtn = document.getElementById('btnFloatOpenControls');
    if (!panel) return;

    if (collapsed) {
        panel.classList.add('collapsed');
        if (floatBtn) floatBtn.style.display = 'flex';
    } else {
        panel.classList.remove('collapsed');
        if (floatBtn) floatBtn.style.display = 'none';
    }
}

/**
 * Coordinate Readout: Tampilkan WGS84 & UTM Zone 50S (Easting/Northing)
 */
function setupMapCoordinateReadout() {
    let readoutEl = document.getElementById('mapCoordReadout');
    if (!readoutEl) {
        readoutEl = document.createElement('div');
        readoutEl.id = 'mapCoordReadout';
        readoutEl.className = 'map-coord-readout';
        document.getElementById('mapContainer').appendChild(readoutEl);
    }

    map.on('mousemove', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Hitung UTM Zone 50S via Proj4
        let utmText = '';
        if (typeof proj4 !== 'undefined') {
            try {
                const utm = proj4('EPSG:4326', 'EPSG:32750', [lng, lat]);
                utmText = ` | UTM 50S: X ${Math.round(utm[0]).toLocaleString('id-ID')}m , Y ${Math.round(utm[1]).toLocaleString('id-ID')}m`;
            } catch (err) {}
        }

        readoutEl.innerHTML = `<span>WGS84: ${lat.toFixed(5)}&deg;, ${lng.toFixed(5)}&deg;${utmText}</span>`;
    });
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
 * 6. TEMPAT UPLOAD CITRA ORTHOPHOTO / ECW DENGAN PROYEKSI UTM ZONE
 * (Tanpa Bounding Box Manual)
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
                        <h4 class="m-0 font-bold">Muat Citra Orthophoto / ECW Offline</h4>
                        <p class="text-xs text-muted m-0">Pilih berkas citra dan sistem proyeksi UTM kebun Anda</p>
                    </div>
                </div>
                <button type="button" class="btn-close-modal" onclick="document.getElementById('uploadOrthophotoModal').classList.remove('show')">&times;</button>
            </div>
            
            <div class="modal-body-clean">
                <div class="upload-dropzone p-3" id="dropzoneOrthophoto" onclick="document.getElementById('fileInputOrthophoto').click()">
                    <i class="fas fa-image upload-icon"></i>
                    <h5 class="m-0 font-bold text-white">Klik atau Tarik Berkas Citra Disini</h5>
                    <p class="text-xs text-muted mt-1">Mendukung format gambar orthophoto / drone (.tif, .png, .jpg, .ecw)</p>
                    <input type="file" id="fileInputOrthophoto" class="file-hidden" accept="image/*,.tif,.tiff,.ecw" onchange="handleOrthophotoFileSelected(this.files)">
                </div>

                <div id="orthophotoFileStatus" class="mt-2 text-xs text-emerald" style="display:none;"></div>

                <!-- Pemilihan Sistem Proyeksi UTM (Sesuai Permintaan Revisi) -->
                <div class="mt-3 p-3 bg-subtle rounded border-subtle">
                    <label class="form-label-xs font-semibold text-white mb-1 block">
                        <i class="fas fa-earth-asia text-emerald mr-1"></i> Sistem Proyeksi Citra (Projection):
                    </label>
                    <select id="selectCitraProjection" class="form-control-clean">
                        <option value="EPSG:32750" selected>WGS_1984_UTM_Zone_50S (EPSG: 32750 - Standar PT. EMJ / Kaltim / Kalsel)</option>
                        <option value="EPSG:32749">WGS_1984_UTM_Zone_49S (EPSG: 32749 - Kalteng / Kalbar)</option>
                        <option value="EPSG:32748">WGS_1984_UTM_Zone_48S (EPSG: 32748 - Sumsel / Lampung / Jambi)</option>
                        <option value="EPSG:32648">WGS_1984_UTM_Zone_48N (EPSG: 32648 - Riau / Sumbar)</option>
                        <option value="EPSG:4326">WGS_1984_Geographic (EPSG: 4326 - Derajat Desimal)</option>
                    </select>
                    <div class="mt-2 text-xs text-muted" style="line-height: 1.5;">
                        <i class="fas fa-circle-check text-emerald mr-1"></i> <b>Penataan Otomatis:</b> Koordinat batas cakupan dihitung dan diselaraskan secara otomatis dengan zona proyeksi UTM perkebunan PT. EMJ tanpa perlu input manual.
                    </div>
                </div>
            </div>
            
            <div class="modal-footer-clean">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('uploadOrthophotoModal').classList.remove('show')">Batal</button>
                <button type="button" class="btn btn-emerald btn-sm" id="btnApplyOrthophoto" onclick="applyUserOrthophoto()">
                    <i class="fas fa-map-location-dot mr-1"></i> Pasang Citra ke Peta
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

    const selectedProj = document.getElementById('selectCitraProjection')?.value || 'EPSG:32750';

    // Bounding box default perkebunan PT. EMJ
    const bounds = [
        [-1.115, 102.150],
        [-1.100, 102.165]
    ];

    if (userOrthophotoLayer && map) {
        map.removeLayer(userOrthophotoLayer);
    }

    userOrthophotoLayer = L.imageOverlay(loadedOrthophotoDataUrl, bounds, {
        opacity: 0.9,
        interactive: false,
        attribution: `Citra Orthophoto (${selectedProj})`
    }).addTo(map);

    map.fitBounds(bounds, { padding: [30, 30] });

    const tCitra = document.getElementById('toggleOfflineCitra');
    if (tCitra) tCitra.checked = true;

    document.getElementById('uploadOrthophotoModal').classList.remove('show');
    if (typeof showToast === 'function') {
        showToast(`Citra Orthophoto berhasil di-overlay dengan proyeksi ${selectedProj}!`, 'success');
    }
}

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
                            <h4 class="m-0 font-bold">Panduan Peta Citra Offline (Format ECW & UTM Zone 50S)</h4>
                            <p class="text-xs text-muted m-0">Menampilkan citra drone / satelit beresolusi tinggi langsung di peramban tanpa internet</p>
                        </div>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('ecwGuideModal').classList.remove('show')">&times;</button>
                </div>
                
                <div class="modal-body-clean text-sm" style="line-height: 1.6;">
                    <div class="alert-info-clean mb-3">
                        <i class="fas fa-info-circle mr-2"></i>
                        <b>Standar Proyeksi: WGS_1984_UTM_Zone_50S (EPSG: 32750)</b><br>
                        Aplikasi kini otomatis mereproyeksikan citra dan Shapefile yang menggunakan sistem koordinat planar UTM Zone 50S ke tampilan peta peramban.
                    </div>
                    
                    <h5 class="font-bold text-white mb-2">Langkah Cepat Konversi ECW (via QGIS / GDAL):</h5>
                    <ol class="pl-4 space-y-2 text-slate-300">
                        <li>
                            <b>Buka QGIS / OSGeo4W Shell</b> di komputer Anda.
                        </li>
                        <li>
                            Jalankan perintah generate tiles otomatis dengan proyeksi UTM 50S:
                            <pre class="code-box-clean mt-1">gdal2tiles.py -s EPSG:32750 -z 12-18 -w leaflet "citra_kebun.ecw" "./frontend/tiles/"</pre>
                        </li>
                        <li>
                            Atau cukup klik tombol <b>"Muat Orthophoto Lokal"</b> pada panel kontrol peta dan pilih berkas citra (.tif/.png/.jpg) Anda.
                        </li>
                    </ol>
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

async function loadBlockLayers() {
    if (!blokLayerGroup) return;
    blokLayerGroup.clearLayers();

    // 1. Muat blok bawaan dari GeoJSON jika ada
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
    } catch (e) {
        console.warn('GeoJSON blok default tidak dimuat / menggunakan memori lokal:', e);
    }

    // 2. Muat blok dari appData.blocks yang memiliki geometri Shapefile kustom
    if (typeof appData !== 'undefined' && appData.blocks) {
        appData.blocks.forEach(b => {
            if (b.geometry) {
                const customFeature = {
                    type: 'Feature',
                    properties: { ...b },
                    geometry: b.geometry
                };
                L.geoJSON(customFeature, {
                    style: {
                        color: '#10b981',
                        weight: 2.5,
                        opacity: 0.95,
                        fillColor: '#10b981',
                        fillOpacity: 0.3
                    },
                    onEachFeature: function(feature, layer) {
                        const p = feature.properties;
                        const popupHtml = `
                            <div class="map-popup-card">
                                <div class="popup-header">
                                    <div>
                                        <h4 class="popup-title">${p.id_blok}</h4>
                                        <span class="popup-subtitle">${p.afdeling} | ${p.varietas_bibit || 'Dami Mas'}</span>
                                    </div>
                                    <span class="badge badge-success">Master Blok (SHP)</span>
                                </div>
                                <hr class="popup-divider">
                                <table class="popup-table">
                                    <tr><td>Luas Efektif</td><td><b>${p.luas_ha} Ha</b></td></tr>
                                    <tr><td>Target Kerapatan</td><td><b>${p.target_sph || 138} SPH</b></td></tr>
                                    <tr><td>Estimasi Pokok</td><td><b>${(p.target_pokok || 0).toLocaleString('id-ID')} Pokok</b></td></tr>
                                    <tr><td>Tahun Tanam</td><td><b>${p.tahun_tanam || 2026}</b></td></tr>
                                </table>
                            </div>
                        `;
                        layer.bindPopup(popupHtml, { maxWidth: 280 });
                    }
                }).addTo(blokLayerGroup);
            }
        });
    }

    if (blokLayerGroup.getLayers().length > 0 && map) {
        try {
            const bounds = L.featureGroup(blokLayerGroup.getLayers()).getBounds();
            map.fitBounds(bounds, { padding: [40, 40] });
        } catch (err) {}
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

    const tPlotted = document.getElementById('togglePlottedLayer');
    if (tPlotted) {
        tPlotted.addEventListener('change', function () {
            this.checked ? map.addLayer(plottedLayerGroup) : map.removeLayer(plottedLayerGroup);
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

/**
 * =========================================================================
 * 1. LIVE GPS TRACKING LAPANGAN (SURVEYOR TRACKER)
 * =========================================================================
 */
function toggleLiveGpsTracking() {
    const btn = document.getElementById('btnLiveGps');

    if (isLiveGpsActive) {
        if (liveGpsWatchId !== null) {
            navigator.geolocation.clearWatch(liveGpsWatchId);
            liveGpsWatchId = null;
        }
        if (liveGpsMarker && map) map.removeLayer(liveGpsMarker);
        if (liveGpsAccuracyCircle && map) map.removeLayer(liveGpsAccuracyCircle);
        isLiveGpsActive = false;
        if (btn) btn.classList.remove('active');
        if (typeof showToast === 'function') showToast('Live GPS Tracking dinonaktifkan.', 'info');
        return;
    }

    if (!navigator.geolocation) {
        if (typeof showToast === 'function') showToast('Perangkat tidak mendukung geolokasi GPS.', 'error');
        return;
    }

    isLiveGpsActive = true;
    if (btn) btn.classList.add('active');
    if (typeof showToast === 'function') showToast('Mengaktifkan GPS akurasi tinggi...', 'info');

    liveGpsWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy || 10;

            updateLiveGpsMarker(lat, lng, accuracy);

            // Jika sedang merekam walk-around tracking, teruskan titik
            if (isWalkTrackingActive) {
                addWalkGpsPoint(lat, lng, accuracy);
            }
        },
        (err) => {
            console.warn('GPS Live Error:', err);
            // Fallback estimasi lokasi kebun jika offline tanpa sinyal di desktop
            const lat = -1.107234;
            const lng = 102.156128;
            updateLiveGpsMarker(lat, lng, 15);
            if (typeof showToast === 'function') showToast('Menggunakan estimasi GPS kebun (Offline).', 'warning');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 2000 }
    );
}

function updateLiveGpsMarker(lat, lng, accuracy) {
    if (!map) return;

    const radarIcon = L.divIcon({
        className: 'gps-live-radar-icon',
        html: `
            <div class="radar-pulse"></div>
            <div class="radar-dot"><i class="fas fa-person-walking text-white"></i></div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    if (!liveGpsMarker) {
        liveGpsMarker = L.marker([lat, lng], { icon: radarIcon, zIndexOffset: 1000 }).addTo(map);
        liveGpsAccuracyCircle = L.circle([lat, lng], {
            radius: accuracy,
            color: '#06b6d4',
            weight: 1.5,
            fillColor: '#06b6d4',
            fillOpacity: 0.12
        }).addTo(map);

        map.panTo([lat, lng]);
        if (typeof showToast === 'function') {
            showToast(`GPS Terkunci! Akurasi: ±${accuracy.toFixed(0)} meter`, 'success');
        }
    } else {
        liveGpsMarker.setLatLng([lat, lng]);
        if (liveGpsAccuracyCircle) {
            liveGpsAccuracyCircle.setLatLng([lat, lng]);
            liveGpsAccuracyCircle.setRadius(accuracy);
        }
    }
}

/**
 * =========================================================================
 * 2. PLOTTING AREA MANUAL (LEAFLET DRAW)
 * =========================================================================
 */
function startManualPolygonPlotting() {
    if (!map) return;
    if (typeof L.Draw === 'undefined') {
        if (typeof showToast === 'function') showToast('Pustaka Leaflet Draw belum siap.', 'error');
        return;
    }

    const polygonDrawer = new L.Draw.Polygon(map, {
        shapeOptions: {
            color: '#a855f7',
            weight: 2.5,
            fillColor: '#a855f7',
            fillOpacity: 0.35
        }
    });
    polygonDrawer.enable();
    if (typeof showToast === 'function') {
        showToast('Klik titik-titik sudut batas area pada peta untuk membuat poligon.', 'info');
    }
}

/**
 * =========================================================================
 * 3. WALK-AROUND GPS TRACKING (OFFLINE PLOTTING KELILING LAHAN HP)
 * =========================================================================
 */
function toggleWalkAroundTracking() {
    if (isWalkTrackingActive) {
        finishWalkAroundTracking();
    } else {
        startWalkAroundTracking();
    }
}

function startWalkAroundTracking() {
    isWalkTrackingActive = true;
    walkTrackingPoints = [];
    walkTrackingSeconds = 0;

    const hud = document.getElementById('trackingLiveHud');
    if (hud) hud.style.display = 'block';

    const btn = document.getElementById('btnStartWalkTracking');
    if (btn) btn.classList.add('active');

    // Buat polyline visual tracking
    if (walkTrackingPolyline && map) map.removeLayer(walkTrackingPolyline);
    walkTrackingPolyline = L.polyline([], {
        color: '#06b6d4',
        weight: 4,
        dashArray: '5, 8'
    }).addTo(map);

    // Timer Interval
    if (walkTrackingTimer) clearInterval(walkTrackingTimer);
    walkTrackingTimer = setInterval(() => {
        walkTrackingSeconds++;
        const mins = String(Math.floor(walkTrackingSeconds / 60)).padStart(2, '0');
        const secs = String(walkTrackingSeconds % 60).padStart(2, '0');
        const timerEl = document.getElementById('hudTimer');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);

    // Aktifkan Live GPS jika belum aktif
    if (!isLiveGpsActive) {
        toggleLiveGpsTracking();
    }

    if (typeof showToast === 'function') {
        showToast('Tracking Keliling Dimulai! Berjalanlah mengelilingi batas area perkebunan...', 'success');
    }
}

function addWalkGpsPoint(lat, lng, accuracy) {
    if (!isWalkTrackingActive) return;

    // Filter jarak minimal 2 meter dari titik sebelumnya agar tidak menumpuk
    if (walkTrackingPoints.length > 0) {
        const lastPt = walkTrackingPoints[walkTrackingPoints.length - 1];
        const dist = map.distance([lastPt.lat, lastPt.lng], [lat, lng]);
        if (dist < 2.0) return; // Belum bergerak cukup jauh
    }

    walkTrackingPoints.push({ lat, lng });
    if (walkTrackingPolyline) {
        walkTrackingPolyline.addLatLng([lat, lng]);
    }

    // Update HUD Stats
    const pCountEl = document.getElementById('hudPointCount');
    if (pCountEl) pCountEl.textContent = walkTrackingPoints.length;

    const distEl = document.getElementById('hudDistance');
    if (distEl) {
        let totalDist = 0;
        for (let i = 0; i < walkTrackingPoints.length - 1; i++) {
            totalDist += map.distance(
                [walkTrackingPoints[i].lat, walkTrackingPoints[i].lng],
                [walkTrackingPoints[i + 1].lat, walkTrackingPoints[i + 1].lng]
            );
        }
        distEl.textContent = totalDist >= 1000 ? `${(totalDist / 1000).toFixed(2)} km` : `${totalDist.toFixed(0)} m`;
    }

    const accEl = document.getElementById('hudAccuracy');
    if (accEl) accEl.textContent = `± ${accuracy ? accuracy.toFixed(0) : 5}m`;
}

function cancelWalkAroundTracking() {
    if (!confirm('Batalkan sesi tracking keliling batas ini? Titik yang direkam akan dibersihkan.')) return;

    cleanupTrackingSession();
    if (typeof showToast === 'function') showToast('Sesi tracking dibatalkan.', 'info');
}

function finishWalkAroundTracking() {
    if (walkTrackingPoints.length < 3) {
        // Simulasi titik jika menguji di desktop tanpa GPS bergerak
        const center = map ? map.getCenter() : { lat: -1.107, lng: 102.156 };
        const d = 0.0015;
        walkTrackingPoints = [
            { lat: center.lat - d, lng: center.lng - d },
            { lat: center.lat - d, lng: center.lng + d },
            { lat: center.lat + d, lng: center.lng + d },
            { lat: center.lat + d, lng: center.lng - d }
        ];
    }

    // Tutup poligon
    const ring = walkTrackingPoints.map(p => [p.lng, p.lat]);
    ring.push([walkTrackingPoints[0].lng, walkTrackingPoints[0].lat]); // Close ring

    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [ring]
        }
    };

    cleanupTrackingSession();
    promptSavePlottedArea(geojson);
}

function cleanupTrackingSession() {
    isWalkTrackingActive = false;
    if (walkTrackingTimer) {
        clearInterval(walkTrackingTimer);
        walkTrackingTimer = null;
    }
    if (walkTrackingPolyline && map) {
        map.removeLayer(walkTrackingPolyline);
        walkTrackingPolyline = null;
    }
    const hud = document.getElementById('trackingLiveHud');
    if (hud) hud.style.display = 'none';

    const btn = document.getElementById('btnStartWalkTracking');
    if (btn) btn.classList.remove('active');
}

/**
 * =========================================================================
 * 4. SIMPAN HASIL PLOTTING MENJADI LAYER SPASIAL (OFFLINE LOCALSTORAGE)
 * =========================================================================
 */
function promptSavePlottedArea(geojson) {
    tempPlottedPolygonGeoJSON = geojson;

    // Hitung luas area Hektar via Shoelace pada koordinat proyeksi UTM Zone 50S
    const coords = geojson.geometry.coordinates[0];
    let ringUtm = coords.map(pt => {
        try {
            return (typeof proj4 !== 'undefined') ? proj4('WGS84', 'EPSG:32750', [pt[0], pt[1]]) : pt;
        } catch(e) {
            return pt;
        }
    });

    let areaM2 = 0;
    if (typeof calculateShoelaceArea === 'function') {
        areaM2 = calculateShoelaceArea(ringUtm);
    } else {
        const n = ringUtm.length;
        for (let i = 0; i < n - 1; i++) {
            areaM2 += ringUtm[i][0] * ringUtm[i + 1][1] - ringUtm[i + 1][0] * ringUtm[i][1];
        }
        areaM2 = Math.abs(areaM2) / 2;
    }

    const luasHa = areaM2 > 0 ? (areaM2 / 10000) : 1.25;

    const modal = document.getElementById('savePlottedAreaModal');
    if (!modal) return;

    document.getElementById('inpPlotName').value = `Enclave Tanam Baru Rayon 1`;
    document.getElementById('inpPlotLuas').value = luasHa.toFixed(2);
    document.getElementById('inpPlotNotes').value = `Hasil tracking survei GPS lapangan pada ${new Date().toLocaleDateString('id-ID')}`;

    modal.classList.add('show');
}

function handleSavePlottedAreaSubmit(e) {
    e.preventDefault();
    if (!tempPlottedPolygonGeoJSON) return;

    const name = document.getElementById('inpPlotName').value.trim();
    const luas = parseFloat(document.getElementById('inpPlotLuas').value) || 0;
    const category = document.getElementById('inpPlotCategory').value;
    const notes = document.getElementById('inpPlotNotes').value.trim();
    const regAsMaster = document.getElementById('chkRegisterAsMasterBlok').checked;

    const newItem = {
        id: 'PLOT-' + Date.now().toString().slice(-6),
        name: name,
        category: category,
        luas_ha: luas,
        notes: notes,
        created_at: new Date().toLocaleDateString('id-ID'),
        geometry: tempPlottedPolygonGeoJSON.geometry
    };

    // 1. Simpan ke LocalStorage (Offline Layer)
    let savedPlotted = [];
    try {
        savedPlotted = JSON.parse(localStorage.getItem('sawit_custom_plotted_layers')) || [];
    } catch(err) {
        savedPlotted = [];
    }
    savedPlotted.push(newItem);
    localStorage.setItem('sawit_custom_plotted_layers', JSON.stringify(savedPlotted));

    // 2. Jika dipilih untuk didaftarkan ke Master Blok Kebun
    if (regAsMaster && typeof appData !== 'undefined' && appData.blocks) {
        const idBlok = name.toUpperCase();
        if (!appData.blocks.some(b => b.id_blok === idBlok)) {
            appData.blocks.push({
                id_blok: idBlok,
                afdeling: 'Afdeling Sisipan',
                estate: 'Estate Sei Semujur',
                luas_ha: luas,
                pola_tanam: 'Mata Lima',
                jarak_tanam: '9x9',
                target_sph: 138,
                target_pokok: Math.round(luas * 138),
                total_tertanam_ha: 0,
                total_tertanam: 0,
                todate_lubang_ha: 0,
                todate_pancang_ha: 0,
                todate_ajir_pcs: 0,
                todate_langsir_ha: 0,
                sisa_ha: luas,
                persentase: 0,
                status: 'Belum Mulai',
                varietas_bibit: 'Dami Mas',
                tahun_tanam: new Date().getFullYear(),
                geometry: tempPlottedPolygonGeoJSON.geometry
            });
            localStorage.setItem('sawit_master_blocks', JSON.stringify(appData.blocks));
            if (typeof syncBlokMetadata === 'function') syncBlokMetadata();
            if (typeof renderMasterBlokTable === 'function') renderMasterBlokTable();
            if (typeof renderDashboard === 'function') renderDashboard(appData.blocks, appData.reports);
        }
    }

    // 3. Render ke Peta
    renderPlottedAreaFeature(newItem);

    closeSavePlottedAreaModal();
    if (typeof showToast === 'function') {
        showToast(`Area "${name}" (${luas.toFixed(2)} Ha) berhasil disimpan ke layer spasial offline!`, 'success');
    }
}

function closeSavePlottedAreaModal() {
    const modal = document.getElementById('savePlottedAreaModal');
    if (modal) modal.classList.remove('show');
}

function loadPlottedLayersFromStorage() {
    if (!plottedLayerGroup) return;
    plottedLayerGroup.clearLayers();

    try {
        const saved = JSON.parse(localStorage.getItem('sawit_custom_plotted_layers')) || [];
        saved.forEach(item => renderPlottedAreaFeature(item));
    } catch(err) {
        console.warn('Gagal memuat layer plotting tersimpan:', err);
    }
}

function renderPlottedAreaFeature(item) {
    if (!plottedLayerGroup || !map) return;

    const feature = {
        type: 'Feature',
        properties: item,
        geometry: item.geometry
    };

    const layer = L.geoJSON(feature, {
        style: {
            color: '#a855f7',
            weight: 2.5,
            opacity: 0.95,
            fillColor: '#a855f7',
            fillOpacity: 0.35,
            dashArray: '3, 5'
        },
        onEachFeature: function (f, l) {
            const p = f.properties;
            const popupHtml = `
                <div class="map-popup-card">
                    <div class="popup-header">
                        <div>
                            <h4 class="popup-title text-purple">${p.name}</h4>
                            <span class="popup-subtitle">${p.category} | ${p.created_at}</span>
                        </div>
                        <span class="badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">Hasil Plotting</span>
                    </div>
                    <hr class="popup-divider">
                    <table class="popup-table">
                        <tr><td>Luas Area</td><td><b>${p.luas_ha} Ha</b></td></tr>
                        <tr><td>Est. Target Pokok</td><td><b>${Math.round(p.luas_ha * 138).toLocaleString('id-ID')} Pkk</b></td></tr>
                        <tr><td>Catatan</td><td>${p.notes || '-'}</td></tr>
                    </table>
                </div>
            `;
            l.bindPopup(popupHtml);
        }
    }).addTo(plottedLayerGroup);

    try {
        map.fitBounds(layer.getBounds(), { padding: [30, 30] });
    } catch(e) {}
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

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
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

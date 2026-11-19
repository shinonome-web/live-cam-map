// Live Cam Map — prototype
// Data: data/cameras.json (edit this file to add / replace cameras)
// Each item: { id, name, place, lat, lng, category, description,
//              youtubeVideoId (fixed video) OR youtubeChannelId (channel's current live)
//              OR youtubeSearch (fallback: link to a YouTube search) }

const FALLBACK = [
  { id:"shibuya-scramble", name:"渋谷スクランブル交差点", place:"東京・渋谷", lat:35.6595, lng:139.7005, category:"街", description:"サンプル（オフライン表示用）", youtubeVideoId:"dfVK7ld38Ys", youtubeChannelId:"" }
];

let allCams = [];
let activeCategory = "すべて";
let markers = new Map();

const map = L.map("map", { worldCopyJump: true }).setView([36.5, 138.5], 5);

// ベースマップ（地図画像）の切り替え。データ（ピン）は共通で、絵柄だけが変わる。
const osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const baseLayers = {
  "標準": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: osmAttr
  }),
  // 注: CARTOのラスタタイルは2026年からAPIキー必須になり、キーなしでは
  // 「API KEY REQUIRED」の代替画像が返るため、キー不要なEsriのグレースケールを使う。
  "淡色": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16, attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
  }),
  "ダーク": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16, attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
  }),
  "地形": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 17, subdomains: "abc",
    attribution: 'Map data: ' + osmAttr + ', <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }),
  "航空写真": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }),
  "地理院地図": L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
    maxZoom: 18, attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
  })
};
baseLayers["標準"].addTo(map);

const cluster = L.markerClusterGroup();
map.addLayer(cluster);

// 右上の切り替えUI：ベースマップはラジオ選択、ピンは表示/非表示のトグル
L.control.layers(baseLayers, { "カメラのピン": cluster }, { collapsed: true }).addTo(map);

const listEl = document.getElementById("camList");
const chipsEl = document.getElementById("categoryBar");
const countEl = document.getElementById("countLabel");
const searchEl = document.getElementById("searchInput");
const playerEl = document.getElementById("playerPanel");

function embedUrl(cam) {
  if (cam.youtubeVideoId) return `https://www.youtube.com/embed/${cam.youtubeVideoId}?autoplay=1&mute=1&rel=0`;
  if (cam.youtubeChannelId) return `https://www.youtube.com/embed/live_stream?channel=${cam.youtubeChannelId}&autoplay=1&mute=1`;
  return null;
}
function watchUrl(cam) {
  if (cam.youtubeVideoId) return `https://www.youtube.com/watch?v=${cam.youtubeVideoId}`;
  if (cam.youtubeChannelId) return `https://www.youtube.com/channel/${cam.youtubeChannelId}/live`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(cam.youtubeSearch || cam.name + " ライブカメラ")}&sp=EgJAAQ%253D%253D`;
}

function selectCam(cam, fly = true) {
  document.querySelectorAll(".cam-list li").forEach(li => li.classList.toggle("active", li.dataset.id === cam.id));
  const url = embedUrl(cam);
  playerEl.innerHTML = `
    ${url ? `<iframe src="${url}" title="${cam.name}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
          : `<p class="muted">この地点はサンプル登録です。下のリンクから現在の配信を探して、<code>data/cameras.json</code> に動画IDを入れると埋め込み再生できるようになります。</p>`}
    <h2>${cam.name}</h2>
    <p class="meta">${cam.place} ・ ${cam.category}</p>
    <p>${cam.description || ""}</p>
    <a class="search-link" href="${watchUrl(cam)}" target="_blank" rel="noopener">YouTubeで開く →</a>`;
  if (fly) map.flyTo([cam.lat, cam.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const visible = allCams.filter(c =>
    (activeCategory === "すべて" || c.category === activeCategory) &&
    (!q || `${c.name} ${c.place} ${c.category}`.toLowerCase().includes(q))
  );
  cluster.clearLayers();
  markers.clear();
  listEl.innerHTML = "";
  visible.forEach(cam => {
    const m = L.marker([cam.lat, cam.lng]).bindPopup(`<strong>${cam.name}</strong><br>${cam.place}`);
    m.on("click", () => selectCam(cam, false));
    markers.set(cam.id, m);
    cluster.addLayer(m);
    const li = document.createElement("li");
    li.dataset.id = cam.id;
    li.innerHTML = `<span class="name">${cam.name}</span>${embedUrl(cam) ? '<span class="badge live">埋め込み可</span>' : '<span class="badge">サンプル</span>'}<div class="sub">${cam.place} ・ ${cam.category}</div>`;
    li.addEventListener("click", () => { selectCam(cam); markers.get(cam.id)?.openPopup(); });
    listEl.appendChild(li);
  });
  countEl.textContent = `${visible.length} 件のカメラ`;
}

function renderChips() {
  const cats = ["すべて", ...new Set(allCams.map(c => c.category))];
  chipsEl.innerHTML = "";
  cats.forEach(cat => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip" + (cat === activeCategory ? " active" : ""); b.textContent = cat;
    b.addEventListener("click", () => { activeCategory = cat; renderChips(); render(); });
    chipsEl.appendChild(b);
  });
}

document.getElementById("randomBtn").addEventListener("click", () => {
  if (!allCams.length) return;
  selectCam(allCams[Math.floor(Math.random() * allCams.length)]);
});
searchEl.addEventListener("input", render);

fetch("./data/cameras.json")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(data => { allCams = data; renderChips(); render(); })
  .catch(() => { allCams = FALLBACK; renderChips(); render(); }); // file:// で開いた場合などの保険

// 📊 1. Vercel Analytics चालू करो
import { inject } from '@vercel/analytics';
inject();

// 🗺️ 2. CONFIG: यहाँ से डेटा और API कंट्रोल होगा
const CONFIG = {
    HOME_BATCHES_URL: 'https://semfy-gros.github.io/batches/batcha.json', 
    DETAILS_API_URL: 'https://srt-pro-osmopic.onrender.com/api/get-batch-details' 
};

// ==========================================
// 🧠 GLOBAL VARIABLES
// ==========================================
let allBatchesData = [];
let filteredBatches = [];
let currentBatchCount = 0;
const BATCHES_PER_PAGE = 20;
const appView = document.getElementById('app-view');
let favoriteBatches = JSON.parse(localStorage.getItem('favoriteBatches')) || [];

// --- FAVORITES LOGIC (Global Window Scope) ---
window.toggleFavorite = function(batchName, event) {
    if (event) event.stopPropagation(); 
    
    if (favoriteBatches.includes(batchName)) {
        favoriteBatches = favoriteBatches.filter(b => b !== batchName);
    } else {
        favoriteBatches.push(batchName);
    }
    localStorage.setItem('favoriteBatches', JSON.stringify(favoriteBatches));
    
    if (window.location.hash === '#favorites') {
        renderBatchesPage(true); 
    } else {
        const icon = event.currentTarget.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-regular');
            icon.classList.toggle('fa-solid');
            icon.style.color = favoriteBatches.includes(batchName) ? '#ef4444' : '';
        }
    }
}

// ==========================================
// 🚀 3. APP INITIALIZATION (FETCH ONLINE JSON)
// ==========================================
async function initApp() {
    const grid = document.getElementById('batches-grid');
    if (grid) grid.innerHTML = `<div style="text-align:center; width:100%; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Loading Batches...</p></div>`;

    try {
        const response = await fetch(CONFIG.HOME_BATCHES_URL);
        if (!response.ok) throw new Error("Network Error");
        const rawData = await response.json();
        
        if (Array.isArray(rawData)) allBatchesData = rawData;
        else if (rawData.data && Array.isArray(rawData.data)) allBatchesData = rawData.data;
        else if (rawData.batches && Array.isArray(rawData.batches)) allBatchesData = rawData.batches;

        renderBatchesPage(window.location.hash === '#favorites');

    } catch (error) {
        console.error("Home Batches Load Error:", error);
        if (grid) grid.innerHTML = `<div style="text-align:center; width:100%; color:red; padding:40px;"><b>Error:</b> Could not load batches. Cross-Origin (CORS) blocked or URL is wrong.</div>`;
    }
}

// ==========================================
// 🎨 4. RENDER DASHBOARD (SEARCH & FILTERS)
// ==========================================
function renderBatchesPage(isFavView = false) {
    // 1. Load Template
    if (appView) {
        appView.innerHTML = '';
        const template = document.getElementById('batches-template');
        if (template) appView.appendChild(template.content.cloneNode(true));
    }

    // 2. Setup Filter Buttons (All / Favorites)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.addEventListener('click', (e) => {
            const filterType = e.currentTarget.getAttribute('data-filter');
            window.location.hash = filterType === 'favorites' ? 'favorites' : 'batches';
        });
    });
    
    if(isFavView) {
        document.querySelector('.filter-btn[data-filter="favorites"]')?.classList.add('active');
        filteredBatches = allBatchesData.filter(batch => favoriteBatches.includes(batch.name || batch.batchName));
    } else {
        document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
        filteredBatches = [...allBatchesData];
    }

    // 3. Setup Live Search (The Fix!)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                filteredBatches = isFavView ? allBatchesData.filter(b => favoriteBatches.includes(b.name || b.batchName)) : [...allBatchesData]; 
            } else {
                filteredBatches = allBatchesData.filter(batch => {
                    const bName = (batch.name || batch.batchName || "").toLowerCase();
                    return bName.includes(query);
                });
            }
            currentBatchCount = 0;
            document.getElementById('batches-grid').innerHTML = '';
            window.renderMoreBatches();
        });
    }

    // 4. Clean Khazana Event Listener (अगर सर्च के नीचे Khazana टैब है)
    const khazanaTabsBtn = document.querySelectorAll('.tab-btn[data-tab="khazana"]');
    khazanaTabsBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            const khazanaDisplayBox = document.querySelector('#khazana-tab .khazana-batch-section') || document.querySelector('#khazana-tab');
            if(khazanaDisplayBox) {
                khazanaDisplayBox.innerHTML = `<div style="padding: 40px; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Loading Khazana...</div>`;
                alert("Khazana API link is missing!");
            }
        });
    });

    // 5. Render Grid Initially
    currentBatchCount = 0;
    window.renderMoreBatches();
}

// --- RENDER BATCH CARDS & LOAD MORE ---
window.renderMoreBatches = function() {
    const grid = document.getElementById('batches-grid');
    if (!grid) return;

    if (filteredBatches.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);"><h3>No batches found!</h3></div>`;
        return;
    }

    const nextBatches = filteredBatches.slice(currentBatchCount, currentBatchCount + BATCHES_PER_PAGE);
    const existingBtn = document.getElementById('real-load-more-btn');
    if (existingBtn) existingBtn.remove();

    nextBatches.forEach(batch => {
        const batchId = batch.batch_id || batch._id || batch.id;
        const batchName = batch.name || batch.batchName || "Premium Batch";
        const batchClass = batch.class || batch.className || "Live";
        const imageUrl = batch.previewImage || batch.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(batchName)}&background=5a4bda&color=fff&size=300`;
        const isFav = favoriteBatches.includes(batchName);

        const card = document.createElement('div');
        card.className = 'batch-card'; 
        card.style.cursor = 'pointer';
        
        card.onclick = () => {
            localStorage.setItem('currentBatchName', batchName);
            localStorage.setItem('currentBatchImg', imageUrl);
            window.location.hash = `batch-details/${batchId}`; 
        };

        // 🔥 Favorites button click logic fixed!
        card.innerHTML = `
            <div class="batch-image">
                <img src="${imageUrl}" style="width:100%; height:150px; object-fit:cover;">
                <button class="favorite-btn" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; padding: 8px; cursor: pointer; color: ${isFav ? '#ef4444' : '#fff'}; z-index: 10;" onclick="window.toggleFavorite('${batchName.replace(/'/g, "\\'")}', event)">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>
            <div class="batch-content">
                <div class="batch-tags"><span class="batch-tag language-tag">${batchClass}</span></div>
                <h3 class="batch-title" style="margin-bottom:10px;">${batchName}</h3>
                <div class="batch-footer" style="margin-top: auto;">
                    <button class="study-btn" style="width: 100%;">Let's Study <i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card); 
    });

    currentBatchCount += nextBatches.length;
    if (currentBatchCount < filteredBatches.length) {
        const btnContainer = document.createElement('div');
        btnContainer.id = 'real-load-more-btn';
        btnContainer.style.gridColumn = '1 / -1'; 
        btnContainer.style.margin = '20px 0';
        
        const btn = document.createElement('button');
        btn.className = 'community-banner-btn'; 
        btn.innerHTML = `Load More (${filteredBatches.length - currentBatchCount} left) <i class="fa-solid fa-rotate-right"></i>`;
        btn.onclick = window.renderMoreBatches; // 🔥 Load More fixed
        
        btnContainer.appendChild(btn);
        grid.appendChild(btnContainer);
    }
}

// ==========================================
// 📚 5. BATCH DETAILS (RENDER API FETCH)
// ==========================================
window.openBatchDetails = async (batchId, batchName, imageUrl) => {
    if (appView) {
        appView.innerHTML = '';
        const template = document.getElementById('batch-details-template');
        if (template) appView.appendChild(template.content.cloneNode(true));
    }
    
    const titleElement = document.querySelector('.batch-title');
    if (titleElement) { 
        titleElement.textContent = batchName; 
        titleElement.classList.remove('skeleton-text'); 
    }
    
    const imageContainer = document.querySelector('.batch-header .batch-image');
    if (imageContainer) {
        imageContainer.classList.remove('skeleton-bg');
        imageContainer.innerHTML = `<img src="${imageUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:12px; position:absolute; top:0; left:0;">`;
    }
    
    let subjectsGrid = document.querySelector('#subjects-tab .subjects-grid') || document.querySelector('#schedule-container');

    if (subjectsGrid) {
        subjectsGrid.innerHTML = `<div style="padding: 40px; text-align: center; width: 100%;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--primary-color); margin-bottom: 15px;"></i><p>Fetching Subjects from Server...</p></div>`;

        try {
            const response = await fetch(`${CONFIG.DETAILS_API_URL}?batchId=${batchId}`);
            if (!response.ok) throw new Error("Proxy Server Failed!");
            const apiData = await response.json();
            const subjects = apiData.data || apiData; 

            subjectsGrid.innerHTML = ''; 
            
            if (!subjects || subjects.length === 0) {
                subjectsGrid.innerHTML = `<p style="padding: 20px; text-align: center;">No subjects found.</p>`;
                return;
            }

            subjects.forEach(sub => {
                const subName = sub.subject || sub.name || "Unknown Subject";
                const teacherName = (sub.teachers && sub.teachers.length > 0) ? "Multiple Teachers" : "Faculty";

                subjectsGrid.innerHTML += `
                    <div class="subject-card" style="padding: 20px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 15px; box-shadow: var(--card-shadow); margin-bottom: 15px;">
                        <div style="width: 50px; height: 50px; background: rgba(90, 75, 218, 0.1); color: var(--primary-color); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                            <i class="fa-solid fa-book-open"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 5px 0; font-size: 16px; color: var(--text-primary);">${subName}</h3>
                            <p style="margin: 0; font-size: 13px; color: var(--text-secondary);"><i class="fa-solid fa-chalkboard-user"></i> ${teacherName}</p>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            subjectsGrid.innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444; width: 100%;"><i class="fa-solid fa-triangle-exclamation fa-2x" style="margin-bottom: 10px;"></i><p><b>Error:</b> Could not connect to proxy server.</p></div>`;
        }
    }
};

// ==========================================
// ⚙️ 6. ROUTER & GLOBAL EVENTS (The Header Fix!)
// ==========================================
function handleRouting() {
    const hash = window.location.hash;
    if (hash === '' || hash === '#batches' || hash === '#favorites') {
        if (allBatchesData.length === 0) {
            initApp(); 
        } else {
            renderBatchesPage(hash === '#favorites'); 
        }
    } else if (hash.startsWith('#batch-details/')) {
        const urlParts = hash.split('/');
        const batchId = urlParts[1];
        const savedName = localStorage.getItem('currentBatchName') || "Loading...";
        const savedImg = localStorage.getItem('currentBatchImg') || "";
        window.openBatchDetails(batchId, savedName, savedImg);
    }
}

// 🌙 Header Icons Logic (Dark Mode, Refresh, etc.)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Reload Button
    const reloadBtn = document.getElementById('reload-app');
    if (reloadBtn) reloadBtn.addEventListener('click', () => window.location.reload());

    // 2. Dark Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if(localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // Start App Router
    setTimeout(() => { handleRouting(); }, 100);
});

window.addEventListener('hashchange', handleRouting);

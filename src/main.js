// 📊 1. Vercel Analytics चालू करो
import { inject } from '@vercel/analytics';
inject();

// 🗺️ 2. MINI PATH-DETECTOR & CONFIG (यहाँ लिंक्स सेट करो)
const CONFIG = {
    // 🔥 अपना ऑनलाइन वाला batches.json का लिंक यहाँ डालो
    HOME_BATCHES_URL: 'https://semfy-gros.github.io/batches/batcha.json', 
    
    // 🚀 तुम्हारा Render वाला API लिंक
    DETAILS_API_URL: 'https://srt-pro-osmopic.onrender.com/api/get-batch-details' 
};

// ==========================================
// 🧠 GLOBAL VARIABLES & FAVORITES
// ==========================================
let allBatchesData = [];
let filteredBatches = [];
let currentBatchCount = 0;
const BATCHES_PER_PAGE = 20;
const appView = document.getElementById('app-view');
let favoriteBatches = JSON.parse(localStorage.getItem('favoriteBatches')) || [];

function toggleFavorite(batchName, event) {
    if (event) event.stopPropagation(); 
    
    if (favoriteBatches.includes(batchName)) {
        favoriteBatches = favoriteBatches.filter(b => b !== batchName);
    } else {
        favoriteBatches.push(batchName);
    }
    localStorage.setItem('favoriteBatches', JSON.stringify(favoriteBatches));
    
    if (window.location.hash === '#favorites') {
        renderMoreBatches(true); // रीसेट करके दोबारा लोड करो
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
// 🚀 3. APP INITIALIZATION (ONLINE FETCH)
// ==========================================
async function initApp() {
    const grid = document.getElementById('batches-grid');
    if (grid) grid.innerHTML = `<div style="text-align:center; width:100%; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Loading Batches from Server...</p></div>`;

    try {
        // ऑनलाइन लिंक से डेटा मंगा रहे हैं
        const response = await fetch(CONFIG.HOME_BATCHES_URL);
        if (!response.ok) throw new Error("CORS or Network Error");
        
        const rawData = await response.json();
        
        // डेटा के फॉर्मेट को समझना
        if (Array.isArray(rawData)) {
            allBatchesData = rawData;
        } else if (rawData.data && Array.isArray(rawData.data)) {
            allBatchesData = rawData.data;
        } else if (rawData.batches && Array.isArray(rawData.batches)) {
            allBatchesData = rawData.batches;
        }

        filteredBatches = [...allBatchesData];
        if (grid) grid.innerHTML = '';
        renderMoreBatches();

    } catch (error) {
        console.error("Home Batches Load Error:", error);
        if (grid) grid.innerHTML = `<div style="text-align:center; width:100%; color:red; padding:40px;"><b>Error:</b> Could not load batches. Cross-Origin (CORS) might be blocked.</div>`;
    }
}

// ==========================================
// 🎨 4. RENDER BATCHES (DASHBOARD)
// ==========================================
function renderMoreBatches(reset = false) {
    const grid = document.getElementById('batches-grid');
    if (!grid) return;

    if (reset) {
        grid.innerHTML = '';
        currentBatchCount = 0;
        const isFavView = window.location.hash === '#favorites';
        filteredBatches = isFavView ? allBatchesData.filter(b => favoriteBatches.includes(b.name || b.batchName)) : [...allBatchesData];
    }

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
        card.style.position = 'relative'; 
        
        card.onclick = () => {
            localStorage.setItem('currentBatchName', batchName);
            localStorage.setItem('currentBatchImg', imageUrl);
            window.location.hash = `batch-details/${batchId}`; 
        };

        card.innerHTML = `
            <div class="batch-image">
                <img src="${imageUrl}" style="width:100%; height:150px; object-fit:cover;">
                <button class="favorite-btn" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; padding: 8px; cursor: pointer; color: ${isFav ? '#ef4444' : '#fff'}; z-index: 10;">
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
        
        const favBtn = card.querySelector('.favorite-btn');
        favBtn.addEventListener('click', (e) => toggleFavorite(batchName, e));
        
        grid.appendChild(card); 
    });

    currentBatchCount += nextBatches.length;
    if (currentBatchCount < filteredBatches.length) {
        const btnContainer = document.createElement('div');
        btnContainer.id = 'real-load-more-btn';
        btnContainer.style.gridColumn = '1 / -1'; 
        btnContainer.style.margin = '20px 0';
        btnContainer.innerHTML = `<button class="community-banner-btn" onclick="renderMoreBatches()">Load More (${filteredBatches.length - currentBatchCount} left) <i class="fa-solid fa-rotate-right"></i></button>`;
        grid.appendChild(btnContainer);
    }
}

// ==========================================
// 📚 5. BATCH DETAILS (RENDER API FETCH)
// ==========================================
window.openBatchDetails = async (batchId, batchName, imageUrl) => {
    const appView = document.getElementById('app-view');
    const template = document.getElementById('batch-details-template');
    if (appView && template) {
        appView.innerHTML = '';
        appView.appendChild(template.content.cloneNode(true));
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
// ⚙️ 6. ROUTER & GLOBAL EVENTS
// ==========================================
function handleRouting() {
    const hash = window.location.hash;
    if (hash === '' || hash === '#batches') {
        const appView = document.getElementById('app-view');
        const template = document.getElementById('batches-template');
        if (appView && template) {
            appView.innerHTML = '';
            appView.appendChild(template.content.cloneNode(true));
        }
        
        // एक्टिव बटन स्टाइलिंग
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
        
        if (allBatchesData.length === 0) {
            initApp(); // अगर डेटा नहीं है तो API कॉल करो
        } else {
            renderMoreBatches(true); // डेटा है तो बस रेंडर करो
        }
    } else if (hash === '#favorites') {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="favorites"]')?.classList.add('active');
        renderMoreBatches(true);
    } else if (hash.startsWith('#batch-details/')) {
        const urlParts = hash.split('/');
        const batchId = urlParts[1];
        const savedName = localStorage.getItem('currentBatchName') || "Loading...";
        const savedImg = localStorage.getItem('currentBatchImg') || "";
        window.openBatchDetails(batchId, savedName, savedImg);
    }
}

window.addEventListener('hashchange', handleRouting);
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { handleRouting(); }, 100);
});

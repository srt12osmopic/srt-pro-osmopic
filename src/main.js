// 🗺️ 1. CONFIG: यहाँ से डेटा और API कंट्रोल होगा
const CONFIG = {
    HOME_BATCHES_URL: 'https://semfy-gros.github.io/batches/batcha.json', 
    DETAILS_API_URL: '[https://srt-pro-osmopic.onrender.com/api/proxy?url=https://vidcloud.eu.org/api/v2/batches/634bd315ed7a360018558283/subject/69beb1defa18934d859e3526/contents?tag=69d1e84d5d37ef7032108d51&contentType=notes&page=1](https://srt-pro-osmopic.onrender.com/api/proxy?url=https://vidcloud.eu.org/api/v2/batches/634bd315ed7a360018558283/subject/69beb1defa18934d859e3526/contents?tag=69d1e84d5d37ef7032108d51&contentType=notes&page=1)' 
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

// --- FAVORITES LOGIC ---
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
        if (grid) grid.innerHTML = `<div style="text-align:center; width:100%; color:red; padding:40px;"><b>Error:</b> Could not load batches. Cross-Origin (CORS) blocked.</div>`;
    }
}

// ==========================================
// 🎨 4. RENDER DASHBOARD (SEARCH & FILTERS)
// ==========================================
function renderBatchesPage(isFavView = false) {
    if (appView) {
        appView.innerHTML = '';
        const template = document.getElementById('batches-template');
        if (template) appView.appendChild(template.content.cloneNode(true));
    }

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

    currentBatchCount = 0;
    window.renderMoreBatches();
}

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
        btn.onclick = window.renderMoreBatches; 
        
        btnContainer.appendChild(btn);
        grid.appendChild(btnContainer);
    }
}

// ==========================================
// 📚 5. BATCH DETAILS (SUBJECTS FETCH)
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
        subjectsGrid.innerHTML = `<div style="padding: 40px; text-align: center; width: 100%;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--primary-color); margin-bottom: 15px;"></i><p>Fetching Subjects...</p></div>`;

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

                // 🔥 नया क्लिक इवेंट: सब्जेक्ट पर क्लिक करने से वीडियो फेच होंगे
                subjectsGrid.innerHTML += `
                    <div class="subject-card" onclick="window.fetchAndShowLectures('${batchId}', '${sub._id || sub.id}', '69d1e84d5d37ef7032108d51')" style="padding: 20px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 15px; box-shadow: var(--card-shadow); margin-bottom: 15px;">
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
// 🎬 6. FETCH & RENDER LECTURES (VIDEOS)
// ==========================================
window.fetchAndShowLectures = async (batchId, subjectId, tagId) => {
    const container = document.getElementById('subjects-tab') || document.querySelector('.subjects-grid'); 
    
    if (!container) return;

    container.innerHTML = `<div style="padding: 40px; text-align: center;">
        <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--primary-color);"></i>
        <p>Loading Awesome Lectures...</p>
    </div>`;

    try {
        const targetUrl = `https://vidcloud.eu.org/api/v2/batches/${batchId}/subject/${subjectId}/contents?tag=${tagId}&contentType=notes&page=1`;
        const proxyUrl = `${CONFIG.DETAILS_API_URL}?url=${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl);
        const result = await response.json();
        const lectures = result.data.data; 

        container.innerHTML = ''; 

        if (!lectures || lectures.length === 0) {
            container.innerHTML = `<p style="text-align:center;">No lectures found here!</p>`;
            return;
        }

        let html = '<h3 style="margin-bottom: 20px;">📚 Your Lectures</h3>';
        
        lectures.forEach(lec => {
            const title = lec.topic || "Unknown Topic";
            const duration = lec.videoDetails?.duration || "N/A";
            const videoUrl = lec.videoDetails?.videoUrl || "";
            const date = new Date(lec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

            html += `
                <div class="lecture-card" style="padding: 15px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--card-shadow);">
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <div style="width: 40px; height: 40px; background: rgba(90, 75, 218, 0.1); color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: var(--text-primary); font-size: 15px;">${title}</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 12px;">
                                <i class="fa-regular fa-clock"></i> ${duration} &nbsp;|&nbsp; 
                                <i class="fa-regular fa-calendar"></i> ${date}
                            </p>
                        </div>
                    </div>
                    <button class="study-btn" onclick="alert('Video Link: ${videoUrl}')" style="padding: 8px 15px; font-size: 12px;">Play</button>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error("Lecture Fetch Error:", error);
        container.innerHTML = `<div style="text-align:center; color:red;"><b>Error:</b> Could not load lectures!</div>`;
    }
};

// ==========================================
// ⚙️ 7. ROUTER & GLOBAL EVENTS
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

document.addEventListener('DOMContentLoaded', () => {
    const reloadBtn = document.getElementById('reload-app');
    if (reloadBtn) reloadBtn.addEventListener('click', () => window.location.reload());

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    setTimeout(() => { handleRouting(); }, 100);
});

window.addEventListener('hashchange', handleRouting);

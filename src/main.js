import batchesDataRaw from '../database/batches.json';

// 🌟 VITE MAGIC: सारे बैचेस के सारे लेक्चर्स एक बार में रीड करो
const allLectureFiles = import.meta.glob('../database/*/Lectures/*.json', { eager: true });

let allBatchesData = [];
if (Array.isArray(batchesDataRaw)) {
    allBatchesData = batchesDataRaw;
} else if (batchesDataRaw.data && Array.isArray(batchesDataRaw.data)) {
    allBatchesData = batchesDataRaw.data;
} else if (batchesDataRaw.batches && Array.isArray(batchesDataRaw.batches)) {
    allBatchesData = batchesDataRaw.batches;
}

let filteredBatches = [...allBatchesData];
let currentBatchCount = 0;
const BATCHES_PER_PAGE = 20;
const appView = document.getElementById('app-view');

// ==========================================
// 🧠 GLOBAL UTILS & FAVORITES LOGIC
// ==========================================
let favoriteBatches = JSON.parse(localStorage.getItem('favoriteBatches')) || [];

function toggleFavorite(batchName, event) {
    if (event) {
        event.stopPropagation(); // Card ke click event ko rokne ke liye
    }
    
    if (favoriteBatches.includes(batchName)) {
        favoriteBatches = favoriteBatches.filter(b => b !== batchName);
    } else {
        favoriteBatches.push(batchName);
    }
    localStorage.setItem('favoriteBatches', JSON.stringify(favoriteBatches));
    
    // Agar favorites page pe hain, toh turant refresh karo
    if (window.location.hash === '#favorites') {
        window.loadBatches(true);
    } else {
        // Sirf dil ka color change karo
        const icon = event.currentTarget.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-regular');
            icon.classList.toggle('fa-solid');
            icon.style.color = favoriteBatches.includes(batchName) ? '#ef4444' : '';
        }
    }
}

function loadTemplate(templateId) {
    if (!appView) return false;
    appView.innerHTML = ''; 
    const template = document.getElementById(templateId);
    if (template) {
        appView.appendChild(template.content.cloneNode(true));
        return true;
    }
    return false;
}

// 🚀 THE REAL ROUTER (With ID Support)
function handleRouting() {
    const hash = window.location.hash;
    
    if (hash === '' || hash === '#batches') {
        window.loadBatches(false); 
    } else if (hash === '#favorites') {
        window.loadBatches(true); 
    } 
    // 🔥 URL में ID चेक करो (Example: #batch-details/65d862...)
    else if (hash.startsWith('#batch-details/')) {
        const urlParts = hash.split('/');
        const batchId = urlParts[1];
        
        // LocalStorage से नाम और इमेज निकाल रहे हैं (ताकि API लोड होने से पहले UI अच्छा दिखे)
        const savedName = localStorage.getItem('currentBatchName') || "Loading Batch...";
        const savedImg = localStorage.getItem('currentBatchImg') || "";
        
        window.openBatchDetails(batchId, savedName, savedImg);
    }
}
window.addEventListener('hashchange', handleRouting);

// ==========================================
// 🚀 1. DASHBOARD, SEARCH & STUDY MATERIAL LOGIC 
// ==========================================
window.loadBatches = (isFavoritesView = false) => {
    const loaded = loadTemplate('batches-template'); 
    if (!loaded) return;
    
    // Header Navigation Style Change
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    if(isFavoritesView) {
        document.querySelector('.filter-btn[data-filter="favorites"]')?.classList.add('active');
        filteredBatches = allBatchesData.filter(batch => favoriteBatches.includes(batch.name || batch.batchName));
    } else {
        document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
        filteredBatches = [...allBatchesData];
    }

    // --- Study Material Dropdown Logic ---
    const studyHeader = document.getElementById('study-material-header');
    const studyBody = document.getElementById('study-material-body');
    const studyArrow = document.getElementById('study-material-arrow');

    if (studyHeader && studyBody) {
        studyHeader.addEventListener('click', () => {
            const isClosed = studyBody.style.display === 'none' || studyBody.style.display === '';
            studyBody.style.display = isClosed ? 'block' : 'none';
            if (studyArrow) {
                studyArrow.style.transform = isClosed ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    }

    // --- Search & Live Suggestions Logic ---
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchSuggestions = document.getElementById('search-suggestions');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query === '') {
                filteredBatches = isFavoritesView ? allBatchesData.filter(b => favoriteBatches.includes(b.name || b.batchName)) : [...allBatchesData]; 
                if(searchSuggestions) searchSuggestions.style.display = 'none';
            } else {
                filteredBatches = allBatchesData.filter(batch => {
                    const bName = (batch.name || batch.batchName || "").toLowerCase();
                    return bName.includes(query);
                });
                
                // Show Dropdown Suggestions (Like video reference)
                if(searchSuggestions) {
                    searchSuggestions.innerHTML = '';
                    if(filteredBatches.length > 0) {
                        filteredBatches.slice(0, 5).forEach(batch => {
                            const bName = batch.name || batch.batchName || "Unknown";
                            const li = document.createElement('div');
                            li.style = "padding: 10px; border-bottom: 1px solid var(--card-border); cursor: pointer; color: var(--text-primary);";
                            li.innerHTML = `<i class="fa-solid fa-book" style="margin-right: 10px;"></i> ${bName}`;
                            li.onclick = () => {
                                searchInput.value = bName;
                                searchSuggestions.style.display = 'none';
                                filteredBatches = [batch]; // Show only selected
                                currentBatchCount = 0;
                                document.getElementById('batches-grid').innerHTML = '';
                                window.renderMoreBatches();
                            };
                            searchSuggestions.appendChild(li);
                        });
                        searchSuggestions.style.display = 'block';
                        searchSuggestions.style.position = 'absolute';
                        searchSuggestions.style.background = 'var(--card-bg)';
                        searchSuggestions.style.width = '100%';
                        searchSuggestions.style.zIndex = '100';
                        searchSuggestions.style.boxShadow = 'var(--card-shadow)';
                    } else {
                        searchSuggestions.style.display = 'none';
                    }
                }
            }
            
            currentBatchCount = 0;
            const grid = document.getElementById('batches-grid');
            if (grid) grid.innerHTML = '';
            window.renderMoreBatches();
        });

        // Hide suggestions on outside click
        document.addEventListener('click', (e) => {
            if (searchSuggestions && e.target !== searchInput) {
                searchSuggestions.style.display = 'none';
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            if(searchSuggestions) searchSuggestions.style.display = 'none';
            filteredBatches = isFavoritesView ? allBatchesData.filter(b => favoriteBatches.includes(b.name || b.batchName)) : [...allBatchesData];
            currentBatchCount = 0;
            const grid = document.getElementById('batches-grid');
            if (grid) grid.innerHTML = '';
            window.renderMoreBatches();
        });
    }

    currentBatchCount = 0;
    window.renderMoreBatches();
};

window.renderMoreBatches = () => {
    const grid = document.getElementById('batches-grid');
    if (!grid) return;

    if (filteredBatches.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);"><h3>No batches found!</h3></div>`;
        return;
    }

    const nextBatches = filteredBatches.slice(currentBatchCount, currentBatchCount + BATCHES_PER_PAGE);
    let myLoadMoreBtn = document.getElementById('real-load-more-btn');
    if (myLoadMoreBtn) myLoadMoreBtn.remove();

    nextBatches.forEach(batch => {
        // 🔥 असली ID निकालने वाली लाइन (यह नई जुड़ी है)
        const batchId = batch.batch_id || batch._id || batch.id;
        
        const batchName = batch.name || batch.batchName || "Premium Batch";
        const batchClass = batch.class || batch.className || "Live";
        const imageUrl = batch.previewImage || batch.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(batchName)}&background=5a4bda&color=fff&size=300`;
        const folderSearchName = (batch.slug || batchName).toLowerCase().replace(/\s+/g, '_');
        const isFav = favoriteBatches.includes(batchName);

        const card = document.createElement('div');
        card.className = 'batch-card'; 
        card.style.cursor = 'pointer';
        card.style.position = 'relative'; 
        
        // 🚀 क्लिक करने पर अब ID URL में जाएगी
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
        
        const btn = document.createElement('button');
        btn.className = 'community-banner-btn'; 
        btn.innerHTML = `Load More (${filteredBatches.length - currentBatchCount} left) <i class="fa-solid fa-rotate-right"></i>`;
        btn.onclick = window.renderMoreBatches;
        
        btnContainer.appendChild(btn);
        grid.appendChild(btnContainer);
    }
};

// ==========================================
// 📚 2. BATCH DETAILS (REAL API FETCH)
// ==========================================
window.openBatchDetails = async (batchId, batchName, imageUrl) => {
    // 1. UI Setup 
    const loaded = loadTemplate('batch-details-template'); 
    if (!loaded) return;
    
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
    
    // 2. Subjects लोड करने के लिए सही जगह ढूँढना (तुम्हारी index.html के हिसाब से)
    let subjectsGrid = document.querySelector('#subjects-tab .subjects-grid');
    if (!subjectsGrid) {
        // अगर Subjects टैब नहीं मिला, तो Schedule वाले में दिखाएंगे
        subjectsGrid = document.querySelector('#schedule-container');
    }

    if (subjectsGrid) {
        subjectsGrid.innerHTML = `<div style="padding: 40px; text-align: center; width: 100%;">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 30px; color: var(--primary-color); margin-bottom: 15px;"></i>
            <p>Fetching Subjects from API...</p>
        </div>`;

        try {
            // 🔥 THE MAGIC: तुम्हारे server.js को रिक्वेस्ट भेजना
            const response = await fetch(`https://srt-pro-osmopic.onrender.com/api/get-batch-details?batchId=${batchId}`);
            
            if (!response.ok) throw new Error("Proxy Server Connection Failed!");
            
            const apiData = await response.json();
            
            // PW API का डेटा स्ट्रक्चर आमतौर पर data.data में होता है
            const subjects = apiData.data || apiData; 

            subjectsGrid.innerHTML = ''; // लोडर हटाओ
            
            if (!subjects || subjects.length === 0) {
                subjectsGrid.innerHTML = `<p style="padding: 20px; text-align: center;">No subjects found.</p>`;
                return;
            }

            // 🚀 3. Subjects को स्क्रीन पर छापना
            subjects.forEach(sub => {
                const subName = sub.subject || sub.name || "Unknown Subject";
                // टीचर का नाम अगर API में है तो निकालो, वरना डिफॉल्ट लिखो
                const teacherName = (sub.teachers && sub.teachers.length > 0) ? "Multiple Teachers" : "Faculty";

                subjectsGrid.innerHTML += `
                    <div class="subject-card" style="padding: 20px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 15px; box-shadow: var(--card-shadow); margin-bottom: 15px;"
                         onclick="alert('Next Step: Fetch chapters for Subject ID: ${sub._id}')">
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
            console.error("Fetch Error:", error);
            subjectsGrid.innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444; width: 100%;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 30px; margin-bottom: 10px;"></i>
                <p><b>Error:</b> Could not connect to the proxy server.</p>
                <p style="font-size: 12px;">Make sure your server.js is running in the terminal.</p>
            </div>`;
        }
    }
};

function renderChapters(teacherId, allLectures) {
    const container = document.getElementById('chapters-container');
    container.innerHTML = '';
    
    const teacherLectures = allLectures.filter(l => l.teachers && l.teachers.includes(teacherId));
    const chaptersMap = {};
    
    teacherLectures.forEach(lec => {
        const chapName = (lec.tags && lec.tags.length > 0 && lec.tags[0].name) ? lec.tags[0].name : 'Other Topics';
        if (!chaptersMap[chapName]) chaptersMap[chapName] = [];
        chaptersMap[chapName].push(lec);
    });

    for (const chapName in chaptersMap) {
        const chapDiv = document.createElement('div');
        chapDiv.style.marginBottom = '25px';
        chapDiv.innerHTML = `<h3 style="margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid var(--primary-color); display: inline-block;">📁 ${chapName}</h3>`;
        
        chaptersMap[chapName].forEach(lec => {
            const formattedDate = lec.date ? new Date(lec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
            const safeTitle = lec.topic ? lec.topic.replace(/'/g, "\\'") : 'Unknown Lecture';
            const videoUrl = lec.url || (lec.videoDetails && lec.videoDetails.videoUrl) || '';
            const duration = (lec.videoDetails && lec.videoDetails.duration) ? lec.videoDetails.duration : 'N/A';

            chapDiv.innerHTML += `
                <div class="lecture-card" style="margin-bottom: 12px; cursor: pointer; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px;" 
                     onclick="window.playDRMVideo('${safeTitle}', '${videoUrl}')">
                    <div class="lecture-content" style="padding: 15px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 45px; height: 45px; border-radius: 50%; background: rgba(90, 75, 218, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                                <i class="fa-solid fa-play"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 5px 0; font-size: 15px; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${lec.topic}</h4>
                                <div style="margin: 0; font-size: 12px; color: var(--text-secondary);">
                                    <span><i class="fa-regular fa-clock"></i> ${duration}</span>
                                    <span style="margin: 0 5px;">•</span>
                                    <span><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        container.appendChild(chapDiv);
    }
}

// ==========================================
// 🎬 4. SHAKA PLAYER LOGIC
// ==========================================
window.playDRMVideo = async (lectureTitle, rawMpdUrl) => {
    window.location.hash = 'player';
    const loaded = loadTemplate('video-player-template');
    if (!loaded) return;
    
    const titleEl = appView.querySelector('.video-title');
    if (titleEl) titleEl.textContent = lectureTitle;

    const videoElement = appView.querySelector('#content-video');
    const closeBtn = appView.querySelector('.close-video');
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (window.shakaPlayerInstance) window.shakaPlayerInstance.destroy();
            window.history.back(); 
        };
    }

    if (videoElement) {
        shaka.polyfill.installAll();
        window.shakaPlayerInstance = new shaka.Player(videoElement);
        
        window.shakaPlayerInstance.addEventListener('error', (e) => {
            console.error("DRM Error:", e.detail.code);
        });

        const proxyUrl = `https://srt-pro-osmopic.onrender.com/api/get-batch-details?batchId=${batchId}`;
        
        try {
            await window.shakaPlayerInstance.load(proxyUrl);
        } catch (error) {
            console.error("Load failed", error);
        }
    }
};

// ==========================================
// ⚙️ 5. GLOBAL HEADER EVENTS & MODALS (APP SHELL)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Reload Button ---
    const reloadBtn = document.getElementById('reload-app');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // --- 2. Theme Modal ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeModal = document.getElementById('theme-modal');
    if (themeToggle && themeModal) {
        themeToggle.addEventListener('click', () => {
            themeModal.style.display = 'flex';
        });

        // Setup theme click options
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                const selectedTheme = e.currentTarget.getAttribute('data-theme');
                if (selectedTheme === 'auto') {
                    document.documentElement.removeAttribute('data-theme');
                } else {
                    document.documentElement.setAttribute('data-theme', selectedTheme);
                }
                themeModal.style.display = 'none';
            });
        });
    }

    // --- 3. Search Modal ---
    const headerSearchBtn = document.getElementById('header-search-btn');
    const searchModal = document.getElementById('search-modal');
    const closeSearchModal = document.getElementById('close-search-modal');
    const modalSearchInput = document.getElementById('modal-search-input');
    const modalClearSearch = document.getElementById('modal-clear-search');
    const modalSearchResults = document.getElementById('modal-search-results');

    if (headerSearchBtn && searchModal) {
        headerSearchBtn.addEventListener('click', () => {
            searchModal.style.display = 'block';
            if(modalSearchInput) modalSearchInput.focus();
        });

        if (closeSearchModal) {
            closeSearchModal.addEventListener('click', () => {
                searchModal.style.display = 'none';
            });
        }

        if (modalSearchInput) {
            modalSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                modalSearchResults.innerHTML = '';
                
                if(query !== '') {
                    const matches = allBatchesData.filter(b => (b.name || b.batchName || "").toLowerCase().includes(query)).slice(0, 8);
                    
                    if (matches.length === 0) {
                        modalSearchResults.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-secondary);">No batches found.</p>';
                    } else {
                        matches.forEach(batch => {
                            const resultItem = document.createElement('div');
                            resultItem.style = "padding: 12px; border-bottom: 1px solid var(--card-border); cursor: pointer; display: flex; align-items: center; gap: 10px;";
                            resultItem.innerHTML = `<i class="fa-solid fa-search"></i> <span>${batch.name || batch.batchName}</span>`;
                            resultItem.onclick = () => {
                                searchModal.style.display = 'none';
                                const folderSearchName = (batch.slug || batch.name || batch.batchName).toLowerCase().replace(/\s+/g, '_');
                                const imageUrl = batch.previewImage || batch.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(batch.name)}&background=5a4bda&color=fff&size=300`;
                                window.openBatchDetails(batch.name || batch.batchName, imageUrl, folderSearchName);
                            };
                            modalSearchResults.appendChild(resultItem);
                        });
                    }
                }
            });
        }

        if (modalClearSearch) {
            modalClearSearch.addEventListener('click', () => {
                if(modalSearchInput) modalSearchInput.value = '';
                if(modalSearchResults) modalSearchResults.innerHTML = '';
            });
        }
    }
    
    // Initial Route Load
    setTimeout(() => { handleRouting(); }, 100);
});

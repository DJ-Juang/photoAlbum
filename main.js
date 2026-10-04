// main.js
let filteredData = [...rawData];
let currentPage = 1;
const itemsPerPage = 12;

function getThumbnail(url) {
    if (!url) return 'https://via.placeholder.com/400x260?text=No+Preview';
    
    // 抓取 Google Drive 檔案 ID
    const match = url.match(/\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
    if (match && match[1]) {
        // 使用標準的 Google Drive 預覽縮圖網址
        return `https://lh3.googleusercontent.com/d/${match[1]}=w600`;
    }
    
    return 'https://via.placeholder.com/400x260?text=No+Preview';
}

function initRegionFilter() {
    const regionSelect = document.getElementById('regionFilter');
    const regions = [...new Set(rawData.map(d => d.region))].filter(Boolean).sort();
    regions.forEach(r => regionSelect.add(new Option(r, r)));
}

// 更新國家選單 (連動城市選單)
function updateCountryOptions(selectedRegion) {
    const countrySelect = document.getElementById('countryFilter');
    countrySelect.innerHTML = '<option value="all">所有國家</option>';
    
    const availableCountries = rawData
        .filter(item => selectedRegion === 'all' || item.region === selectedRegion)
        .map(item => item.country)
        .filter(Boolean);

    [...new Set(availableCountries)].sort().forEach(c => countrySelect.add(new Option(c, c)));
    
    // 當國家重置/改變時，同步更新城市選單
    updateCityOptions(selectedRegion, countrySelect.value);
}

// 新增：更新城市選單
function updateCityOptions(selectedRegion, selectedCountry) {
    const citySelect = document.getElementById('cityFilter');
    citySelect.innerHTML = '<option value="all">所有城市</option>';

    const availableCities = rawData
        .filter(item => {
            const matchRegion = (selectedRegion === 'all' || item.region === selectedRegion);
            const matchCountry = (selectedCountry === 'all' || item.country === selectedCountry);
            return matchRegion && matchCountry;
        })
        .map(item => item.city)
        .filter(Boolean); // 過濾掉空值或 undefined

    [...new Set(availableCities)].sort().forEach(c => citySelect.add(new Option(c, c)));
}

function renderGallery() {
    const gallery = document.getElementById('gallery');
    const stats = document.getElementById('stats');
    const emptyState = document.getElementById('emptyState');
    
    // 清空現有內容
    gallery.innerHTML = '';
    stats.textContent = `找到 ${filteredData.length} 筆資料 (第 ${currentPage} 頁)`;

    if (filteredData.length === 0) {
        emptyState.classList.remove('hidden');
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    emptyState.classList.add('hidden');

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredData.slice(start, start + itemsPerPage);

    // 使用 DocumentFragment 提升渲染效能
    const fragment = document.createDocumentFragment();

    pageItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col';
        card.innerHTML = `
            <div class="img-container">
                <img src="${getThumbnail(item.url)}" 
                     loading="lazy" 
                     alt="${item.country || ''}" 
                     onerror="this.src='https://via.placeholder.com/400x260?text=Image+Not+Found'">
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm">${item.year || ''} (#${item.id || ''})</div>
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm">${item.region || ''}</div>
            </div>
            
            <div class="p-5 flex flex-col justify-between flex-grow bg-white border-t border-stone-50">
                ${(item.country || item.city || item.memo1) ? `
                    <h3 class="text-sm font-bold text-black mb-2" title="${item.title || ''}">
                        ${item.country ? `📍 ${item.country}` : ""}   
                        ${item.city ? ` ${item.city}` : ""}
                        ${item.memo1 ? `<br><p class="mt-1 text-xs font-semibold text-stone-600">🎯 ${item.memo1}</p>` : ""}
                    </h3>
                ` : ""}
                <a href="${item.url}" target="_blank" class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-auto">打開相簿</a>
            </div>
        `;
        fragment.appendChild(card);
    });

    gallery.appendChild(fragment);
    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const createBtn = (label, page, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.disabled = disabled;
        btn.className = `min-w-[40px] h-10 px-3 rounded-lg font-medium ${active ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-100'} ${disabled ? 'opacity-30' : 'hover:bg-blue-50'}`;
        btn.onclick = () => { currentPage = page; renderGallery(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        return btn;
    };

    const maxVisible = 8;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    container.appendChild(createBtn('«', 1, false, currentPage === 1));
    
    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createBtn(i, i, i === currentPage));
    }
    
    container.appendChild(createBtn('»', totalPages, false, currentPage === totalPages));
}

function handleFilter() {
    const r = document.getElementById('regionFilter').value;
    const c = document.getElementById('countryFilter').value;
    const city = document.getElementById('cityFilter').value; // 新增：讀取城市篩選值
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredData = rawData.filter(item => {
        // 1. 檢查區域、國家、城市篩選器條件
        const matchRegion = (r === 'all' || item.region === r);
        const matchCountry = (c === 'all' || item.country === c);
        const matchCity = (city === 'all' || item.city === city); // 新增：城市比對
        
        if (!matchRegion || !matchCountry || !matchCity) return false;

        // 2. 如果沒有關鍵字，直接通過
        if (!keyword) return true;

        // 建立搜尋目標文字
        const text = [item.country, item.region, item.city, item.memo1].join(' ').toLowerCase();

        // 3. AND 邏輯
        if (keyword.includes(' and ')) {
            const keywords = keyword.split(/\s+and\s+/i);
            return keywords.every(k => text.includes(k.trim()));
        }

        // 4. OR 邏輯
        if (keyword.includes(' or ')) {
            const keywords = keyword.split(/\s+or\s+/i);
            return keywords.some(k => text.includes(k.trim()));
        }

        // 5. 一般單一關鍵字搜尋
        return text.includes(keyword);
    });

    currentPage = 1;
    renderGallery();
}

window.onload = () => {
    initRegionFilter();
    updateCountryOptions('all'); // 初始化國家與城市選單
    
    // 綁定區域變動事件（連動國家與城市）
    document.getElementById('regionFilter').onchange = (e) => { 
        updateCountryOptions(e.target.value); 
        handleFilter(); 
    };
    
    // 綁定國家變動事件（連動城市）
    document.getElementById('countryFilter').onchange = (e) => {
        const selectedRegion = document.getElementById('regionFilter').value;
        updateCityOptions(selectedRegion, e.target.value);
        handleFilter();
    };

    // 新增：綁定城市變動事件
    document.getElementById('cityFilter').onchange = handleFilter;
    
    // 搜尋框事件
    document.getElementById('searchInput').oninput = handleFilter;

    // 重設按鈕
    document.getElementById('resetBtn').onclick = () => {
        document.getElementById('regionFilter').value = 'all';
        updateCountryOptions('all'); // 會一併重置 countryFilter 與 cityFilter
        document.getElementById('searchInput').value = '';
        filteredData = [...rawData];
        currentPage = 1;
        renderGallery();
    };

    renderGallery();
};

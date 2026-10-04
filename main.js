// main.js
let filteredData = [...rawData];
let currentPage = 1;
const itemsPerPage = 12;

function getThumbnail(url) {
    if (!url) return 'https://via.placeholder.com/400x260?text=No+Preview';
    
    const match = url.match(/\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}=w600`;
    }
    
    return 'https://via.placeholder.com/400x260?text=No+Preview';
}

// 初始化國家選單
function initCountryFilter() {
    const countrySelect = document.getElementById('countryFilter');
    const countries = [...new Set(rawData.map(d => d.country))].filter(Boolean).sort();
    countries.forEach(c => countrySelect.add(new Option(c, c)));
}

// 更新省/州選單（連動國家）
function updateProvinceOptions(selectedCountry) {
    const provinceSelect = document.getElementById('provinceFilter');
    provinceSelect.innerHTML = '<option value="all">所有省/州</option>';
    
    const availableProvinces = rawData
        .filter(item => selectedCountry === 'all' || item.country === selectedCountry)
        .map(item => item.province)
        .filter(Boolean);

    [...new Set(availableProvinces)].sort().forEach(p => provinceSelect.add(new Option(p, p)));
    
    updateCityOptions(selectedCountry, provinceSelect.value);
}

// 更新城市選單（連動國家與省/州）
function updateCityOptions(selectedCountry, selectedProvince) {
    const citySelect = document.getElementById('cityFilter');
    citySelect.innerHTML = '<option value="all">所有城市</option>';

    const availableCities = rawData
        .filter(item => {
            const matchCountry = (selectedCountry === 'all' || item.country === selectedCountry);
            const matchProvince = (selectedProvince === 'all' || item.province === selectedProvince);
            return matchCountry && matchProvince;
        })
        .map(item => item.city)
        .filter(Boolean);

    [...new Set(availableCities)].sort().forEach(c => citySelect.add(new Option(c, c)));
}

function renderGallery() {
    const gallery = document.getElementById('gallery');
    const stats = document.getElementById('stats');
    const emptyState = document.getElementById('emptyState');
    
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

    const fragment = document.createDocumentFragment();

	pageItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col';

    // 處理右上角國家標籤（若無 country 則不顯示）
    const countryBadgeHTML = item.country ? `
        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm">${item.country}</div>
    ` : '';

    // 組合第一行：province + city 串成一行（自動過濾空值）
    const provinceCityText = [item.province, item.city].filter(Boolean).join(' ');
    const locationRowHTML = provinceCityText ? `
        <div class="text-sm font-bold text-black mb-1">${provinceCityText}</div>
    ` : '';

    // 組合第二行：memo1（若無則不顯示）
    const memoRowHTML = item.memo1 ? `
        <p class="text-xs font-semibold text-stone-600">🎯 ${item.memo1}</p>
    ` : '';

    // 判斷是否需要顯示文字區塊（若 location 與 memo 皆無則隱藏）
    const hasInfo = provinceCityText || item.memo1;

    card.innerHTML = `
        <div class="img-container relative">
            <img src="${getThumbnail(item.url)}" 
                 loading="lazy" 
                 alt="${item.country || ''}" 
                 onerror="this.src='https://via.placeholder.com/400x260?text=Image+Not+Found'">
            <div class="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm">${item.year || ''} (#${item.id || ''})</div>
            ${countryBadgeHTML}
        </div>

        <div class="p-5 flex flex-col justify-between flex-grow bg-white border-t border-stone-50">
            ${hasInfo ? `
                <h3 class="mb-2">
                    ${locationRowHTML}${memoRowHTML}
                </h3>
            ` : ''}
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

    // 1. 最第一頁按鈕
    container.appendChild(createBtn('«', 1, false, currentPage === 1));

    // 2. 上一頁按鈕 (<)
    container.appendChild(createBtn('‹', Math.max(1, currentPage - 1), false, currentPage === 1));

    // 3. 中間數字頁碼
    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createBtn(i, i, i === currentPage));
    }

    // 4. 下一頁按鈕 (>)
    container.appendChild(createBtn('›', Math.min(totalPages, currentPage + 1), false, currentPage === totalPages));

    // 5. 最後一頁按鈕
    container.appendChild(createBtn('»', totalPages, false, currentPage === totalPages));
}

function handleFilter() {
    const c = document.getElementById('countryFilter').value;
    const p = document.getElementById('provinceFilter').value;
    const city = document.getElementById('cityFilter').value;
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredData = rawData.filter(item => {
        // 1. 檢查國家、省/州、城市篩選器條件
        const matchCountry = (c === 'all' || item.country === c);
        const matchProvince = (p === 'all' || item.province === p);
        const matchCity = (city === 'all' || item.city === city);
        
        if (!matchCountry || !matchProvince || !matchCity) return false;

        // 2. 如果沒有關鍵字，直接通過
        if (!keyword) return true;

        // 3. 建立搜尋目標文字（包含 region, country, province, city, memo1 五個欄位）
        const text = [item.region, item.country, item.province, item.city, item.memo1].join(' ').toLowerCase();

        // 4. AND 邏輯
        if (keyword.includes(' and ')) {
            const keywords = keyword.split(/\s+and\s+/i);
            return keywords.every(k => text.includes(k.trim()));
        }

        // 5. OR 邏輯
        if (keyword.includes(' or ')) {
            const keywords = keyword.split(/\s+or\s+/i);
            return keywords.some(k => text.includes(k.trim()));
        }

        // 6. 一般單一關鍵字搜尋
        return text.includes(keyword);
    });

    currentPage = 1;
    renderGallery();
}

window.onload = () => {
    initCountryFilter();
    updateProvinceOptions('all'); // 初始化省/州與城市選單
    
    // 綁定國家變動事件（連動省/州與城市）
    document.getElementById('countryFilter').onchange = (e) => { 
        updateProvinceOptions(e.target.value); 
        handleFilter(); 
    };
    
    // 綁定省/州變動事件（連動城市）
    document.getElementById('provinceFilter').onchange = (e) => {
        const selectedCountry = document.getElementById('countryFilter').value;
        updateCityOptions(selectedCountry, e.target.value);
        handleFilter();
    };

    // 綁定城市變動事件
    document.getElementById('cityFilter').onchange = handleFilter;
    
    // 搜尋框事件
    document.getElementById('searchInput').oninput = handleFilter;

    // 重設按鈕
    document.getElementById('resetBtn').onclick = () => {
        document.getElementById('countryFilter').value = 'all';
        updateProvinceOptions('all'); // 會一併重置 provinceFilter 與 cityFilter
        document.getElementById('searchInput').value = '';
        filteredData = [...rawData];
        currentPage = 1;
        renderGallery();
    };

    renderGallery();
};
let filteredData = [...rawData];
let currentPage = 1;
const itemsPerPage = 12;

document.addEventListener("DOMContentLoaded", () => {
    initCountryFilter();
    updateProvinceOptions('all');
    initCarousel(); // 初始化頂部輪播區

    document.getElementById('countryFilter').onchange = (e) => { 
        updateProvinceOptions(e.target.value); 
        handleFilter(); 
    };
    
    document.getElementById('provinceFilter').onchange = (e) => {
        const selectedCountry = document.getElementById('countryFilter').value;
        updateCityOptions(selectedCountry, e.target.value);
        handleFilter();
    };

    document.getElementById('cityFilter').onchange = handleFilter;
    document.getElementById('searchInput').oninput = handleFilter;

    document.getElementById('resetBtn').onclick = () => {
        document.getElementById('countryFilter').value = 'all';
        updateProvinceOptions('all');
        document.getElementById('searchInput').value = '';
        filteredData = [...rawData];
        currentPage = 1;
        renderGallery();
    };

    renderGallery();
    setupLightbox();
});

function getThumbnail(url) {
    if (!url) return 'https://via.placeholder.com/400x260?text=No+Preview';
    const match = url.match(/\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}=w600`;
    }
    return url;
}

// 隨機取 30 張照片進行頂部輪播
function initCarousel() {
    const track = document.getElementById('carousel-track');
    if (!track) return;

    const shuffled = [...rawData].sort(() => 0.5 - Math.random());
    const carouselItems = shuffled.slice(0, 30);
    const duplicatedItems = [...carouselItems, ...carouselItems];

    track.innerHTML = duplicatedItems.map(item => {
        const thumb = getThumbnail(item.url);
        return `
            <div class="w-48 h-32 mx-2 flex-shrink-0 overflow-hidden rounded shadow-sm border border-stone-800 bg-stone-900 relative group cursor-pointer" onclick="openLightbox(${item.id})">
              <img src="${thumb}" alt="${item.country || ''}" class="w-full h-full object-cover opacity-75 hover:opacity-100 transition-opacity duration-300">
            </div>
        `;
    }).join('');
}

function initCountryFilter() {
    const countrySelect = document.getElementById('countryFilter');
    const countries = [...new Set(rawData.map(d => d.country))].filter(Boolean).sort();
    countries.forEach(c => countrySelect.add(new Option(c, c)));
}

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

// 渲染照片網格
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
        card.className = 'glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col bg-white border border-stone-200';
        
        const countryBadgeHTML = item.country ? `
            <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm">${item.country}</div>
        ` : '';

        const provinceCityText = [item.province, item.city].filter(Boolean).join(' ');
        const locationRowHTML = provinceCityText ? `
            <div class="text-sm font-bold text-black mb-1">${provinceCityText}</div>
        ` : '';

        const memoRowHTML = item.memo1 ? `
            <p class="text-xs font-semibold text-stone-600">🎯 ${item.memo1}</p>
        ` : '';

        const hasInfo = provinceCityText || item.memo1;

        card.innerHTML = `
            <div onclick="openLightbox(${item.id})" class="img-container relative aspect-[4/3] overflow-hidden bg-stone-100 cursor-pointer">
                <img src="${getThumbnail(item.url)}" 
                     loading="lazy" 
                     alt="${item.country || ''}" 
                     class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
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
        btn.innerHTML = label;
        btn.disabled = disabled;
        btn.className = `min-w-[40px] h-10 px-3 rounded-lg font-medium ${active ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-100'} ${disabled ? 'opacity-30' : 'hover:bg-blue-50'}`;
        btn.onclick = () => { currentPage = page; renderGallery(); window.scrollTo({ top: 350, behavior: 'smooth' }); };
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
    container.appendChild(createBtn('‹', Math.max(1, currentPage - 1), false, currentPage === 1));
    
    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createBtn(i, i, i === currentPage));
    }
    
    container.appendChild(createBtn('›', Math.min(totalPages, currentPage + 1), false, currentPage === totalPages));
    container.appendChild(createBtn('»', totalPages, false, currentPage === totalPages));
}

function handleFilter() {
    const c = document.getElementById('countryFilter').value;
    const p = document.getElementById('provinceFilter').value;
    const city = document.getElementById('cityFilter').value;
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredData = rawData.filter(item => {
        const matchCountry = (c === 'all' || item.country === c);
        const matchProvince = (p === 'all' || item.province === p);
        const matchCity = (city === 'all' || item.city === city);
        
        if (!matchCountry || !matchProvince || !matchCity) return false;
        if (!keyword) return true;

        const text = [item.region, item.country, item.province, item.city, item.memo1].join(' ').toLowerCase();

        if (keyword.includes(' and ')) {
            const keywords = keyword.split(/\s+and\s+/i);
            return keywords.every(k => text.includes(k.trim()));
        }

        if (keyword.includes(' or ')) {
            const keywords = keyword.split(/\s+or\s+/i);
            return keywords.some(k => text.includes(k.trim()));
        }

        return text.includes(keyword);
    });

    currentPage = 1;
    renderGallery();
}

// 燈箱互動邏輯
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightbox-close');

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.id === 'lightbox-content-box') {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
            closeLightbox();
        }
    });
}

window.openLightbox = function(id) {
    const item = rawData.find(d => d.id === id);
    if (!item) return;

    const lightbox = document.getElementById('lightbox');
    const contentBox = document.getElementById('lightbox-content-box');
    const titleText = document.getElementById('lightbox-title');
    const categoryText = document.getElementById('lightbox-category');

    titleText.innerText = item.memo1 || item.city || item.country || '';
    categoryText.innerText = [item.country, item.province, item.city].filter(Boolean).join(' / ');

    lightbox.classList.remove('hidden');
    document.body.classList.add('overflow-hidden-lightbox');
    setTimeout(() => {
        lightbox.classList.remove('opacity-0');
    }, 10);

    const fullImgUrl = getThumbnail(item.url);
    contentBox.innerHTML = `
      <img src="${fullImgUrl}" alt="" class="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl">
    `;
};

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const contentBox = document.getElementById('lightbox-content-box');

    lightbox.classList.add('opacity-0');
    document.body.classList.remove('overflow-hidden-lightbox');
    
    setTimeout(() => {
        lightbox.classList.add('hidden');
        contentBox.innerHTML = ''; 
    }, 300);
}
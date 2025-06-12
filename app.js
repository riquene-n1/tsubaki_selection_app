// Tsubaki Chain Database Application
class TsubakiDatabase {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.currentSection = 'home';
        this.currentTheme = 'dark';
        this.user = null;
        this.searchHistory = [];
        this.bookmarks = [];
        this.categories = {
            "Drive Chain": 98,
            "Sprocket": 11953,
            "Conveyor Chain": 20,
            "Timing Belt": 40,
            "Reducer": 7,
            "Coupling": 9,
            "Linear Actuator": 8,
            "Cable Carrier": 5
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupTheme();
        this.loadUserFromStorage();
        this.updateUserUI();
        this.renderCategories();
        
        // Load products with timeout
        try {
            await Promise.race([
                this.loadProducts(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
        } catch (error) {
            console.log('외부 데이터 로딩 실패, 샘플 데이터 사용:', error.message);
            this.loadSampleData();
        }
        
        this.setupFilters();
        this.showLoading(false);
        this.renderSearchHistory();
        this.renderBookmarks();
        if (this.currentSection === 'products') {
            this.renderProducts();
        }
    }
    
    async loadProducts() {
        try {
            this.showLoading(true);
            const response = await fetch('https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/45eddab68ce2b005c5a899efc3cad59c/45b16cfd-cd75-478b-854a-40e5e8c8a30f/0aeef7cb.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.products = data.products || [];
            this.filteredProducts = [...this.products];
            
            // Update total count with actual data
            document.getElementById('totalProducts').textContent = this.products.length.toLocaleString();
            
            console.log(`로딩된 제품 수: ${this.products.length}`);
            return true;
        } catch (error) {
            console.error('제품 데이터 로딩 실패:', error);
            throw error;
        }
    }
    
    loadSampleData() {
        // Generate more comprehensive sample data
        const sampleProducts = [];
        const categories = Object.keys(this.categories);
        const series = ['RS Standard', 'LAMBDA', 'NEPTUNE', 'Super', 'Stainless'];
        const materials = ['Carbon Steel', 'Stainless Steel', 'Nickel Plated'];
        const pitches = [6.35, 9.525, 12.7, 15.875, 19.05, 25.4, 31.75, 38.1, 50.8];
        
        // Generate sample products for each category
        categories.forEach((category, catIndex) => {
            const count = Math.min(this.categories[category], 100); // Limit to 100 per category for demo
            
            for (let i = 0; i < count; i++) {
                const product = {
                    id: `TSK_${String(catIndex * 1000 + i + 1).padStart(4, '0')}`,
                    category: category,
                    series: series[i % series.length],
                    model: `${category.replace(' ', '').substring(0, 2).toUpperCase()}${i + 1}-${Math.floor(Math.random() * 100)}`,
                    name: `${category} ${series[i % series.length]} Model ${i + 1}`,
                    specifications: {
                        pitch_mm: pitches[i % pitches.length],
                        material: materials[i % materials.length],
                        temperature_range: "-20°C to 120°C"
                    },
                    features: ["고품질", "내구성", "정밀가공"],
                    applications: ["산업용", "제조업", "자동화"],
                    tsubaki_code: `TSK-${category.replace(' ', '').substring(0, 2).toUpperCase()}-${i + 1}`
                };
                
                // Add category-specific specifications
                if (category === 'Drive Chain') {
                    product.specifications.strands = Math.floor(Math.random() * 3) + 1;
                    product.specifications.tensile_strength_kn = 50 + Math.random() * 100;
                } else if (category === 'Sprocket') {
                    product.specifications.tooth_count = 10 + Math.floor(Math.random() * 40);
                    product.specifications.hub_type = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
                }
                
                sampleProducts.push(product);
            }
        });
        
        this.products = sampleProducts;
        this.filteredProducts = [...this.products];
        
        // Update total count
        document.getElementById('totalProducts').textContent = this.products.length.toLocaleString();
        console.log(`샘플 데이터 로딩 완료: ${this.products.length}개 제품`);
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.navigateToSection(section);
            });
        });
        
        // Back to home buttons
        const backToHomeBtn = document.getElementById('backToHome');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => this.navigateToSection('home'));
        }
        
        const backToHomeFromCalcBtn = document.getElementById('backToHomeFromCalc');
        if (backToHomeFromCalcBtn) {
            backToHomeFromCalcBtn.addEventListener('click', () => this.navigateToSection('home'));
        }
        
        const backToHomeFromGuideBtn = document.getElementById('backToHomeFromGuide');
        if (backToHomeFromGuideBtn) {
            backToHomeFromGuideBtn.addEventListener('click', () => this.navigateToSection('home'));
        }
        
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        const mainSearch = document.getElementById('mainSearch');
        if (mainSearch) {
            mainSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }
        
        // Filters
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const seriesFilter = document.getElementById('seriesFilter');
        if (seriesFilter) {
            seriesFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const pitchFilter = document.getElementById('pitchFilter');
        if (pitchFilter) {
            pitchFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const materialFilter = document.getElementById('materialFilter');
        if (materialFilter) {
            materialFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Modal
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        
        const modalBackdrop = document.getElementById('modalBackdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.closeModal());
        }
        
        // Calculator tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchCalculatorTab(tab);
            });
        });
        
        // Export
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Auth buttons
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const loginModalClose = document.getElementById('loginModalClose');
        if (loginModalClose) {
            loginModalClose.addEventListener('click', () => this.closeLoginModal());
        }

        const loginModalBackdrop = document.getElementById('loginModalBackdrop');
        if (loginModalBackdrop) {
            loginModalBackdrop.addEventListener('click', () => this.closeLoginModal());
        }

        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => {
                const id = document.getElementById('adminId').value;
                const pw = document.getElementById('adminPw').value;
                this.loginAdmin(id, pw);
            });
        }

        const googleLogin = document.getElementById('googleLogin');
        if (googleLogin) {
            googleLogin.addEventListener('click', () => this.mockGoogleLogin());
        }

        const kakaoLogin = document.getElementById('kakaoLogin');
        if (kakaoLogin) {
            kakaoLogin.addEventListener('click', () => this.mockKakaoLogin());
        }
    }
    
    setupTheme() {
        // Set initial theme to dark
        document.documentElement.setAttribute('data-color-scheme', this.currentTheme);
        this.updateThemeButton();
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', this.currentTheme);
        this.updateThemeButton();
    }
    
    updateThemeButton() {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.textContent = this.currentTheme === 'dark' ? '☀️ 라이트모드' : '🌙 다크모드';
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) modal.classList.remove('hidden');
    }

    closeLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) modal.classList.add('hidden');
    }

    mockGoogleLogin() {
        this.user = { name: 'GoogleUser', provider: 'google', isAdmin: false };
        this.afterLogin();
    }

    mockKakaoLogin() {
        this.user = { name: 'KakaoUser', provider: 'kakao', isAdmin: false };
        this.afterLogin();
    }

    loginAdmin(id, pw) {
        if (id === 'admin' && pw === 'admin') {
            this.user = { name: 'admin', provider: 'admin', isAdmin: true };
            this.afterLogin();
        } else {
            alert('잘못된 관리자 정보입니다.');
        }
    }

    afterLogin() {
        this.closeLoginModal();
        this.loadUserData();
        this.updateUserUI();
        this.renderSearchHistory();
        this.renderBookmarks();
        if (this.currentSection === 'products') {
            this.renderProducts();
        }
    }

    logout() {
        this.user = null;
        localStorage.removeItem('currentUser');
        this.updateUserUI();
        this.searchHistory = [];
        this.bookmarks = [];
        this.renderSearchHistory();
        this.renderBookmarks();
    }

    updateUserUI() {
        const info = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!info || !loginBtn || !logoutBtn) return;

        if (this.user) {
            info.textContent = `${this.user.name} 님`;
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
        } else {
            info.textContent = '';
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
        }
    }

    loadUserFromStorage() {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            this.user = JSON.parse(stored);
            this.loadUserData();
        }
    }

    loadUserData() {
        if (!this.user) return;
        const hist = localStorage.getItem(`history_${this.user.name}`);
        const bm = localStorage.getItem(`bookmarks_${this.user.name}`);
        this.searchHistory = hist ? JSON.parse(hist) : [];
        this.bookmarks = bm ? JSON.parse(bm) : [];
        localStorage.setItem('currentUser', JSON.stringify(this.user));
    }

    saveUserData() {
        if (!this.user) return;
        localStorage.setItem(`history_${this.user.name}`,
            JSON.stringify(this.searchHistory));
        localStorage.setItem(`bookmarks_${this.user.name}`,
            JSON.stringify(this.bookmarks));
        localStorage.setItem('currentUser', JSON.stringify(this.user));
    }
    
    navigateToSection(section) {
        // Hide all sections
        const sections = document.querySelectorAll('.hero, .categories, .products-section, .calculator-section, .guide-section');
        sections.forEach(el => {
            el.classList.add('hidden');
        });
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected section
        this.currentSection = section;
        
        switch (section) {
            case 'home':
                const heroSection = document.querySelector('.hero');
                const categoriesSection = document.querySelector('.categories');
                if (heroSection) heroSection.classList.remove('hidden');
                if (categoriesSection) categoriesSection.classList.remove('hidden');
                break;
            case 'products':
                const productsSection = document.getElementById('productsSection');
                if (productsSection) {
                    productsSection.classList.remove('hidden');
                    this.renderProducts();
                }
                break;
            case 'calculator':
                const calculatorSection = document.getElementById('calculatorSection');
                if (calculatorSection) calculatorSection.classList.remove('hidden');
                break;
            case 'guide':
                const guideSection = document.getElementById('guideSection');
                if (guideSection) guideSection.classList.remove('hidden');
                break;
        }
        
        // Update active nav item
        const navItem = document.querySelector(`[data-section="${section}"]`);
        if (navItem) navItem.classList.add('active');
    }
    
    renderCategories() {
        const grid = document.getElementById('categoryGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        Object.entries(this.categories).forEach(([category, count]) => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <div class="category-card__header">
                    <h4 class="category-card__title">${category}</h4>
                    <div class="category-card__count">${count.toLocaleString()}</div>
                </div>
                <div class="category-card__description">
                    ${this.getCategoryDescription(category)}
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.filterByCategory(category);
                this.navigateToSection('products');
            });
            
            grid.appendChild(card);
        });
    }
    
    getCategoryDescription(category) {
        const descriptions = {
            "Drive Chain": "고품질 드라이브 체인 - 산업용 전력 전달 솔루션",
            "Sprocket": "정밀 가공 스프로켓 - 다양한 체인과 호환",
            "Conveyor Chain": "컨베이어 체인 - 물질 이송 시스템용",
            "Timing Belt": "타이밍 벨트 - 정확한 동기 전력 전달",
            "Reducer": "감속기 - 효율적인 속도 제어",
            "Coupling": "커플링 - 축 연결 솔루션",
            "Linear Actuator": "리니어 액추에이터 - 직선 운동 제어",
            "Cable Carrier": "케이블 캐리어 - 케이블 보호 시스템"
        };
        return descriptions[category] || "고품질 산업용 제품";
    }
    
    setupFilters() {
        if (this.products.length === 0) return;
        
        // Setup category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            // Clear existing options except first one
            categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
            const categories = [...new Set(this.products.map(p => p.category))];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
        
        // Setup series filter
        const seriesFilter = document.getElementById('seriesFilter');
        if (seriesFilter) {
            seriesFilter.innerHTML = '<option value="">모든 시리즈</option>';
            const series = [...new Set(this.products.map(p => p.series).filter(Boolean))];
            series.forEach(s => {
                const option = document.createElement('option');
                option.value = s;
                option.textContent = s;
                seriesFilter.appendChild(option);
            });
        }
        
        // Setup pitch filter
        const pitchFilter = document.getElementById('pitchFilter');
        if (pitchFilter) {
            pitchFilter.innerHTML = '<option value="">모든 피치</option>';
            const pitches = [...new Set(this.products.map(p => p.specifications?.pitch_mm).filter(Boolean))];
            pitches.sort((a, b) => a - b).forEach(pitch => {
                const option = document.createElement('option');
                option.value = pitch;
                option.textContent = `${pitch}mm`;
                pitchFilter.appendChild(option);
            });
        }
        
        // Setup material filter
        const materialFilter = document.getElementById('materialFilter');
        if (materialFilter) {
            materialFilter.innerHTML = '<option value="">모든 재료</option>';
            const materials = [...new Set(this.products.map(p => p.specifications?.material).filter(Boolean))];
            materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material;
                option.textContent = material;
                materialFilter.appendChild(option);
            });
        }
    }
    
    performSearch(query) {
        const mainSearch = document.getElementById('mainSearch');
        if (!mainSearch) return;

        const q = (query ?? mainSearch.value).trim().toLowerCase();
        if (!q) return;

        mainSearch.value = q;
        this.addSearchHistory(q);

        this.filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(q) ||
            product.model.toLowerCase().includes(q) ||
            product.tsubaki_code.toLowerCase().includes(q) ||
            product.category.toLowerCase().includes(q)
        );

        this.currentPage = 1;
        this.navigateToSection('products');
    }
    
    filterByCategory(category) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = category;
        }
        this.applyFilters();
    }
    
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const seriesFilter = document.getElementById('seriesFilter');
        const pitchFilter = document.getElementById('pitchFilter');
        const materialFilter = document.getElementById('materialFilter');
        
        const categoryValue = categoryFilter ? categoryFilter.value : '';
        const seriesValue = seriesFilter ? seriesFilter.value : '';
        const pitchValue = pitchFilter ? pitchFilter.value : '';
        const materialValue = materialFilter ? materialFilter.value : '';
        
        this.filteredProducts = this.products.filter(product => {
            return (!categoryValue || product.category === categoryValue) &&
                   (!seriesValue || product.series === seriesValue) &&
                   (!pitchValue || product.specifications?.pitch_mm == pitchValue) &&
                   (!materialValue || product.specifications?.material === materialValue);
        });
        
        this.currentPage = 1;
        this.renderProducts();
    }
    
    clearFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const seriesFilter = document.getElementById('seriesFilter');
        const pitchFilter = document.getElementById('pitchFilter');
        const materialFilter = document.getElementById('materialFilter');
        
        if (categoryFilter) categoryFilter.value = '';
        if (seriesFilter) seriesFilter.value = '';
        if (pitchFilter) pitchFilter.value = '';
        if (materialFilter) materialFilter.value = '';
        
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.renderProducts();
    }
    
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const resultsCount = document.getElementById('resultsCount');
        
        if (!grid || !resultsCount) return;
        
        // Update results count
        resultsCount.textContent = `${this.filteredProducts.length.toLocaleString()}개 제품`;
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);
        
        // Render products
        grid.innerHTML = '';
        
        pageProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = this.createProductCardHTML(product);
            const bookmarkBtn = card.querySelector('.bookmark-btn');
            if (bookmarkBtn) {
                bookmarkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleBookmark(product);
                });
                if (this.bookmarks.find(b => b.id === product.id)) {
                    bookmarkBtn.classList.add('active');
                }
            }

            card.addEventListener('click', () => this.showProductDetails(product));
            grid.appendChild(card);
        });
        
        this.renderPagination();
    }
    
    createProductCardHTML(product) {
        return `
            <button class="bookmark-btn">★</button>
            <div class="product-card__header">
                <h4 class="product-card__title">${product.name}</h4>
                <div class="product-card__code">${product.tsubaki_code}</div>
            </div>
            <div class="product-card__body">
                <ul class="product-specs">
                    <li>
                        <span class="spec-label">카테고리</span>
                        <span class="spec-value">${product.category}</span>
                    </li>
                    <li>
                        <span class="spec-label">시리즈</span>
                        <span class="spec-value">${product.series || 'N/A'}</span>
                    </li>
                    ${product.specifications?.pitch_mm ? `
                    <li>
                        <span class="spec-label">피치</span>
                        <span class="spec-value">${product.specifications.pitch_mm}mm</span>
                    </li>
                    ` : ''}
                    ${product.specifications?.material ? `
                    <li>
                        <span class="spec-label">재료</span>
                        <span class="spec-value">${product.specifications.material}</span>
                    </li>
                    ` : ''}
                </ul>
                ${product.features ? `
                <div class="feature-tags">
                    ${product.features.slice(0, 3).map(feature => 
                        `<span class="feature-tag">${feature}</span>`
                    ).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
        
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = '이전';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderProducts();
            }
        });
        pagination.appendChild(prevBtn);
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.renderProducts();
            });
            pagination.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = '다음';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderProducts();
            }
        });
        pagination.appendChild(nextBtn);
    }
    
    showProductDetails(product) {
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) return;
        
        modalTitle.textContent = product.name;
        modalBody.innerHTML = this.createProductDetailsHTML(product);
        
        modal.classList.remove('hidden');
    }
    
    createProductDetailsHTML(product) {
        return `
            <div class="product-details">
                <div class="detail-section">
                    <h4>기본 정보</h4>
                    <ul class="product-specs">
                        <li>
                            <span class="spec-label">Tsubaki 코드</span>
                            <span class="spec-value">${product.tsubaki_code}</span>
                        </li>
                        <li>
                            <span class="spec-label">모델</span>
                            <span class="spec-value">${product.model}</span>
                        </li>
                        <li>
                            <span class="spec-label">카테고리</span>
                            <span class="spec-value">${product.category}</span>
                        </li>
                        <li>
                            <span class="spec-label">시리즈</span>
                            <span class="spec-value">${product.series || 'N/A'}</span>
                        </li>
                    </ul>
                </div>
                
                ${product.specifications ? `
                <div class="detail-section">
                    <h4>기술 사양</h4>
                    <ul class="product-specs">
                        ${Object.entries(product.specifications).map(([key, value]) => `
                            <li>
                                <span class="spec-label">${this.formatSpecLabel(key)}</span>
                                <span class="spec-value">${value}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${product.features ? `
                <div class="detail-section">
                    <h4>주요 특징</h4>
                    <ul style="list-style: disc; padding-left: 20px;">
                        ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${product.applications ? `
                <div class="detail-section">
                    <h4>응용 분야</h4>
                    <ul style="list-style: disc; padding-left: 20px;">
                        ${product.applications.map(app => `<li>${app}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    formatSpecLabel(key) {
        const labels = {
            pitch_mm: '피치 (mm)',
            pitch_inch: '피치 (inch)',
            strands: '스트랜드 수',
            tensile_strength_kn: '인장강도 (kN)',
            allowable_load_kn: '허용하중 (kN)',
            weight_kg_per_m: '중량 (kg/m)',
            material: '재료',
            temperature_range: '온도 범위',
            compatible_chain: '호환 체인',
            tooth_count: '잇수',
            pitch_diameter_mm: '피치 직경 (mm)',
            outside_diameter_mm: '외경 (mm)',
            hub_type: '허브 타입',
            hardness: '경도',
            lubrication: '윤활'
        };
        return labels[key] || key;
    }
    
    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    switchCalculatorTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Show/hide panels
        document.querySelectorAll('.calculator-panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        
        if (tab === 'scientific') {
            const scientificCalc = document.getElementById('scientificCalc');
            if (scientificCalc) scientificCalc.classList.remove('hidden');
        } else if (tab === 'chain') {
            const chainCalc = document.getElementById('chainCalc');
            if (chainCalc) chainCalc.classList.remove('hidden');
        }
    }
    
    exportData() {
        const csvContent = this.convertToCSV(this.filteredProducts);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'tsubaki_products.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    convertToCSV(products) {
        const headers = ['ID', '이름', '모델', '카테고리', '시리즈', 'Tsubaki 코드'];
        const csvRows = [headers.join(',')];
        
        products.forEach(product => {
            const row = [
                product.id,
                `"${product.name}"`,
                `"${product.model}"`,
                product.category,
                product.series || '',
                product.tsubaki_code
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    addSearchHistory(query) {
        if (!this.user) return;
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > 20) this.searchHistory.pop();
        this.saveUserData();
        this.renderSearchHistory();
    }

    renderSearchHistory() {
        const section = document.getElementById('historySection');
        const list = document.getElementById('searchHistory');
        if (!section || !list) return;

        if (!this.user || this.searchHistory.length === 0) {
            section.classList.add('hidden');
            list.innerHTML = '';
            return;
        }

        section.classList.remove('hidden');
        list.innerHTML = '';
        this.searchHistory.forEach(q => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'history-item';
            btn.textContent = q;
            btn.addEventListener('click', () => this.performSearch(q));
            li.appendChild(btn);
            list.appendChild(li);
        });
    }

    toggleBookmark(product) {
        if (!this.user) return;
        const idx = this.bookmarks.findIndex(b => b.id === product.id);
        if (idx >= 0) {
            this.bookmarks.splice(idx, 1);
        } else {
            this.bookmarks.push({ id: product.id, name: product.name });
        }
        this.saveUserData();
        this.renderBookmarks();
        this.renderProducts();
    }

    renderBookmarks() {
        const section = document.getElementById('historySection');
        const list = document.getElementById('bookmarkList');
        if (!section || !list) return;

        if (!this.user || this.bookmarks.length === 0 && this.searchHistory.length === 0) {
            section.classList.add('hidden');
        } else {
            section.classList.remove('hidden');
        }

        list.innerHTML = '';
        this.bookmarks.forEach(b => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'bookmark-item';
            btn.textContent = b.name;
            btn.addEventListener('click', () => {
                const product = this.products.find(p => p.id === b.id);
                if (product) this.showProductDetails(product);
            });
            li.appendChild(btn);
            list.appendChild(li);
        });
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    }
}

// Calculator Functions
function clearCalc() {
    const display = document.getElementById('calcDisplay');
    if (display) {
        display.value = '';
    }
}

function deleteLast() {
    const display = document.getElementById('calcDisplay');
    if (display) {
        display.value = display.value.slice(0, -1);
    }
}

function appendToCalc(value) {
    const display = document.getElementById('calcDisplay');
    if (display) {
        display.value += value;
    }
}

function calculateResult() {
    const display = document.getElementById('calcDisplay');
    if (!display) return;
    
    try {
        // Replace × with * for evaluation
        const expression = display.value.replace(/×/g, '*');
        const result = eval(expression);
        display.value = result;
    } catch (error) {
        display.value = 'Error';
    }
}

function calculateChainSpeed() {
    const pitchInput = document.getElementById('pitch');
    const teethInput = document.getElementById('teeth');
    const rpmInput = document.getElementById('rpm');
    const resultDiv = document.getElementById('speedResult');
    
    if (!pitchInput || !teethInput || !rpmInput || !resultDiv) return;
    
    const pitch = parseFloat(pitchInput.value);
    const teeth = parseFloat(teethInput.value);
    const rpm = parseFloat(rpmInput.value);
    
    if (isNaN(pitch) || isNaN(teeth) || isNaN(rpm)) {
        resultDiv.innerHTML = '<span style="color: red;">모든 값을 입력해주세요.</span>';
        return;
    }
    
    // V = (P × Z × N) / 1000
    const speed = (pitch * teeth * rpm) / 1000;
    
    resultDiv.innerHTML = `
        <strong>체인 속도: ${speed.toFixed(2)} m/min</strong><br>
        <small>계산식: V = (${pitch} × ${teeth} × ${rpm}) / 1000 = ${speed.toFixed(2)} m/min</small>
    `;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tsubakiApp = new TsubakiDatabase();
    if (window.Kakao && !Kakao.isInitialized()) {
        Kakao.init('YOUR_KAKAO_API_KEY');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('productModal');
        if (modal && !modal.classList.contains('hidden')) {
            window.tsubakiApp.closeModal();
        }
    }
    
    // Ctrl+F to focus search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('mainSearch');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

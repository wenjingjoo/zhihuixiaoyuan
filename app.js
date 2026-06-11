// ============================================
// 智慧校园生活平台 - 核心交互逻辑
// ============================================

// ========== 通用工具函数 ==========

// 生成星级评分HTML
function generateStars(rating) {
  let html = '';
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  for (let i = 0; i < fullStars; i++) {
    html += '<i class="fas fa-star"></i>';
  }
  if (halfStar) {
    html += '<i class="fas fa-star-half-alt"></i>';
  }
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    html += '<i class="far fa-star empty"></i>';
  }
  return html;
}

// 生成商家卡片HTML
function generateMerchantCard(merchant) {
  return `
    <div class="merchant-card animate-in" onclick="window.location.href='detail.html?id=${merchant.id}'">
      <div class="merchant-card-image">
        <img src="${merchant.image}" alt="${merchant.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(merchant.name)}'">
        ${merchant.featured ? '<span class="merchant-card-badge"><i class="fas fa-star"></i> 推荐</span>' : ''}
        <span class="merchant-card-category">${merchant.categoryName}</span>
      </div>
      <div class="merchant-card-body">
        <h3 class="merchant-card-name">${merchant.name}</h3>
        <div class="merchant-card-rating">
          <div class="merchant-card-stars">${generateStars(merchant.rating)}</div>
          <span class="merchant-card-score">${merchant.rating}</span>
          <span class="merchant-card-reviews">(${merchant.reviews}条评价)</span>
        </div>
        <div class="merchant-card-tags">
          ${merchant.tags.map(tag => `<span class="merchant-card-tag">${tag}</span>`).join('')}
        </div>
        <div class="merchant-card-info">
          <span class="merchant-card-address"><i class="fas fa-map-marker-alt"></i> ${merchant.address}</span>
          <span class="merchant-card-hours"><i class="fas fa-clock"></i> ${merchant.hours.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  `;
}

// ========== 首页函数 ==========

// 渲染分类网格
function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;

  grid.innerHTML = CAMPUS_DATA.categories.map(cat => `
    <div class="category-item animate-in" onclick="window.location.href='merchants.html?category=${cat.id}'">
      <div class="category-icon" style="background: linear-gradient(135deg, ${cat.color}, ${cat.color}dd);">
        <i class="${cat.icon}"></i>
      </div>
      <span class="category-name">${cat.name}</span>
    </div>
  `).join('');
}

// 渲染推荐商家
function renderFeaturedMerchants() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  const featured = CAMPUS_DATA.merchants.filter(m => m.featured).slice(0, 8);
  grid.innerHTML = featured.map(m => generateMerchantCard(m)).join('');
}

// 渲染热门商家
function renderHotMerchants() {
  const grid = document.getElementById('hotGrid');
  if (!grid) return;

  const hot = [...CAMPUS_DATA.merchants]
    .sort((a, b) => b.hotIndex - a.hotIndex)
    .slice(0, 8);
  grid.innerHTML = hot.map(m => generateMerchantCard(m)).join('');
}

// 渲染公告
function renderAnnouncements() {
  const list = document.getElementById('announcementList');
  if (!list) return;

  const typeMap = {
    activity: '活动',
    notice: '通知',
    new: '新商家'
  };

  list.innerHTML = CAMPUS_DATA.announcements.map(a => `
    <div class="announcement-item animate-in">
      <span class="announcement-type ${a.type}">${typeMap[a.type] || '公告'}</span>
      <div class="announcement-content">
        <div class="announcement-title">${a.title}</div>
        <div class="announcement-desc">${a.content}</div>
      </div>
      <span class="announcement-date">${a.date}</span>
    </div>
  `).join('');
}

// 数字动画
function animateStats() {
  const totalServices = CAMPUS_DATA.merchants.reduce((sum, m) => sum + m.services.length, 0);
  const targets = {
    statMerchants: CAMPUS_DATA.merchants.length,
    statCategories: CAMPUS_DATA.categories.length - 1, // 减去"全部"
    statServices: totalServices
  };

  Object.entries(targets).forEach(([id, target]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current;
    }, 30);
  });
}

// ========== 商家列表页函数 ==========

let currentCategory = 'all';
let currentSort = 'default';
let currentSearch = '';

function initMerchantsPage() {
  // 从URL获取分类参数
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  const searchParam = params.get('search');

  if (categoryParam) {
    currentCategory = categoryParam;
  }
  if (searchParam) {
    currentSearch = searchParam;
    const searchInput = document.getElementById('navSearch');
    if (searchInput) searchInput.value = searchParam;
  }

  renderFilterButtons();
  renderMerchantList();
  initScrollEffects();
}

// 渲染筛选按钮
function renderFilterButtons() {
  const container = document.getElementById('filterCategories');
  if (!container) return;

  container.innerHTML = CAMPUS_DATA.categories.map(cat => `
    <button class="filter-btn ${cat.id === currentCategory ? 'active' : ''}"
            onclick="filterByCategory('${cat.id}')">
      <i class="${cat.icon}" style="margin-right:4px;"></i> ${cat.name}
    </button>
  `).join('');
}

// 按分类筛选
function filterByCategory(categoryId) {
  currentCategory = categoryId;
  renderFilterButtons();
  renderMerchantList();
}

// 排序
function handleSort() {
  const select = document.getElementById('sortSelect');
  if (select) {
    currentSort = select.value;
  }
  renderMerchantList();
}

// 渲染商家列表
function renderMerchantList() {
  const grid = document.getElementById('merchantGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  let merchants = [...CAMPUS_DATA.merchants];

  // 分类筛选
  if (currentCategory !== 'all') {
    merchants = merchants.filter(m => m.category === currentCategory);
  }

  // 搜索筛选
  if (currentSearch) {
    const keyword = currentSearch.toLowerCase();
    merchants = merchants.filter(m =>
      m.name.toLowerCase().includes(keyword) ||
      m.categoryName.toLowerCase().includes(keyword) ||
      m.tags.some(t => t.toLowerCase().includes(keyword)) ||
      m.description.toLowerCase().includes(keyword)
    );
  }

  // 排序
  switch (currentSort) {
    case 'rating':
      merchants.sort((a, b) => b.rating - a.rating);
      break;
    case 'reviews':
      merchants.sort((a, b) => b.reviews - a.reviews);
      break;
    case 'hot':
      merchants.sort((a, b) => b.hotIndex - a.hotIndex);
      break;
    default:
      // 默认排序：推荐优先
      merchants.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.hotIndex - a.hotIndex);
  }

  if (merchants.length === 0) {
    grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    grid.innerHTML = merchants.map(m => generateMerchantCard(m)).join('');
  }
}

// ========== 详情页函数 ==========

function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const merchantId = parseInt(params.get('id'));

  if (!merchantId) {
    window.location.href = 'merchants.html';
    return;
  }

  const merchant = CAMPUS_DATA.merchants.find(m => m.id === merchantId);
  if (!merchant) {
    window.location.href = 'merchants.html';
    return;
  }

  // 更新页面标题
  document.title = `${merchant.name} - 智慧校园生活平台`;

  // 填充基本信息
  document.getElementById('detailImage').src = merchant.image;
  document.getElementById('detailImage').alt = merchant.name;
  document.getElementById('detailName').textContent = merchant.name;
  document.getElementById('detailCategoryName').textContent = merchant.categoryName;
  document.getElementById('detailScore').textContent = merchant.rating;
  document.getElementById('detailStars').innerHTML = generateStars(merchant.rating);
  document.getElementById('detailCount').textContent = `${merchant.reviews}条评价`;
  document.getElementById('detailDesc').textContent = merchant.description;
  document.getElementById('detailAddress').textContent = merchant.address;
  document.getElementById('detailHours').textContent = merchant.hours;
  document.getElementById('detailPhone').textContent = merchant.phone;
  document.getElementById('detailCategory').textContent = merchant.categoryName;

  // 服务项目
  const servicesEl = document.getElementById('detailServices');
  servicesEl.innerHTML = merchant.services.map(s => `
    <span class="detail-service-tag"><i class="fas fa-check" style="margin-right:4px;"></i>${s}</span>
  `).join('');

  // 标签
  const tagsEl = document.getElementById('detailTags');
  tagsEl.innerHTML = merchant.tags.map(t => `
    <span class="detail-service-tag"><i class="fas fa-tag" style="margin-right:4px;"></i>${t}</span>
  `).join('');

  // 模拟评价
  renderReviews(merchant);

  // 同类推荐
  renderRelatedMerchants(merchant);

  // 图片加载失败处理
  document.getElementById('detailImage').onerror = function() {
    this.src = `https://via.placeholder.com/1200x300/667eea/ffffff?text=${encodeURIComponent(merchant.name)}`;
  };

  initScrollEffects();
}

// 渲染模拟评价
function renderReviews(merchant) {
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;

  const mockReviews = [
    {
      user: '小明',
      avatar: 'M',
      rating: 5,
      date: '2024-06-01',
      text: '非常好！服务态度很棒，环境也很干净整洁，强烈推荐给同学们！'
    },
    {
      user: '小红',
      avatar: 'H',
      rating: 4,
      date: '2024-05-28',
      text: '整体不错，价格也比较合理，就是高峰期人有点多，建议错峰前往。'
    },
    {
      user: '阿杰',
      avatar: 'J',
      rating: 5,
      date: '2024-05-20',
      text: '已经来了很多次了，每次体验都很好，是校园里不可多得的好地方！'
    },
    {
      user: '小雪',
      avatar: 'X',
      rating: 4,
      date: '2024-05-15',
      text: '位置很好找，服务项目丰富，工作人员态度友好，会继续光顾的。'
    }
  ];

  reviewList.innerHTML = mockReviews.map(r => `
    <div class="review-item">
      <div class="review-header">
        <div class="review-avatar">${r.avatar}</div>
        <span class="review-user">${r.user}</span>
        <span class="review-date">${r.date}</span>
      </div>
      <div class="review-stars">${generateStars(r.rating)}</div>
      <p class="review-text">${r.text}</p>
    </div>
  `).join('');
}

// 渲染同类推荐
function renderRelatedMerchants(merchant) {
  const container = document.getElementById('relatedMerchants');
  if (!container) return;

  const related = CAMPUS_DATA.merchants
    .filter(m => m.category === merchant.category && m.id !== merchant.id)
    .slice(0, 3);

  if (related.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-light);text-align:center;padding:12px;">暂无同类商家</p>';
    return;
  }

  container.innerHTML = related.map(m => `
    <a href="detail.html?id=${m.id}" style="display:flex;gap:12px;align-items:center;padding:10px;border-radius:var(--radius-sm);transition:var(--transition);border:1px solid var(--border-color);"
       onmouseover="this.style.borderColor='rgba(102,126,234,0.3)';this.style.boxShadow='var(--shadow-sm)'"
       onmouseout="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
      <img src="${m.image}" alt="${m.name}" style="width:56px;height:56px;border-radius:var(--radius-sm);object-fit:cover;"
           onerror="this.src='https://via.placeholder.com/56x56/667eea/ffffff?text=${encodeURIComponent(m.name.charAt(0))}'">
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
          <i class="fas fa-star" style="color:#ffc107;font-size:11px;"></i> ${m.rating} · ${m.reviews}条评价
        </div>
      </div>
      <i class="fas fa-chevron-right" style="color:var(--text-light);font-size:12px;"></i>
    </a>
  `).join('');
}

// ========== 搜索功能 ==========

function handleHeroSearch() {
  const input = document.getElementById('heroSearch');
  if (input && input.value.trim()) {
    window.location.href = `merchants.html?search=${encodeURIComponent(input.value.trim())}`;
  }
}

function handleNavSearch() {
  const input = document.getElementById('navSearch');
  if (input && input.value.trim()) {
    window.location.href = `merchants.html?search=${encodeURIComponent(input.value.trim())}`;
  }
}

// ========== 滚动效果 ==========

function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // 导航栏阴影
    if (navbar) {
      navbar.classList.toggle('scrolled', scrollY > 10);
    }

    // 返回顶部按钮
    if (backToTop) {
      backToTop.classList.toggle('visible', scrollY > 400);
    }
  });
}

// ========== IntersectionObserver 动画 ==========

// 使用 IntersectionObserver 实现滚动进入动画
const observerCallback = (entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
      observer.unobserve(entry.target);
    }
  });
};

const observer = new IntersectionObserver(observerCallback, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

// 观察所有动画元素
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.animate-in').forEach(el => {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
  }, 100);
});

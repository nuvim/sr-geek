/**
 * Sr. Geek - Games, Colecionáveis & Assistência Técnica (Crateús - CE)
 * Script Principal Vanilla JavaScript (ES6+)
 * Compatível com execução local e hospedagem no GitHub Pages.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Estado da Aplicação ---
  const state = {
    products: [],
    filteredProducts: [],
    pageCategory: null,
    currentPage: 1,
    itemsPerPage: 16,
    filters: {
      category: 'todos',
      universe: 'todos',
      search: '',
      sort: 'default'
    },
    cart: []
  };

  // --- Constantes da Loja ---
  const STORE_PHONE = '5588921485374'; // WhatsApp oficial
  const CART_STORAGE_KEY = 'sr_geek_cart_v1';

  // --- Elementos DOM ---
  const dom = {
    productsGrid: document.getElementById('products-grid'),
    visibleCount: document.getElementById('visible-count'),
    countAll: document.getElementById('count-all'),
    emptyResults: document.getElementById('empty-results'),
    loadMoreWrapper: document.getElementById('load-more-wrapper'),
    btnLoadMore: document.getElementById('btn-load-more'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    homeFeaturedGrid: document.getElementById('home-featured-grid'),
    
    // Filtros
    globalSearch: document.getElementById('global-search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    categoryPills: document.getElementById('category-pills'),
    universeSelect: document.getElementById('universe-select'),
    sortSelect: document.getElementById('sort-select'),
    
    // Carrinho Drawer
    cartToggleBtn: document.getElementById('cart-toggle-btn'),
    cartBadge: document.getElementById('cart-badge-count'),
    cartDrawerOverlay: document.getElementById('cart-drawer-overlay'),
    btnCloseCart: document.getElementById('btn-close-cart'),
    cartItemsList: document.getElementById('cart-items-list'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartTotalPrice: document.getElementById('cart-total-price'),
    cartItemsCounter: document.getElementById('cart-items-counter'),
    btnCheckoutWhatsApp: document.getElementById('btn-checkout-whatsapp'),
    btnCheckoutOnline: document.getElementById('btn-checkout-online'),
    btnClearCart: document.getElementById('btn-clear-cart'),
    
    // Modais
    productModalBackdrop: document.getElementById('product-modal-backdrop'),
    productModalContent: document.getElementById('product-modal-content'),
    btnCloseProductModal: document.getElementById('btn-close-product-modal'),
    
    emBreveModalBackdrop: document.getElementById('em-breve-modal-backdrop'),
    btnCloseEmBreveModal: document.getElementById('btn-close-em-breve-modal'),
    btnEmBreveToWhatsApp: document.getElementById('btn-em-breve-to-whatsapp'),
    btnEmBreveClose: document.getElementById('btn-em-breve-close'),
    
    // Assistência Form
    assistForm: document.getElementById('assist-form'),
    assistDevice: document.getElementById('assist-device'),
    assistProblem: document.getElementById('assist-problem'),
    assistName: document.getElementById('assist-name'),
    
    // Menu Mobile
    mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
    navMenu: document.getElementById('nav-menu'),

    // Barra Mobile Inferior
    mbbCartToggleBtn: document.getElementById('mbb-cart-toggle-btn'),
    mbbCartBadge: document.getElementById('mbb-cart-badge-count'),

    // Toasts
    toastContainer: document.getElementById('toast-container')
  };

  // --- Inicialização de Dados ---
  function initProductsData() {
    if (window.PRODUCTS_DATA && Array.isArray(window.PRODUCTS_DATA)) {
      state.products = normalizeProducts(window.PRODUCTS_DATA);
      finishDataInit();
    } else {
      fetch('produtos.json')
        .then(response => {
          if (!response.ok) throw new Error('Falha ao carregar produtos.json');
          return response.json();
        })
        .then(data => {
          state.products = normalizeProducts(data);
          finishDataInit();
        })
        .catch(err => {
          console.error('Erro ao carregar catálogo:', err);
          showToast('Erro ao carregar catálogo de produtos.', 'info');
        });
    }
  }

  function normalizeProducts(items) {
    return items.map(item => ({
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      preco: Number(item.preco) || 0,
      universo: item.universo || 'Geek Geral',
      imagem: `itens sr geek/${item.new}`,
      oldFile: item.old,
      newFile: item.new
    }));
  }

  function finishDataInit() {
    // Detectar categoria específica da página (ex: data-page-category="Action Figures & Funkos")
    const pageMain = document.querySelector('[data-page-category]');
    const isCatalog = document.querySelector('[data-is-catalog-page="true"]');
    
    if (pageMain) {
      state.pageCategory = pageMain.getAttribute('data-page-category');
      state.filters.category = state.pageCategory;

      // Preencher select de universos somente com os universos desta categoria
      if (dom.universeSelect) {
        const catProducts = state.products.filter(p => p.categoria.toLowerCase() === state.pageCategory.toLowerCase());
        const universes = [...new Set(catProducts.map(p => p.universo))].filter(Boolean).sort();
        dom.universeSelect.innerHTML = '<option value="todos">Todos os Universos</option>' + 
          universes.map(u => `<option value="${escapeHTML(u)}">${escapeHTML(u)}</option>`).join('');
      }

      const totalCatCount = state.products.filter(p => p.categoria.toLowerCase() === state.pageCategory.toLowerCase()).length;
      if (dom.countAll) dom.countAll.textContent = totalCatCount;
    } else if (isCatalog) {
      state.pageCategory = null;
      if (dom.universeSelect) {
        const universes = [...new Set(state.products.map(p => p.universo))].filter(Boolean).sort();
        dom.universeSelect.innerHTML = '<option value="todos">Todos os Universos</option>' + 
          universes.map(u => `<option value="${escapeHTML(u)}">${escapeHTML(u)}</option>`).join('');
      }
      if (dom.countAll) dom.countAll.textContent = state.products.length;
    } else {
      if (dom.countAll) dom.countAll.textContent = state.products.length;
    }

    // Renderizar destaques da Home caso exista o container
    if (dom.homeFeaturedGrid) {
      renderHomeFeatured();
    }

    // Aplicar filtros e renderizar o catálogo da página se o grid existir
    if (dom.productsGrid) {
      applyFiltersAndSort();
    }

    loadCartFromStorage();
    setupEventListeners();
  }

  // --- Renderização de Destaques da Home ---
  function renderHomeFeatured() {
    // Seleciona 8 produtos de destaque variados da loja
    const featuredIds = [127, 103, 151, 150, 42, 34, 142, 10];
    const featuredItems = [];
    
    featuredIds.forEach(id => {
      const p = state.products.find(x => x.id === id);
      if (p) featuredItems.push(p);
    });

    // Se faltar algum id, preenche com os primeiros
    if (featuredItems.length < 8) {
      state.products.slice(0, 8).forEach(p => {
        if (!featuredItems.find(x => x.id === p.id)) featuredItems.push(p);
      });
    }

    dom.homeFeaturedGrid.innerHTML = featuredItems.map(p => createProductCardHTML(p)).join('');
  }

  // --- Motor de Filtragem e Ordenação ---
  function applyFiltersAndSort() {
    let result = [...state.products];

    // 1. Filtro de Categoria da Página ou do Toolbar
    if (state.pageCategory) {
      result = result.filter(p => p.categoria.toLowerCase() === state.pageCategory.toLowerCase());
    } else if (state.filters.category && state.filters.category !== 'todos') {
      result = result.filter(p => p.categoria.toLowerCase() === state.filters.category.toLowerCase());
    }

    // 2. Filtro de Universo
    if (state.filters.universe && state.filters.universe !== 'todos') {
      result = result.filter(p => p.universo.toLowerCase() === state.filters.universe.toLowerCase());
    }

    // 3. Busca de Texto
    if (state.filters.search.trim()) {
      const term = state.filters.search.toLowerCase().trim();
      result = result.filter(p => 
        p.nome.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term) ||
        p.universo.toLowerCase().includes(term)
      );
    }

    // 4. Ordenação
    switch (state.filters.sort) {
      case 'price-asc':
        result.sort((a, b) => a.preco - b.preco);
        break;
      case 'price-desc':
        result.sort((a, b) => b.preco - a.preco);
        break;
      case 'name-asc':
        result.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      default:
        result.sort((a, b) => a.id - b.id);
        break;
    }

    state.filteredProducts = result;
    state.currentPage = 1;
    renderCatalog();
  }

  // --- Renderização do Catálogo ---
  function renderCatalog() {
    if (!dom.productsGrid) return;

    const totalVisible = state.filteredProducts.length;
    if (dom.visibleCount) dom.visibleCount.textContent = totalVisible;

    if (totalVisible === 0) {
      dom.productsGrid.innerHTML = '';
      if (dom.emptyResults) dom.emptyResults.style.display = 'block';
      if (dom.loadMoreWrapper) dom.loadMoreWrapper.style.display = 'none';
      return;
    }

    if (dom.emptyResults) dom.emptyResults.style.display = 'none';

    const countToRender = state.currentPage * state.itemsPerPage;
    const itemsToRender = state.filteredProducts.slice(0, countToRender);

    dom.productsGrid.innerHTML = itemsToRender.map(product => createProductCardHTML(product)).join('');

    if (dom.loadMoreWrapper) {
      if (itemsToRender.length < totalVisible) {
        dom.loadMoreWrapper.style.display = 'block';
      } else {
        dom.loadMoreWrapper.style.display = 'none';
      }
    }
  }

  function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function createProductCardHTML(product) {
    const isVideo = product.newFile.endsWith('.mp4');
    const parcelValue = product.preco > 0 ? (product.preco / 12).toFixed(2).replace('.', ',') : '0,00';
    const priceDisplay = product.preco > 0 ? formatBRL(product.preco) : 'Sob Consulta';

    return `
      <article class="product-card" data-id="${product.id}">
        <span class="product-badge-universe">${escapeHTML(product.universo)}</span>
        
        <div class="product-img-wrapper" onclick="window.srGeekApp.openProductModal(${product.id})">
          ${isVideo ? `
            <video src="${product.imagem}" autoplay loop muted playsinline></video>
          ` : `
            <img src="${product.imagem}" alt="${escapeHTML(product.nome)}" loading="lazy">
          `}
          <div class="product-quick-view-overlay">
            <span class="btn-quick-view"><i class="fa-solid fa-eye"></i> Detalhes</span>
          </div>
        </div>

        <div class="product-body">
          <span class="product-category-text">${escapeHTML(product.categoria)}</span>
          <h3 class="product-name" onclick="window.srGeekApp.openProductModal(${product.id})" title="${escapeHTML(product.nome)}">
            ${escapeHTML(product.nome)}
          </h3>

          <div class="product-price-box">
            <span class="price-main">${priceDisplay}</span>
            ${product.preco > 0 ? `<span class="price-parcel">em até 12x de R$ ${parcelValue}</span>` : ''}
          </div>

          <div class="product-card-actions">
            <button type="button" class="btn btn-add-cart btn-sm" onclick="window.srGeekApp.addToCart(${product.id})">
              <i class="fa-solid fa-cart-plus"></i> Adicionar
            </button>
            <a href="${getSingleProductWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer" class="btn-card-wa" title="Comprar pelo WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function getSingleProductWhatsAppLink(product) {
    const text = `Olá! Gostaria de comprar/reservar o item:\n*${product.nome}* (${formatBRL(product.preco)})\nCódigo: #${String(product.id).padStart(3, '0')}`;
    return `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(text)}`;
  }

  // --- Funções do Carrinho ---
  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        state.cart = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao ler carrinho do localStorage:', e);
      state.cart = [];
    }
    renderCart();
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch (e) {
      console.warn('Erro ao salvar carrinho:', e);
    }
    renderCart();
  }

  function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = state.cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      state.cart[existingIndex].qty += 1;
    } else {
      state.cart.push({ id: productId, qty: 1 });
    }

    saveCartToStorage();
    showToast(`"${product.nome}" adicionado ao carrinho!`, 'success');
    openCartDrawer();
  }

  function updateCartQty(productId, delta) {
    const index = state.cart.findIndex(item => item.id === productId);
    if (index === -1) return;

    state.cart[index].qty += delta;
    if (state.cart[index].qty <= 0) {
      state.cart.splice(index, 1);
    }

    saveCartToStorage();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCartToStorage();
    showToast('Item removido do carrinho.', 'info');
  }

  function clearCart() {
    if (state.cart.length === 0) return;
    if (confirm('Deseja realmente esvaziar o seu carrinho?')) {
      state.cart = [];
      saveCartToStorage();
      showToast('Carrinho esvaziado.', 'info');
    }
  }

  function renderCart() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    if (dom.cartBadge) dom.cartBadge.textContent = totalItems;
    if (dom.mbbCartBadge) dom.mbbCartBadge.textContent = totalItems;
    if (dom.cartItemsCounter) dom.cartItemsCounter.textContent = `(${totalItems} ${totalItems === 1 ? 'item' : 'itens'})`;

    if (!dom.cartItemsList) return;

    if (state.cart.length === 0) {
      dom.cartItemsList.innerHTML = `
        <div class="empty-cart-state">
          <i class="fa-solid fa-cart-plus empty-cart-icon"></i>
          <h4>Seu carrinho está vazio</h4>
          <p>Explore nosso catálogo e adicione suas Action Figures e Games favoritos!</p>
          <button type="button" class="btn btn-primary" onclick="window.srGeekApp.closeCartDrawer();">
            Ver Produtos
          </button>
        </div>
      `;
      if (dom.cartSubtotal) dom.cartSubtotal.textContent = 'R$ 0,00';
      if (dom.cartTotalPrice) dom.cartTotalPrice.textContent = 'R$ 0,00';
      if (dom.btnCheckoutWhatsApp) dom.btnCheckoutWhatsApp.disabled = true;
      if (dom.btnCheckoutOnline) dom.btnCheckoutOnline.disabled = true;
      return;
    }

    if (dom.btnCheckoutWhatsApp) dom.btnCheckoutWhatsApp.disabled = false;
    if (dom.btnCheckoutOnline) dom.btnCheckoutOnline.disabled = false;

    let subtotal = 0;
    const cartHTML = state.cart.map(cartItem => {
      const product = state.products.find(p => p.id === cartItem.id);
      if (!product) return '';

      const itemTotal = product.preco * cartItem.qty;
      subtotal += itemTotal;

      return `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${product.imagem}" alt="${escapeHTML(product.nome)}">
          </div>
          <div class="cart-item-info">
            <h4 class="cart-item-name">${escapeHTML(product.nome)}</h4>
            <span class="cart-item-price">${formatBRL(itemTotal)}</span>
            
            <div class="cart-qty-row">
              <button type="button" class="qty-btn" onclick="window.srGeekApp.updateCartQty(${product.id}, -1)" aria-label="Diminuir">-</button>
              <span class="qty-value">${cartItem.qty}</span>
              <button type="button" class="qty-btn" onclick="window.srGeekApp.updateCartQty(${product.id}, 1)" aria-label="Aumentar">+</button>
            </div>
          </div>
          <button type="button" class="btn-remove-item" onclick="window.srGeekApp.removeFromCart(${product.id})" aria-label="Remover">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      `;
    }).join('');

    dom.cartItemsList.innerHTML = cartHTML;
    if (dom.cartSubtotal) dom.cartSubtotal.textContent = formatBRL(subtotal);
    if (dom.cartTotalPrice) dom.cartTotalPrice.textContent = formatBRL(subtotal);
  }

  function openCartDrawer() {
    if (dom.cartDrawerOverlay) dom.cartDrawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    if (dom.cartDrawerOverlay) dom.cartDrawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function checkoutViaWhatsApp() {
    if (state.cart.length === 0) return;

    let total = 0;
    let message = `*NOVO PEDIDO - SR. GEEK CRATEÚS*\n`;
    message += `Olá! Gostaria de reservar os seguintes itens para retirada/entrega:\n\n`;

    state.cart.forEach((cartItem, idx) => {
      const product = state.products.find(p => p.id === cartItem.id);
      if (!product) return;
      const itemSub = product.preco * cartItem.qty;
      total += itemSub;
      message += `${idx + 1}. *${product.nome}*\n`;
      message += `   Qtd: ${cartItem.qty}x | Preço: ${formatBRL(product.preco)} = ${formatBRL(itemSub)}\n`;
      message += `   Cód: #${String(product.id).padStart(3, '0')}\n\n`;
    });

    message += `*TOTAL DO PEDIDO: ${formatBRL(total)}*\n\n`;
    message += `Local de Retirada: Shopping Popular de Crateús - Setor B\n`;
    message += `Como posso proceder com o pagamento e a retirada?`;

    const url = `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  function openEmBreveModal() {
    if (dom.emBreveModalBackdrop) dom.emBreveModalBackdrop.style.display = 'flex';
  }

  function closeEmBreveModal() {
    if (dom.emBreveModalBackdrop) dom.emBreveModalBackdrop.style.display = 'none';
  }

  // --- Modal de Detalhes do Produto ---
  function openProductModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || !dom.productModalContent) return;

    const isVideo = product.newFile.endsWith('.mp4');
    const parcelValue = product.preco > 0 ? (product.preco / 12).toFixed(2).replace('.', ',') : '0,00';
    const priceDisplay = product.preco > 0 ? formatBRL(product.preco) : 'Sob Consulta';

    dom.productModalContent.innerHTML = `
      <div class="product-modal-grid">
        <div class="pm-image-col">
          ${isVideo ? `
            <video src="${product.imagem}" controls autoplay loop muted playsinline class="pm-product-media"></video>
          ` : `
            <img src="${product.imagem}" alt="${escapeHTML(product.nome)}" class="pm-product-media">
          `}
        </div>
        <div class="pm-info-col">
          <div class="pm-meta-tags">
            <span class="pm-tag-category">${escapeHTML(product.categoria)}</span>
            <span class="pm-tag-universe">${escapeHTML(product.universo)}</span>
          </div>
          <h2 class="pm-product-title">${escapeHTML(product.nome)}</h2>
          <span class="pm-product-code">Código do Produto: #${String(product.id).padStart(3, '0')}</span>

          <div class="pm-price-block">
            <span class="pm-price-current">${priceDisplay}</span>
            ${product.preco > 0 ? `<span class="pm-price-installments">em até 12x de R$ ${parcelValue} no cartão</span>` : ''}
          </div>

          <div class="pm-description-box">
            <p><strong>Disponibilidade:</strong> Pronta Entrega na Loja Física (Shopping Popular - Setor B, Crateús - CE).</p>
            <p><strong>Garantia:</strong> Produto 100% original e conferido pela nossa equipe.</p>
          </div>

          <div class="pm-modal-actions">
            <button type="button" class="btn btn-primary btn-block btn-lg" onclick="window.srGeekApp.addToCart(${product.id}); window.srGeekApp.closeProductModal();">
              <i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho
            </button>
            <a href="${getSingleProductWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp-checkout btn-block btn-lg" style="justify-content:center;">
              <i class="fa-brands fa-whatsapp"></i> Chamar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    `;

    if (dom.productModalBackdrop) dom.productModalBackdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    if (dom.productModalBackdrop) dom.productModalBackdrop.style.display = 'none';
    document.body.style.overflow = '';
  }

  // --- Assistência Técnica Submit ---
  function handleAssistSubmit(e) {
    e.preventDefault();
    const device = dom.assistDevice ? dom.assistDevice.value : 'Aparelho';
    const problem = dom.assistProblem ? dom.assistProblem.value : 'Orçamento';
    const name = dom.assistName ? dom.assistName.value : 'Cliente';

    let text = `*SOLICITAÇÃO DE ASSISTÊNCIA TÉCNICA - SR. GEEK*\n\n`;
    text += `Nome: *${name}*\n`;
    text += `Aparelho/Controle: *${device}*\n`;
    text += `Problema/Serviço: *${problem}*\n\n`;
    text += `Olá! Gostaria de um orçamento para manutenção do meu aparelho no Shopping Popular de Crateús.`;

    const url = `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'info') iconClass = 'fa-circle-info';
    if (type === 'danger') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${escapeHTML(message)}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Busca Global
    if (dom.globalSearch) {
      dom.globalSearch.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        if (dom.clearSearchBtn) {
          dom.clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
        }
        // Se estiver em outra página sem productsGrid, redireciona para catalogo.html com a busca
        if (!dom.productsGrid) {
          window.location.href = `catalogo.html?busca=${encodeURIComponent(e.target.value)}`;
          return;
        }
        applyFiltersAndSort();
      });
    }

    if (dom.clearSearchBtn) {
      dom.clearSearchBtn.addEventListener('click', () => {
        if (dom.globalSearch) dom.globalSearch.value = '';
        state.filters.search = '';
        dom.clearSearchBtn.style.display = 'none';
        applyFiltersAndSort();
      });
    }

    // Select Universo
    if (dom.universeSelect) {
      dom.universeSelect.addEventListener('change', (e) => {
        state.filters.universe = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Category Pills
    if (dom.categoryPills) {
      const pills = dom.categoryPills.querySelectorAll('.pill-btn');
      pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          // Update active state
          pills.forEach(p => p.classList.remove('active'));
          e.currentTarget.classList.add('active');
          
          // Update filter and re-render
          state.filters.category = e.currentTarget.getAttribute('data-category');
          
          // Se for catálogo, recalcular universos pra categoria escolhida
          if (dom.universeSelect) {
            let catProducts = state.products;
            if (state.filters.category !== 'todos') {
              catProducts = state.products.filter(p => p.categoria.toLowerCase() === state.filters.category.toLowerCase());
            }
            const universes = [...new Set(catProducts.map(p => p.universo))].filter(Boolean).sort();
            dom.universeSelect.innerHTML = '<option value="todos">Todos os Universos</option>' + 
              universes.map(u => `<option value="${escapeHTML(u)}">${escapeHTML(u)}</option>`).join('');
            
            // Reset universe filter when changing categories
            state.filters.universe = 'todos';
          }
          
          applyFiltersAndSort();
        });
      });
    }

    // Mascot Interactive Logic (Olavo 3D & 5 Poses)
    const mascotStage = document.getElementById('mascot-stage');
    const mascotImg = document.getElementById('hero-mascot-img');
    const speechText = document.getElementById('mascot-speech-text');
    const poseControls = document.getElementById('pose-controls');

    const OLAVO_POSES = [
      { src: 'assets/mascot-waving.png', label: '"Oi! Sejam bem-vindos à Sr. Geek."' },
      { src: 'assets/mascot-controller.png', label: '"Nossa equipe tem os melhores achados gamers para você."' },
      { src: 'assets/mascot-playing.png', label: '"Escolha, jogue e colecione com a gente."' },
      { src: 'assets/mascot-sitting.png', label: '"Seu próximo item favorito está aqui na nossa loja."' },
      { src: 'assets/mascot-chair.png', label: '"Atendimento de verdade com quem entende."' }
    ];

    let currentPoseIndex = 0;
    let poseAutoTimer = null;

    function setOlavoPose(idx, isManual = false) {
      if (idx < 0 || idx >= OLAVO_POSES.length) return;
      currentPoseIndex = idx;
      const pose = OLAVO_POSES[idx];

      if (mascotImg) {
        mascotImg.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        mascotImg.style.opacity = '0.3';
        mascotImg.style.transform = 'scale(0.96)';
        setTimeout(() => {
          mascotImg.src = pose.src;
          mascotImg.style.opacity = '1';
          mascotImg.style.transform = 'scale(1)';
        }, 150);
      }

      if (speechText) {
        speechText.style.transition = 'opacity 0.2s ease';
        speechText.style.opacity = '0';
        setTimeout(() => {
          speechText.textContent = pose.label;
          speechText.style.opacity = '1';
        }, 150);
      }

      if (poseControls) {
        const btns = poseControls.querySelectorAll('button');
        btns.forEach((btn, i) => {
          btn.classList.toggle('active', i === idx);
        });
      }

      if (isManual) {
        restartPoseTimer();
      }
    }

    function startPoseTimer() {
      if (!mascotStage) return;
      stopPoseTimer();
      poseAutoTimer = setInterval(() => {
        const nextIdx = (currentPoseIndex + 1) % OLAVO_POSES.length;
        setOlavoPose(nextIdx, false);
      }, 4000); // Troca automaticamente como slide a cada 4 segundos
    }

    function stopPoseTimer() {
      if (poseAutoTimer) {
        clearInterval(poseAutoTimer);
        poseAutoTimer = null;
      }
    }

    function restartPoseTimer() {
      stopPoseTimer();
      startPoseTimer();
    }

    if (mascotStage) {
      // Inicia rotação automática como slide
      startPoseTimer();

      // 3D Tilt via CSS Custom Properties (--pointer-x and --pointer-y)
      const handlePointer = (e) => {
        const rect = mascotStage.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        if (!clientX && !clientY) return;

        const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((clientY - rect.top) / rect.height - 0.5) * 2;

        mascotStage.style.setProperty('--pointer-x', x.toFixed(3));
        mascotStage.style.setProperty('--pointer-y', y.toFixed(3));
      };

      mascotStage.addEventListener('pointerenter', stopPoseTimer);
      mascotStage.addEventListener('pointermove', handlePointer);
      mascotStage.addEventListener('pointerleave', () => {
        mascotStage.style.setProperty('--pointer-x', '0');
        mascotStage.style.setProperty('--pointer-y', '0');
        startPoseTimer();
      });
    }

    if (poseControls) {
      const buttons = poseControls.querySelectorAll('button');
      buttons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          setOlavoPose(idx, true);
        });
      });
    }

    // Select Ordenação
    if (dom.sortSelect) {
      dom.sortSelect.addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Botão Carregar Mais
    if (dom.btnLoadMore) {
      dom.btnLoadMore.addEventListener('click', () => {
        state.currentPage += 1;
        renderCatalog();
      });
    }

    // Botão Resetar Filtros
    if (dom.btnResetFilters) {
      dom.btnResetFilters.addEventListener('click', () => {
        state.filters.search = '';
        state.filters.universe = 'todos';
        state.filters.sort = 'default';
        if (dom.globalSearch) dom.globalSearch.value = '';
        if (dom.universeSelect) dom.universeSelect.value = 'todos';
        if (dom.sortSelect) dom.sortSelect.value = 'default';
        if (dom.clearSearchBtn) dom.clearSearchBtn.style.display = 'none';
        applyFiltersAndSort();
      });
    }

    // Carrinho Drawer Triggers
    if (dom.cartToggleBtn) {
      dom.cartToggleBtn.addEventListener('click', openCartDrawer);
    }

    if (dom.btnCloseCart) {
      dom.btnCloseCart.addEventListener('click', closeCartDrawer);
    }

    if (dom.cartDrawerOverlay) {
      dom.cartDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === dom.cartDrawerOverlay) closeCartDrawer();
      });
    }

    if (dom.btnClearCart) {
      dom.btnClearCart.addEventListener('click', clearCart);
    }

    if (dom.btnCheckoutWhatsApp) {
      dom.btnCheckoutWhatsApp.addEventListener('click', checkoutViaWhatsApp);
    }

    if (dom.btnCheckoutOnline) {
      dom.btnCheckoutOnline.addEventListener('click', openEmBreveModal);
    }

    // Modais Close
    if (dom.btnCloseProductModal) {
      dom.btnCloseProductModal.addEventListener('click', closeProductModal);
    }

    if (dom.productModalBackdrop) {
      dom.productModalBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.productModalBackdrop) closeProductModal();
      });
    }

    if (dom.btnCloseEmBreveModal) {
      dom.btnCloseEmBreveModal.addEventListener('click', closeEmBreveModal);
    }

    if (dom.btnEmBreveClose) {
      dom.btnEmBreveClose.addEventListener('click', closeEmBreveModal);
    }

    if (dom.btnEmBreveToWhatsApp) {
      dom.btnEmBreveToWhatsApp.addEventListener('click', () => {
        closeEmBreveModal();
        checkoutViaWhatsApp();
      });
    }

    if (dom.emBreveModalBackdrop) {
      dom.emBreveModalBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.emBreveModalBackdrop) closeEmBreveModal();
      });
    }

    // Formulário de Assistência Técnica
    if (dom.assistForm) {
      dom.assistForm.addEventListener('submit', handleAssistSubmit);
    }

    // Menu Mobile
    if (dom.mobileMenuToggle && dom.navMenu) {
      dom.mobileMenuToggle.addEventListener('click', () => {
        dom.navMenu.classList.toggle('active');
      });

      dom.navMenu.querySelectorAll('.nav-link, .nav-dropdown-item').forEach(link => {
        link.addEventListener('click', () => {
          dom.navMenu.classList.remove('active');
        });
      });
    }

    // Carrinho Mobile Bottom Bar
    if (dom.mbbCartToggleBtn) {
      dom.mbbCartToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    }

    // Verificar parâmetro de busca na URL (ex: catalogo.html?busca=luffy)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('busca');
    const catParam = urlParams.get('categoria');

    if (searchParam && dom.globalSearch) {
      dom.globalSearch.value = searchParam;
      state.filters.search = searchParam;
      if (dom.clearSearchBtn) dom.clearSearchBtn.style.display = 'block';
    }

    if (catParam) {
      state.filters.category = catParam;
      
      // Atualizar pills se existirem
      if (dom.categoryPills) {
        const pills = dom.categoryPills.querySelectorAll('.pill-btn');
        pills.forEach(p => p.classList.remove('active'));
        
        const targetPill = Array.from(pills).find(p => p.getAttribute('data-category') === catParam);
        if (targetPill) targetPill.classList.add('active');

        // Recalcular universo
        if (dom.universeSelect) {
          const catProducts = state.products.filter(p => p.categoria.toLowerCase() === catParam.toLowerCase());
          const universes = [...new Set(catProducts.map(p => p.universo))].filter(Boolean).sort();
          dom.universeSelect.innerHTML = '<option value="todos">Todos os Universos</option>' + 
            universes.map(u => `<option value="${escapeHTML(u)}">${escapeHTML(u)}</option>`).join('');
        }
      }
    }

    if (searchParam || catParam) {
      applyFiltersAndSort();
    }
  }

  // --- Funções Utilitárias ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expor métodos necessários globalmente
  window.srGeekApp = {
    addToCart,
    updateCartQty,
    removeFromCart,
    openCartDrawer,
    closeCartDrawer,
    openProductModal,
    closeProductModal
  };

  // Iniciar
  initProductsData();

});

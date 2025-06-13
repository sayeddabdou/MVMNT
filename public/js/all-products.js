// js-files/all-products.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the shared cart
    const cart = new Cart();
    
    // DOM Elements
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortBy = document.getElementById('sort-by');
    const clearFiltersBtn = document.querySelector('.clear-filters');
    const productsGrid = document.querySelector('.products-grid');
    let productCards = Array.from(document.querySelectorAll('.product-card'));

     function setupCartCloseButton() {
        const closeCartBtn = document.querySelector('.close-cart');
        if (closeCartBtn) {
            // Remove any existing listeners to prevent duplicates
            closeCartBtn.replaceWith(closeCartBtn.cloneNode(true));
            // Add fresh listener
           // After filtering/sorting
document.querySelector('.close-cart').onclick = () => cart.toggleCart();
        }
    }
    
    // Apply filters and sorting
    function applyFilters() {
        const categoryValue = categoryFilter ? categoryFilter.value : 'all';
        const priceValue = priceFilter ? priceFilter.value : 'all';
        const sortValue = sortBy ? sortBy.value : 'featured';
        
        // Filter products
        const filteredProducts = productCards.filter(card => {
            const category = card.dataset.category || '';
            const price = parseFloat(card.dataset.price) || 0;
            
            // Category filter
            const categoryMatch = categoryValue === 'all' || category === categoryValue;
            
            // Price filter
            let priceMatch = true;
            if (priceValue !== 'all') {
                const [min, max] = priceValue.split('-').map(val => {
                    if (val.endsWith('+')) return Infinity;
                    return parseFloat(val.replace(/\$/g, ''));
                });
                priceMatch = price >= min && (isNaN(max) || price <= max);
            }
            
            return categoryMatch && priceMatch;
              setupCartCloseButton();
        });

        // Sort products
        filteredProducts.sort((a, b) => {
            const aPrice = parseFloat(a.dataset.price) || 0;
            const bPrice = parseFloat(b.dataset.price) || 0;
            const aName = (a.querySelector('.product-title')?.textContent || '').toLowerCase();
            const bName = (b.querySelector('.product-title')?.textContent || '').toLowerCase();
            
            switch(sortValue) {
                case 'price-low': return aPrice - bPrice;
                case 'price-high': return bPrice - aPrice;
                case 'name-asc': return aName.localeCompare(bName);
                case 'name-desc': return bName.localeCompare(aName);
                default: return 0; // 'featured' - keep original order
            }
        });

        // Clear current grid
        if (productsGrid) {
            productsGrid.innerHTML = '';
            
            // Re-add sorted and filtered products
            filteredProducts.forEach(product => {
                // Clone the card to avoid reference issues
                const clonedCard = product.cloneNode(true);
                
                // Ensure quantity selector works
                const quantityInput = clonedCard.querySelector('.quantity-input');
                const decreaseBtn = clonedCard.querySelector('.decrease');
                const increaseBtn = clonedCard.querySelector('.increase');
                
                if (quantityInput && decreaseBtn && increaseBtn) {
                    decreaseBtn.addEventListener('click', () => {
                        let value = parseInt(quantityInput.value);
                        if (value > 1) quantityInput.value = value - 1;
                    });
                    
                    increaseBtn.addEventListener('click', () => {
                        let value = parseInt(quantityInput.value);
                        quantityInput.value = value + 1;
                    });
                }
                
                // Ensure add to cart works
                const addToCartBtn = clonedCard.querySelector('.add-to-cart');
                if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', (e) => {
                        cart.addToCart(e);
                    });
                }
                
                productsGrid.appendChild(clonedCard);
            });
        }
    }

    // Initialize event listeners
    function initEventListeners() {
        if (categoryFilter) {
            categoryFilter.addEventListener('change', applyFilters);
        }
        
        if (priceFilter) {
            priceFilter.addEventListener('change', applyFilters);
        }
        
        if (sortBy) {
            sortBy.addEventListener('change', applyFilters);
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                if (categoryFilter) categoryFilter.value = 'all';
                if (priceFilter) priceFilter.value = 'all';
                if (sortBy) sortBy.value = 'featured';
                applyFilters();
            });
        }
    }
   

    // Initialize
    initEventListeners();
    applyFilters();

    // MutationObserver to detect dynamically loaded products
    if (productsGrid) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    productCards = Array.from(document.querySelectorAll('.product-card'));
                    applyFilters();
                }
            });
        });

        observer.observe(productsGrid, {
            childList: true,
            subtree: true
        });
    }
});
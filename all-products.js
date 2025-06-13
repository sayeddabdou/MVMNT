document.addEventListener('DOMContentLoaded', function() {

    const cart = new Cart();
    
    
    const clearFiltersBtn = document.querySelector('.clear-filters');
    const productsGrid = document.querySelector('.products-grid');
    let productCards = Array.from(document.querySelectorAll('.product-card'));

     function setupCartCloseButton() {
        const closeCartBtn = document.querySelector('.close-cart');
    
        if (closeCartBtn) {
    
            closeCartBtn.replaceWith(closeCartBtn.cloneNode(true));
           
document.querySelector('.close-cart').onclick = () => cart.toggleCart();
        }
    }
    
    
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
    
});

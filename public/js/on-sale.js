// Cart Functionality
document.addEventListener('DOMContentLoaded', function() {
    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCart = document.querySelector('.close-cart');
    const overlay = document.querySelector('.overlay');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total span:last-child');
    const cartCount = document.querySelector('.cart-count');
    
    let cart = [];
   
    // Toggle Cart Function
    function toggleCart() {
        cartSidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
 // Open Cart
    cartIcon.addEventListener('click', toggleCart);

    // Toggle Cart
    cartIcon.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
    });
    
    // Close Cart (Fixed)
    closeCart.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
    
        // Close Cart When Clicking Overlay
    overlay.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    
    // Add to Cart
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productCard = button.closest('.product-card');
            const productName = productCard.querySelector('.product-title').textContent;
            const productPrice = parseFloat(productCard.querySelector('.current-price').textContent.replace('$', ''));
            const productImage = productCard.querySelector('.product-image img').src;
            const quantity = parseInt(productCard.querySelector('.quantity-input').value);
            
            // Check if item already in cart
            const existingItem = cart.find(item => item.name === productName);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: quantity
                });
            }
            
            updateCart();
            
            // Show cart sidebar
            cartSidebar.classList.add('active');
            overlay.classList.add('active');
        });
    });
    
    // Update Cart Display
    function updateCart() {
        // Clear cart items
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class='bx bx-cart-alt'></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        } else {
            let total = 0;
            
            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                cartItem.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-actions">
                            <input type="number" class="cart-item-quantity" value="${item.quantity}" min="1">
                            <i class='bx bx-trash remove-item' data-index="${index}"></i>
                        </div>
                    </div>
                `;
                
                cartItemsContainer.appendChild(cartItem);
            });
            
            // Update total
            cartTotal.textContent = `$${total.toFixed(2)}`;
            
            // Add event listeners to quantity inputs and remove buttons
            document.querySelectorAll('.cart-item-quantity').forEach(input => {
                input.addEventListener('change', function() {
                    const index = this.closest('.cart-item').querySelector('.remove-item').getAttribute('data-index');
                    const newQuantity = parseInt(this.value);
                    
                    if (newQuantity >= 1) {
                        cart[index].quantity = newQuantity;
                        updateCart();
                    }
                });
            });
            
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', function() {
                    const index = this.getAttribute('data-index');
                    cart.splice(index, 1);
                    updateCart();
                });
            });
        }
        
        // Update cart count
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Quantity selectors
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            if (this.classList.contains('decrease') && value > 1) {
                input.value = value - 1;
            } else if (this.classList.contains('increase')) {
                input.value = value + 1;
            }
        });
    });
    
    // Checkout button
    document.querySelector('.checkout-btn').addEventListener('click', function() {
        if (cart.length > 0) {
            alert(`Proceeding to checkout with ${cart.reduce((total, item) => total + item.quantity, 0)} items. Total: $${parseFloat(cartTotal.textContent.replace('$', '')).toFixed(2)}`);
            // In a real implementation, you would redirect to checkout page
        } else {
            alert('Your cart is empty!');
        }
    });
    
    // Initialize cart
    updateCart();
});


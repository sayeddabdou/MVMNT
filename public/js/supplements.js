document.addEventListener('DOMContentLoaded', function() {
    // Cart functionality
    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCart = document.querySelector('.close-cart');
    const overlay = document.querySelector('.overlay');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total span:last-child');
    const cartCount = document.querySelector('.cart-count');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
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
    
    // Update cart UI
    function updateCart() {
        // Update cart count
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Update cart items
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class='bx bx-cart-alt'></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            cartTotal.textContent = '$0.00';
            return;
        }
        
        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <input type="number" class="cart-item-quantity" value="${item.quantity}" min="1" data-index="${index}">
                        <i class='bx bx-trash remove-item' data-index="${index}"></i>
                    </div>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItemElement);
        });
        
        // Update total
        cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
        
        // Add event listeners to new elements
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', removeItemFromCart);
        });
        
        document.querySelectorAll('.cart-item-quantity').forEach(input => {
            input.addEventListener('change', updateCartItemQuantity);
        });
    }
    
    // Add to cart functionality
    function addToCart(event) {
        const productCard = event.target.closest('.product-card');
        const productTitle = productCard.querySelector('.product-title').textContent;
        const productPrice = parseFloat(productCard.querySelector('.current-price').textContent.replace('$', ''));
        const productImage = productCard.querySelector('.product-image img').src;
        const quantity = parseInt(productCard.querySelector('.quantity-input').value);
        
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(item => item.title === productTitle);
        
        if (existingItemIndex >= 0) {
            // Update quantity if item exists
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.push({
                title: productTitle,
                price: productPrice,
                image: productImage,
                quantity: quantity
            });
        }
        
        updateCart();
        
        // Show cart sidebar when adding an item
        if (!cartSidebar.classList.contains('active')) {
            toggleCart();
        }
        
        // Add animation to cart icon
        cartIcon.classList.add('animate');
        setTimeout(() => {
            cartIcon.classList.remove('animate');
        }, 500);
    }
    
    // Remove item from cart
    function removeItemFromCart(event) {
        const index = event.target.getAttribute('data-index');
        cart.splice(index, 1);
        updateCart();
    }
    
    // Update cart item quantity
    function updateCartItemQuantity(event) {
        const index = event.target.getAttribute('data-index');
        const newQuantity = parseInt(event.target.value);
        
        if (newQuantity > 0) {
            cart[index].quantity = newQuantity;
            updateCart();
        } else {
            event.target.value = cart[index].quantity;
        }
    }
    
    // Quantity selector functionality
    function setupQuantitySelectors() {
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('.quantity-input');
                let value = parseInt(input.value);
                
                if (this.classList.contains('decrease')) {
                    if (value > 1) {
                        input.value = value - 1;
                    }
                } else if (this.classList.contains('increase')) {
                    input.value = value + 1;
                }
            });
        });
    }
    
    // Checkout button
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        alert(`Thank you for your purchase! Total: $${cartTotal.textContent.replace('$', '')}`);
        cart = [];
        updateCart();
        toggleCart();
    });
    
    // Initialize
    setupQuantitySelectors();
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
    
    // Add smooth scroll for category buttons
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Add animation to category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Admin mode toggle
const adminToggle = document.getElementById('admin-toggle');
const adminLink = document.querySelector('.admin-link');

// Check if user is admin (in a real app, this would check authentication)
function checkAdminStatus() {
    // This is just for demo - in a real app you'd check a login status
    const isAdmin = localStorage.getItem('shopAdmin') === 'true';
    if (isAdmin) {
        adminToggle.style.display = 'block';
        adminLink.style.display = 'block';
    }
}

// Toggle admin mode
adminToggle.addEventListener('click', () => {
    const isAdminMode = document.body.classList.toggle('admin-mode');
    
    // Show/hide admin controls
    document.querySelectorAll('.admin-controls').forEach(control => {
        control.style.display = isAdminMode ? 'block' : 'none';
    });
    
    // Change button text
    adminToggle.innerHTML = isAdminMode ? 
        '<i class="bx bx-cog"></i> Exit Admin Mode' : 
        '<i class="bx bx-cog"></i> Admin Mode';
});

// Initialize
checkAdminStatus();
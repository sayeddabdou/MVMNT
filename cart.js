class Cart {
    constructor() {
        this.cart = [];
        this.initElements();
        this.setupEventListeners();
        this.loadCart();
    }

    initElements() {
        this.cartIcon = document.querySelector('.cart-icon');
        this.cartSidebar = document.querySelector('.cart-sidebar');
        this.closeCart = document.querySelector('.close-cart');
        this.overlay = document.querySelector('.overlay');
        this.cartItemsContainer = document.querySelector('.cart-items');
        this.cartTotal = document.querySelector('.cart-total span:last-child');
        this.cartCount = document.querySelector('.cart-count');
        this.checkoutBtn = document.querySelector('.checkout-btn');
    }

    setupEventListeners() {
        // Cart toggle
        this.cartIcon?.addEventListener('click', () => this.toggleCart());
        this.closeCart?.addEventListener('click', () => this.toggleCart());
        this.overlay?.addEventListener('click', () => this.toggleCart());

        // Checkout
        this.checkoutBtn?.addEventListener('click', () => this.handleCheckout());

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => this.addToCart(e));
        });

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
    }

    toggleCart() {
        this.cartSidebar?.classList.toggle('active');
        this.overlay?.classList.toggle('active');
    }

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCart();
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCart() {
        if (!this.cartItemsContainer) return;

        if (this.cart.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class='bx bx-cart-alt'></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            this.cartTotal.textContent = '$0.00';
            this.cartCount.textContent = '0';
            return;
        }

        let total = 0;
        let itemCount = 0;

        this.cartItemsContainer.innerHTML = this.cart.map((item, index) => {
            total += item.price * item.quantity;
            itemCount += item.quantity;
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <div class="price">$${item.price.toFixed(2)}</div>
                        <div class="quantity-container">
                            <input type="number" value="${item.quantity}" min="1" data-index="${index}" class="quantity-input">
                            <button class="remove-item" data-index="${index}">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.cartTotal.innerHTML = `
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        `;
        this.cartCount.textContent = itemCount.toString();

        // Add event listeners for quantity inputs and remove buttons
        this.cartItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newQuantity = parseInt(e.target.value);
                if (newQuantity >= 1) {
                    this.updateQuantity(index, newQuantity);
                } else {
                    e.target.value = this.cart[index].quantity;
                }
            });
        });

        this.cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-item').dataset.index);
                this.removeItem(index);
            });
        });
    }

    updateQuantity(index, quantity) {
        this.cart[index].quantity = quantity;
        this.saveCart();
        this.updateCart();
    }

    addToCart(event) {
        const productCard = event.target.closest('.product-card');
        const name = productCard.querySelector('.product-title').textContent;
        const price = parseFloat(productCard.querySelector('.current-price').textContent.replace('$', ''));
        const image = productCard.querySelector('.product-image img').src;
        const quantity = parseInt(productCard.querySelector('.quantity-input').value);

        const existingItem = this.cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                name,
                price,
                image,
                quantity
            });
        }

        this.saveCart();
        this.updateCart();
        this.toggleCart();
    }

    removeItem(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.updateCart();
    }

    async handleCheckout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        try {
            // Calculate total
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Get logged in user info from sessionStorage
            const loggedInUser = sessionStorage.getItem('loggedInUser');
            const userData = JSON.parse(sessionStorage.getItem('userData'));

            // Create order object
            const order = {
                customer: loggedInUser ? (userData?.fullName || loggedInUser) : 'Guest',
                items: this.cart.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                total: total,
                status: 'Pending'
            };

            // Send order to server
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order),
                credentials: 'include' // Include credentials for session
            });

            if (!response.ok) {
                throw new Error('Failed to create order');
            }

            // Clear cart after successful order
            this.cart = [];
            this.saveCart();
            this.updateCart();
            this.toggleCart();

            // Show success message
            alert('Thank you for your order! Your order has been placed successfully.');
        } catch (error) {
            console.error('Error creating order:', error);
            alert('There was an error processing your order. Please try again.');
        }
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cart = new Cart();
    window.cart = cart; // Make cart available globally if needed
}); 
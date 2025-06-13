document.addEventListener('DOMContentLoaded', function() {
    console.log('admin-shop.js loaded!');
    // Get DOM elements
    const productSearch = document.getElementById('product-search');
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');
    let currentProductId = null;

    // Filter functionality
    function filterProducts() {
        const searchTerm = productSearch.value.toLowerCase();
        const rows = document.querySelectorAll('.table-body .table-row');

        rows.forEach(row => {
            const name = row.children[1].textContent.toLowerCase();
            const category = row.children[2].textContent.toLowerCase();
            const description = row.children[5].textContent.toLowerCase();

            const matches = name.includes(searchTerm) || 
                          category.includes(searchTerm) || 
                          description.includes(searchTerm);

            row.style.display = matches ? '' : 'none';
        });
    }

    // Event listener for search
    if (productSearch) {
        productSearch.addEventListener('input', filterProducts);
    }

    // Modal handling
    function closeModal(modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        if (modal === productModal) {
            productForm.reset();
            document.getElementById('image-preview').innerHTML = '';
        }
    }

    function openModal(modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === productModal) closeModal(productModal);
        if (e.target === confirmModal) closeModal(confirmModal);
    });

    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    // Add product button
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Add New Product';
            productForm.reset();
            document.getElementById('image-preview').innerHTML = '';
            openModal(productModal);

            // Re-attach event listener for the form within the modal
            // This is a defensive measure to ensure the listener is active
            // even if the modal content is dynamically re-rendered.
            const currentProductForm = document.getElementById('product-form');
            if (currentProductForm) {
                currentProductForm.removeEventListener('submit', handleProductFormSubmit); // Remove old listener if any
                currentProductForm.addEventListener('submit', handleProductFormSubmit);
            }
        });
    }

    // Handle image preview
    const productImage = document.getElementById('product-image');
    if (productImage) {
        productImage.addEventListener('change', function() {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = '';
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    preview.appendChild(img);
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Handle edit product
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('.table-row');
            const productId = this.dataset.id;
            
            document.getElementById('modal-title').textContent = 'Edit Product';
            document.getElementById('product-id').value = productId;
            document.getElementById('product-name').value = row.children[1].textContent;
            document.getElementById('product-category').value = row.children[2].textContent;
            document.getElementById('product-price').value = row.children[3].textContent.replace('$', '');
            document.getElementById('product-stock').value = row.children[4].textContent;
            document.getElementById('product-description').value = row.children[5].textContent;

            // Show current image in preview
            const currentImage = row.querySelector('.product-image img');
            if (currentImage) {
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `<img src="${currentImage.src}" alt="Current product image">`;
            }

            openModal(productModal);
        });
    });

    // Handle delete product
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', function() {
            currentProductId = this.dataset.id;
            console.log('Delete button clicked. Product ID to delete:', currentProductId);
            openModal(confirmModal);
        });
    });

    // Confirm delete
    if (confirmDelete) {
        confirmDelete.addEventListener('click', async function() {
            console.log('Confirm delete button clicked for Product ID:', currentProductId);
            try {
                const response = await fetch(`/admin/shop/products/${currentProductId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to delete product: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const row = document.querySelector(`.delete-product[data-id="${currentProductId}"]`).closest('.table-row');
                if (row) {
                    row.remove();
                    console.log('Product row removed from DOM.');
                } else {
                    console.warn('Product row not found in DOM for ID:', currentProductId);
                }
                showNotification('Product deleted successfully!');
                closeModal(confirmModal);
                setTimeout(() => location.reload(), 1000); // Reload page to reflect changes
            } catch (error) {
                console.error('Error deleting product:', error);
                showNotification(`Error deleting product: ${error.message}`, 'error');
            }
        });
    }

    // Cancel delete
    if (cancelDelete) {
        cancelDelete.addEventListener('click', () => closeModal(confirmModal));
    }

    // Define the form submit handler as a named function for easier removal/re-attachment
    async function handleProductFormSubmit(e) {
        e.preventDefault();
        console.log('Form submit event triggered!');
        const formData = new FormData(this);
        const productId = document.getElementById('product-id').value;
        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `/admin/shop/products/${productId}` : '/admin/shop/products';

        try {
            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to save product');
            }

            closeModal(productModal);
            showNotification('Product saved successfully!');
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Error saving product:', error);
            showNotification('Error saving product', 'error');
        }
    }

    // Initial attachment of the event listener
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }

    // Notification handling
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('popup-notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}); 
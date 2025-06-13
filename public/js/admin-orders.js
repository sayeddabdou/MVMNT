document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const orderSearch = document.getElementById('order-search');
    const statusFilter = document.getElementById('status-filter');
    const orderModal = document.getElementById('order-modal');
    const statusModal = document.getElementById('status-modal');
    const statusForm = document.getElementById('status-form');
    const exportBtn = document.getElementById('export-csv');
    const orderTableBody = document.getElementById('order-table-body');

    let orders = [];

    // Fetch orders from server
    async function fetchOrders() {
        try {
            const response = await fetch('/api/orders');
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            orders = await response.json();
            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            showNotification('Error loading orders', 'error');
        }
    }

    // Display orders in table
    function displayOrders(ordersToDisplay) {
        orderTableBody.innerHTML = ordersToDisplay.map(order => `
            <div class="table-row">
                <div>#${order._id}</div>
                <div>${order.customer}</div>
                <div>${order.items.length} items</div>
                <div>$${order.total.toFixed(2)}</div>
                <div class="status ${order.status.toLowerCase()}">${order.status}</div>
                <div>${new Date(order.date).toLocaleDateString()}</div>
                <div class="actions">
                    <button class="action-btn view-order" data-id="${order._id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn update-status" data-id="${order._id}" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to buttons
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', () => viewOrder(btn.dataset.id));
        });

        document.querySelectorAll('.update-status').forEach(btn => {
            btn.addEventListener('click', () => openStatusModal(btn.dataset.id));
        });
    }

    // Filter functionality
    function filterOrders() {
        const searchTerm = orderSearch.value.toLowerCase();
        const statusValue = statusFilter.value;

        const filtered = orders.filter(order => {
            const matchesSearch = order._id.toLowerCase().includes(searchTerm) || 
                                order.customer.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusValue || order.status === statusValue;
            return matchesSearch && matchesStatus;
        });

        displayOrders(filtered);
    }

    // View order details
    async function viewOrder(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }
            const order = await response.json();

            // Update modal content
            document.getElementById('detail-order-id').textContent = '#' + order._id;
            document.getElementById('detail-customer').textContent = order.customer;
            document.getElementById('detail-date').textContent = new Date(order.date).toLocaleDateString();
            document.getElementById('detail-status').textContent = order.status;
            document.getElementById('detail-total').textContent = '$' + order.total.toFixed(2);

            // Display items
            document.getElementById('items-list').innerHTML = order.items.map(item => `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">
                    <div class="item-info">
                        <p>${item.name}</p>
                        <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                </div>
            `).join('');

            openModal(orderModal);
        } catch (error) {
            console.error('Error fetching order details:', error);
            showNotification('Error loading order details', 'error');
        }
    }

    // Update order status
    async function updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            // Refresh orders
            await fetchOrders();
            closeModal(statusModal);
            showNotification('Order status updated successfully');
        } catch (error) {
            console.error('Error updating order status:', error);
            showNotification('Error updating order status', 'error');
        }
    }

    // Modal handling
    function openModal(modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    function openStatusModal(orderId) {
        const order = orders.find(o => o._id === orderId);
        if (order) {
            document.getElementById('status-order-id').value = orderId;
            document.getElementById('new-status').value = order.status;
            openModal(statusModal);
        }
    }

    // Event listeners
    if (orderSearch) orderSearch.addEventListener('input', filterOrders);
    if (statusFilter) statusFilter.addEventListener('change', filterOrders);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) closeModal(orderModal);
        if (e.target === statusModal) closeModal(statusModal);
    });

    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    // Handle status form submission
    if (statusForm) {
        statusForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const orderId = document.getElementById('status-order-id').value;
            const newStatus = document.getElementById('new-status').value;
            await updateOrderStatus(orderId, newStatus);
        });
    }

    // Handle CSV export
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const csv = [
                'Order ID,Customer,Items,Total,Status,Date',
                ...orders.map(order => [
                    order._id,
                    order.customer,
                    order.items.length + ' items',
                    '$' + order.total.toFixed(2),
                    order.status,
                    new Date(order.date).toLocaleDateString()
                ].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'orders.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
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

    // Initial load
    fetchOrders();
}); 
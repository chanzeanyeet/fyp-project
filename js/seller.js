// js/seller.js

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = window.db.getCurrentUser();
  if (!currentUser || currentUser.role !== 'seller') {
    window.location.href = '../login.html';
    return;
  }

  // Update Nav
  const navName = document.getElementById('navSellerName');
  const navAvatar = document.getElementById('navSellerAvatar');
  if(navName) navName.textContent = currentUser.username;
  if(navAvatar) navAvatar.src = currentUser.avatar;

  renderKPIs();
  renderInventory();
  renderOrders();
});

function renderKPIs() {
  const products = window.db.getProducts().filter(p => p.sellerId === currentUser.id);
  const orders = window.db.getOrdersBySeller(currentUser.id);
  
  let totalRevenue = 0;
  let activeOrders = 0;
  
  orders.forEach(o => {
    if (o.status !== 'cancelled') totalRevenue += o.totalAmount;
    if (o.status === 'pending') activeOrders++;
  });

  const lowStock = products.filter(p => p.stock < 10).length;

  document.getElementById('kpiRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
  document.getElementById('kpiOrders').textContent = activeOrders;
  document.getElementById('kpiStock').textContent = lowStock;
}

function renderInventory() {
  const products = window.db.getProducts().filter(p => p.sellerId === currentUser.id);
  const tbody = document.getElementById('inventoryTable');
  tbody.innerHTML = '';

  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.image}" alt="${p.name}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></td>
      <td style="font-weight: 500">${p.name}</td>
      <td>$${p.price.toFixed(2)}</td>
      <td>
        <span style="color: ${p.stock < 10 ? 'var(--color-warning)' : 'inherit'}">${p.stock}</span>
      </td>
      <td>
        <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderOrders() {
  const orders = window.db.getOrdersBySeller(currentUser.id);
  // Sort newest first
  orders.sort((a,b) => new Date(b.date) - new Date(a.date));

  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = '';

  orders.forEach(o => {
    let statusColor = 'var(--text-body)';
    let nextAction = '';

    if (o.status === 'pending') {
      statusColor = 'var(--color-warning)';
      nextAction = `<button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="updateOrder('${o.id}', 'shipped')">Mark Shipped</button>`;
    } else if (o.status === 'shipped') {
      statusColor = 'var(--accent-start)';
      nextAction = `<button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: var(--color-success); color: var(--color-success);" onclick="updateOrder('${o.id}', 'delivered')">Mark Delivered</button>`;
    } else if (o.status === 'delivered') {
      statusColor = 'var(--color-success)';
      nextAction = `<span style="color: var(--text-muted); font-size: 0.75rem;">Completed</span>`;
    }

    const customer = window.db.getUser(o.customerId);
    const customerName = customer ? customer.username : 'Unknown Customer';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: bold; color: var(--primary-start)">
        ${o.id}<br>
        <span style="font-weight: normal; font-size: 0.75rem; color: var(--text-muted)">${customerName}</span>
      </td>
      <td>${new Date(o.date).toLocaleDateString()}</td>
      <td>$${o.totalAmount.toFixed(2)}</td>
      <td><span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}">${o.status}</span></td>
      <td>${nextAction}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteProduct = function(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    window.db.deleteProduct(id);
    renderKPIs();
    renderInventory();
  }
};

window.updateOrder = function(orderId, status) {
  window.db.updateOrderStatus(orderId, status);
  renderKPIs();
  renderOrders();
};

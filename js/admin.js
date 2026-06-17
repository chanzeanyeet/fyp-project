// js/admin.js

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = window.db.getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = '../login.html';
    return;
  }

  const navName = document.getElementById('navAdminName');
  const navAvatar = document.getElementById('navAdminAvatar');
  if(navName) navName.textContent = currentUser.username;
  if(navAvatar) navAvatar.src = currentUser.avatar;

  renderMetrics();
  renderUsers();
  renderAuditLogs();

  // Simulate Performance Metrics updates
  setInterval(() => {
    const cpu = Math.floor(Math.random() * 20) + 30; // 30-50%
    const mem = Math.floor(Math.random() * 10) + 60; // 60-70%
    const net = Math.floor(Math.random() * 40) + 10; // 10-50%

    document.getElementById('cpuVal').textContent = cpu + '%';
    document.getElementById('cpuBar').style.width = cpu + '%';

    document.getElementById('memVal').textContent = mem + '%';
    document.getElementById('memBar').style.width = mem + '%';

    document.getElementById('netVal').textContent = net + '%';
    document.getElementById('netBar').style.width = net + '%';
  }, 2000);
});

function renderMetrics() {
  const analytics = window.db.getAnalytics();
  const users = window.db.getUsers();

  document.getElementById('kpiGMV').textContent = `$${analytics.totalSales.toFixed(2)}`;
  document.getElementById('kpiUsers').textContent = users.length;
  document.getElementById('kpiLogs').textContent = analytics.activityLogs.length;
}

function renderUsers() {
  const users = window.db.getUsers();
  const tbody = document.getElementById('usersTable');
  tbody.innerHTML = '';

  users.forEach(u => {
    let roleClass = `role-${u.role}`;
    let tokens = u.role === 'customer' ? (u.loyaltyTokens || 0) : 'N/A';
    
    let actions = '';
    if (u.role !== 'admin') {
      actions = `
        <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="toggleRole(${u.id})">Toggle Role</button>
        <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: var(--color-danger); color: var(--color-danger); margin-left: 0.25rem;" onclick="deleteUser(${u.id})">Delete</button>
      `;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>
        <div style="display:flex; align-items:center; gap: 0.5rem">
          <img src="${u.avatar}" alt="avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
          <div>
            <div style="font-weight: 600">${u.username}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted)">${u.email}</div>
          </div>
        </div>
      </td>
      <td><span class="role-badge ${roleClass}">${u.role}</span></td>
      <td>${tokens}</td>
      <td>${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAuditLogs() {
  const analytics = window.db.getAnalytics();
  const container = document.getElementById('auditLogs');
  container.innerHTML = '';

  analytics.activityLogs.forEach(log => {
    const div = document.createElement('div');
    div.className = 'audit-log-item';
    div.innerHTML = `
      <div class="audit-time">${new Date(log.timestamp).toLocaleString()}</div>
      <div>${log.action}</div>
    `;
    container.appendChild(div);
  });
}

window.toggleRole = function(userId) {
  const data = window.db.read();
  const user = data.users.find(u => u.id === userId);
  
  if (user && user.role !== 'admin') {
    user.role = user.role === 'customer' ? 'seller' : 'customer';
    window.db.write(data);
    window.db.logActivity(`Changed role for user ${user.username} to ${user.role}`);
    
    renderMetrics();
    renderUsers();
    renderAuditLogs();
  }
}

window.deleteUser = function(userId) {
  if (confirm("Are you sure you want to permanently delete this user?")) {
    window.db.deleteUser(userId);
    renderMetrics();
    renderUsers();
    renderAuditLogs();
  }
}

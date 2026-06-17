// js/customer.js

let cart = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // Access Control
  currentUser = window.db.getCurrentUser();
  if (!currentUser || currentUser.role !== 'customer') {
    alert('Access Denied. Please log in as a Customer.');
    window.location.href = '../login.html';
    return;
  }

  updateTokenUI();
  renderProducts();

  // Event Listeners for Filters
  document.getElementById('searchInput').addEventListener('input', renderProducts);
  document.getElementById('categoryFilter').addEventListener('change', renderProducts);
  document.getElementById('sortFilter').addEventListener('change', renderProducts);

  // Cart Drawer
  document.getElementById('openCartBtn').addEventListener('click', () => {
    document.getElementById('cartDrawer').classList.add('open');
  });
  document.getElementById('closeCartBtn').addEventListener('click', () => {
    document.getElementById('cartDrawer').classList.remove('open');
  });

  // Checkout Modal
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    updateCheckoutUI();
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('checkoutModalOverlay').classList.add('active');
  });

  document.getElementById('closeCheckoutBtn').addEventListener('click', () => {
    document.getElementById('checkoutModalOverlay').classList.remove('active');
  });

  // Payment Method Toggle logic
  document.getElementById('paymentMethod').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'tokens') {
      document.getElementById('tokenPaymentInfo').style.display = 'block';
      document.getElementById('cashEarningInfo').style.display = 'none';
      document.getElementById('creditCardDetails').style.display = 'none';
      document.getElementById('ccToken').removeAttribute('required');
    } else {
      document.getElementById('tokenPaymentInfo').style.display = 'none';
      document.getElementById('cashEarningInfo').style.display = 'block';
      document.getElementById('creditCardDetails').style.display = 'block';
      document.getElementById('ccToken').setAttribute('required', 'true');
    }
  });

  // Handle Checkout Form Submission
  document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const address = document.getElementById('shippingAddress').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const requiredTokens = Math.floor(total * 100); // 100 tokens = $1

    // Refresh user state before tx
    currentUser = window.db.getCurrentUser();

    if (paymentMethod === 'tokens') {
      if (currentUser.loyaltyTokens < requiredTokens) {
        alert(`Insufficient tokens. You need ${requiredTokens} but only have ${currentUser.loyaltyTokens}.`);
        return;
      }
    }

    const order = {
      customerId: currentUser.id,
      items: cart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price, name: i.name })),
      totalAmount: total,
      shippingAddress: address,
      paymentMethod: paymentMethod,
    };

    if (paymentMethod === 'cash') {
      // Earn 5% back
      order.tokensEarned = Math.floor((total * 0.05) * 100); 
      order.tokensSpent = 0;
    } else {
      order.tokensEarned = 0;
      order.tokensSpent = requiredTokens;
    }

    window.db.addOrder(order);
    
    // Refresh user object and UI
    currentUser = window.db.getCurrentUser();
    updateTokenUI();

    // Clear cart
    cart = [];
    updateCartUI();
    renderProducts(); // Refresh stock
    
    document.getElementById('checkoutModalOverlay').classList.remove('active');
    alert("Order placed successfully! Track it in 'My Orders'.");
  });
});

function updateTokenUI() {
  document.getElementById('userTokenBalance').textContent = currentUser.loyaltyTokens;
}

function updateCheckoutUI() {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const requiredTokens = Math.floor(total * 100);
  const earnedTokens = Math.floor((total * 0.05) * 100);
  
  document.getElementById('requiredTokensText').textContent = requiredTokens;
  document.getElementById('earnTokensText').textContent = earnedTokens;
}

function renderProducts() {
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortFilter').value;

  let products = window.db.getProducts();

  // Filter
  products = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery) || p.description.toLowerCase().includes(searchQuery);
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  // Sort
  if (sort === 'price-low') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    products.sort((a, b) => b.price - a.price);
  } else {
    // popular (sort by rating)
    products.sort((a, b) => b.rating - a.rating);
  }

  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" class="product-image">
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <h3 class="product-title">${p.name}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">${p.description}</p>
        <div style="color: var(--color-warning); margin-bottom: 1rem; font-size: 0.9rem">
          ★ ${p.rating} | ${p.stock} in stock
        </div>
        <div class="product-price">$${p.price.toFixed(2)}</div>
        <button class="btn btn-outline" style="width: 100%" onclick="addToCart(${p.id})">
          ${p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.addToCart = function(productId) {
  const product = window.db.getProduct(productId);
  if (!product || product.stock <= 0) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    if(existingItem.quantity < product.stock) {
      existingItem.quantity += 1;
    } else {
      alert("Cannot add more than available stock.");
      return;
    }
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCartUI();
  document.getElementById('cartDrawer').classList.add('open');
}

window.removeFromCart = function(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
}

function updateCartUI() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartBadge = document.getElementById('cartBadge');

  cartItemsContainer.innerHTML = '';
  let total = 0;
  let count = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
    count += item.quantity;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div style="flex-grow: 1">
        <div style="font-weight: 600">${item.name}</div>
        <div style="color: var(--text-muted); font-size: 0.875rem">$${item.price.toFixed(2)} x ${item.quantity}</div>
      </div>
      <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 0.5rem">Remove</button>
    `;
    cartItemsContainer.appendChild(div);
  });

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  cartBadge.textContent = count;
}

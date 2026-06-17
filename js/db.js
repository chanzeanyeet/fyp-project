// ElixirTrade Mock Database Layer (db.js)

const DB_KEY = 'elixirtrade_db';
const AUTH_KEY = 'elixirtrade_auth'; // Stores current user session

const defaultData = {
  products: [
    {
      id: 1,
      name: "Nebula VR Headset",
      description: "Next-generation virtual reality with neural feedback.",
      price: 499.99,
      image: "../assets/product_1.png",
      category: "Electronics",
      stock: 45,
      sellerId: 2,
      rating: 4.8
    },
    {
      id: 2,
      name: "Quantum Mechanical Keyboard",
      description: "Tactile switches with per-key RGB neon illumination.",
      price: 149.99,
      image: "../assets/product_2.png",
      category: "Accessories",
      stock: 120,
      sellerId: 2,
      rating: 4.9
    },
    {
      id: 3,
      name: "Hyperion Smartwatch",
      description: "Holographic interface and biometric tracking.",
      price: 299.99,
      image: "../assets/product_3.png",
      category: "Wearables",
      stock: 30,
      sellerId: 2,
      rating: 4.5
    },
    {
      id: 4,
      name: "AeroGlow LED Desk Lamp",
      description: "Floating LED light with ambient color matching.",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&q=80",
      category: "Home",
      stock: 85,
      sellerId: 2,
      rating: 4.2
    },
    {
      id: 5,
      name: "Void Noise-Cancelling Headphones",
      description: "Absolute silence with high-fidelity acoustic drivers.",
      price: 249.99,
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80",
      category: "Audio",
      stock: 60,
      sellerId: 2,
      rating: 4.7
    },
    {
      id: 6,
      name: "CyberDeck Portable Console",
      description: "Play AAA games anywhere with cloud synchronization.",
      price: 399.99,
      image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=500&q=80",
      category: "Gaming",
      stock: 25,
      sellerId: 2,
      rating: 4.6
    }
  ],
  orders: [
    {
      id: "ORD-1001",
      customerId: 1,
      items: [
        { productId: 2, quantity: 1, price: 149.99, name: "Quantum Mechanical Keyboard" }
      ],
      totalAmount: 149.99,
      status: "shipped",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      shippingAddress: "123 Neon Ave, Cyber City",
      paymentMethod: "cash",
      tokensEarned: 7
    }
  ],
  users: [
    {
      id: 1,
      username: "AlexCustomer",
      email: "alex@example.com",
      password: "password123",
      role: "customer",
      loyaltyTokens: 1500, // 1500 tokens = $15.00
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
    },
    {
      id: 2,
      username: "TechNexus Seller",
      email: "sales@technexus.com",
      password: "password123",
      role: "seller",
      avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80"
    },
    {
      id: 3,
      username: "SystemAdmin",
      email: "admin@elixirtrade.com",
      password: "password123",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80"
    }
  ],
  analytics: {
    totalSales: 149.99,
    registrations: 3,
    activityLogs: [
      { id: 1, action: "System Initialized", timestamp: new Date().toISOString() },
      { id: 2, action: "New order ORD-1001 placed", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]
  }
};

class DB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
    }
  }

  read() {
    return JSON.parse(localStorage.getItem(DB_KEY));
  }

  write(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  // --- Auth / Users ---
  
  login(email, password) {
    const data = this.read();
    const user = data.users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      this.logActivity(`User logged in: ${user.username}`);
      return user;
    }
    return null;
  }

  logout() {
    localStorage.removeItem(AUTH_KEY);
  }

  getCurrentUser() {
    const session = localStorage.getItem(AUTH_KEY);
    return session ? JSON.parse(session) : null;
  }

  register(username, email, password, role) {
    const data = this.read();
    // Check if email exists
    if (data.users.find(u => u.email === email)) {
      return { success: false, message: "Email already registered." };
    }

    const newUser = {
      id: Date.now(),
      username,
      email,
      password,
      role,
      avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&q=80" // Default generic avatar
    };

    if (role === 'customer') {
      newUser.loyaltyTokens = 0;
    }

    data.users.push(newUser);
    data.analytics.registrations += 1;
    this.write(data);
    this.logActivity(`New ${role} registered: ${username}`);
    return { success: true, user: newUser };
  }

  getUsers() {
    return this.read().users;
  }

  getUser(id) {
    return this.getUsers().find(u => u.id === parseInt(id));
  }

  updateUser(updatedUser) {
    const data = this.read();
    const index = data.users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      data.users[index] = updatedUser;
      this.write(data);
      // If updating current user, refresh session
      const current = this.getCurrentUser();
      if(current && current.id === updatedUser.id) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
      }
    }
  }

  deleteUser(userId) {
    const data = this.read();
    const user = data.users.find(u => u.id === userId);
    if (user && user.role !== 'admin') {
      data.users = data.users.filter(u => u.id !== userId);
      this.write(data);
      this.logActivity(`User deleted: ${user.username}`);
    }
  }

  // --- Products ---
  getProducts() {
    return this.read().products;
  }

  getProduct(id) {
    return this.getProducts().find(p => p.id === parseInt(id));
  }

  addProduct(product) {
    const data = this.read();
    product.id = Date.now();
    data.products.push(product);
    this.write(data);
    this.logActivity(`Product added: ${product.name}`);
    return product;
  }

  updateProduct(updatedProduct) {
    const data = this.read();
    const index = data.products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      data.products[index] = updatedProduct;
      this.write(data);
    }
  }

  deleteProduct(id) {
    const data = this.read();
    data.products = data.products.filter(p => p.id !== id);
    this.write(data);
    this.logActivity(`Product deleted ID: ${id}`);
  }

  // --- Orders ---
  getOrders() {
    return this.read().orders;
  }

  getOrdersByCustomer(customerId) {
    return this.getOrders().filter(o => o.customerId === parseInt(customerId));
  }

  getOrdersBySeller(sellerId) {
    // In our simplified logic, all products belong to the seller that made them.
    // For proper relation, we check if any item in the order was sold by this seller.
    const products = this.getProducts();
    return this.getOrders().filter(order => {
      return order.items.some(item => {
        const product = products.find(p => p.id === item.productId);
        return product && product.sellerId === parseInt(sellerId);
      });
    });
  }

  addOrder(order) {
    const data = this.read();
    order.id = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    order.date = new Date().toISOString();
    order.status = 'pending';
    
    data.orders.push(order);
    
    // Update analytics
    data.analytics.totalSales += order.totalAmount;
    
    // Process Token Updates
    const userIndex = data.users.findIndex(u => u.id === order.customerId);
    if (userIndex !== -1) {
      if (order.paymentMethod === 'tokens') {
        data.users[userIndex].loyaltyTokens -= order.tokensSpent || 0;
      } else {
        data.users[userIndex].loyaltyTokens += order.tokensEarned || 0;
      }
      // Refresh session if it's the current user
      const current = this.getCurrentUser();
      if(current && current.id === order.customerId) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(data.users[userIndex]));
      }
    }

    this.write(data);
    this.logActivity(`New order placed: ${order.id} via ${order.paymentMethod}`);
    
    // Update stock
    order.items.forEach(item => {
      const product = this.getProduct(item.productId);
      if(product) {
        product.stock -= item.quantity;
        this.updateProduct(product);
      }
    });

    return order;
  }

  updateOrderStatus(orderId, status) {
    const data = this.read();
    const order = data.orders.find(o => o.id === orderId);
    if(order) {
      order.status = status;
      this.write(data);
      this.logActivity(`Order ${orderId} status changed to ${status}`);
    }
  }

  // --- Admin ---
  getAnalytics() {
    return this.read().analytics;
  }

  logActivity(action) {
    const data = this.read();
    data.analytics.activityLogs.unshift({
      id: Date.now(),
      action: action,
      timestamp: new Date().toISOString()
    });
    if(data.analytics.activityLogs.length > 50) {
      data.analytics.activityLogs.pop();
    }
    this.write(data);
  }
  
  reset() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(AUTH_KEY);
    this.init();
  }
}

// Expose a global instance
window.db = new DB();

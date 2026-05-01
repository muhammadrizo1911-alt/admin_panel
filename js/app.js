// ===== LOGIN =====
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    const errorBox = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');

    // Clear errors
    document.getElementById('usernameError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    errorBox.style.display = 'none';

    // Validation
    if (!username) {
        document.getElementById('usernameError').textContent = 'Foydalanuvchi nomini kiriting';
        return;
    }
    if (!password) {
        document.getElementById('passwordError').textContent = 'Parolni kiriting';
        return;
    }

    // Show loader
    document.getElementById('loginBtnText').style.display = 'none';
    document.getElementById('loginBtnLoader').style.display = 'inline';
    document.getElementById('loginBtn').disabled = true;

    // Simulate auth check (replace with real API call)
    setTimeout(() => {
        // Demo credentials — real app da backend/api.php?action=login ga fetch qiling
        const users = [
            { username: 'admin', password: 'admin123', name: 'Muhammadrizo', role: 'Admin' },
            { username: 'manager', password: 'manager123', name: 'Menedzher', role: 'Manager' }
        ];

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // Save session
            const session = { username: user.username, name: user.name, role: user.role };
            if (remember) {
                localStorage.setItem('minifood_session', JSON.stringify(session));
            } else {
                sessionStorage.setItem('minifood_session', JSON.stringify(session));
            }
            showMainApp(user);
        } else {
            errorText.textContent = 'Foydalanuvchi nomi yoki parol noto\'g\'ri!';
            errorBox.style.display = 'flex';
            document.getElementById('loginPassword').value = '';
        }

        // Reset button
        document.getElementById('loginBtnText').style.display = 'inline';
        document.getElementById('loginBtnLoader').style.display = 'none';
        document.getElementById('loginBtn').disabled = false;
    }, 800);
}

function showMainApp(user) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';

    // Update user info in header
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;

    initializeApp();
}

function openLogoutSheet() {
    document.getElementById('logoutOverlay').classList.add('show');
    document.getElementById('logoutSheet').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLogoutSheet() {
    document.getElementById('logoutOverlay').classList.remove('show');
    document.getElementById('logoutSheet').classList.remove('show');
    document.body.style.overflow = '';
}

function confirmLogout() {
    // BottomSheet yoping
    closeLogoutSheet();

    // Loader ko'rsating
    const loader = document.getElementById('logoutLoader');
    loader.classList.add('show');

    // 1.8 soniya loading, keyin logout
    setTimeout(() => {
        localStorage.removeItem('minifood_session');
        sessionStorage.removeItem('minifood_session');

        loader.classList.remove('show');

        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
    }, 1800);
}

function logout() {
    openLogoutSheet();
}

// ===== PAGE NAVIGATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Always start with login page visible, mainApp hidden
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';

    // Check existing session — only then skip login
    const session = localStorage.getItem('minifood_session') || sessionStorage.getItem('minifood_session');
    if (session) {
        try {
            const user = JSON.parse(session);
            if (user && user.username) {
                showMainApp(user);
            }
        } catch(e) {
            localStorage.removeItem('minifood_session');
            sessionStorage.removeItem('minifood_session');
        }
    }

    // Enter key on login form
    document.getElementById('loginPassword')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('loginUsername')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleLogin();
    });

    // Password show/hide
    document.getElementById('passwordToggle')?.addEventListener('click', function() {
        const input = document.getElementById('loginPassword');
        const icon = this.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });
});

function initializeApp() {
    // Navigation listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            navigateTo(page);
        });
    });

    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }

    // Modal functionality
    initializeModals();

    // Load initial data
    loadDashboardData();
}

function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected page
    const pageId = page + 'Page';
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    // Highlight current nav link
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'menu': 'Menu Boshqarish',
        'orders': 'Buyurtmalar',
        'customers': 'Mijozlar',
        'staff': 'Xodimlar',
        'reports': 'Hisobotlar',
        'database': 'Baza Boshqarish',
        'settings': 'Sozlamalar'
    };

    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

    // Load page-specific data
    loadPageData(page);
}

function loadPageData(page) {
    switch(page) {
        case 'menu':
            loadMenuData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'customers':
            loadCustomersData();
            break;
        case 'staff':
            loadStaffData();
            break;
        case 'reports':
            loadReportsData();
            break;
        case 'database':
            if (typeof initializeDatabase === 'function') initializeDatabase();
            break;
    }
}

// ===== DASHBOARD =====
function loadDashboardData() {
    // Fetch dashboard statistics
    fetchAPI('backend/api.php?action=getDashboardStats')
        .then(data => {
            if (data.success) {
                document.getElementById('todayOrders').textContent = data.data.today_orders;
                document.getElementById('todayRevenue').textContent = formatCurrency(data.data.today_revenue);
                document.getElementById('totalCustomers').textContent = data.data.total_customers;
                document.getElementById('activeStaff').textContent = data.data.active_staff;
            }
        })
        .catch(error => console.error('Dashboard data error:', error));

    // Fetch recent orders
    fetchAPI('backend/api.php?action=getOrders&limit=5')
        .then(data => {
            if (data.success) {
                updateRecentOrders(data.data);
            }
        })
        .catch(error => console.error('Recent orders error:', error));
}

function updateRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer_name || 'Noma\'lum'}</td>
            <td>${formatCurrency(order.final_amount)}</td>
            <td><span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></td>
            <td>${new Date(order.created_at).toLocaleTimeString('uz-UZ')}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== MENU MANAGEMENT =====
function loadMenuData() {
    fetchAPI('backend/api.php?action=getMenuItems')
        .then(data => {
            if (data.success) {
                updateMenuTable(data.data);
            }
        })
        .catch(error => console.error('Menu data error:', error));
}

function updateMenuTable(items) {
    const tbody = document.getElementById('menuTable');
    tbody.innerHTML = '';

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name_uz}</td>
            <td>${item.category_name}</td>
            <td>${formatCurrency(item.price)}</td>
            <td><span class="status-badge status-available">Mavjud</span></td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${item.is_available ? 'checked' : ''} onchange="toggleMenuItem(${item.id})">
                    <span class="slider"></span>
                </label>
            </td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-edit" onclick="editMenuItem(${item.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editMenuItem(id) {
    // Open modal for editing
    showModal('menuModal');
}

function deleteMenuItem(id) {
    if (confirm('Haqiqatdan ham bu taomni o\'chirmoqchimiz?')) {
        fetchAPI(`backend/api.php?action=deleteMenuItem&id=${id}`, 'GET')
            .then(data => {
                if (data.success) {
                    showNotification('Taom o\'chirildi', 'success');
                    loadMenuData();
                } else {
                    showNotification('Xato: ' + data.message, 'error');
                }
            });
    }
}

function toggleMenuItem(id) {
    // Update menu item availability
}

// ===== ORDERS MANAGEMENT =====
function loadOrdersData() {
    fetchAPI('backend/api.php?action=getOrders&limit=50')
        .then(data => {
            if (data.success) {
                updateOrdersTable(data.data);
            }
        })
        .catch(error => console.error('Orders data error:', error));
}

function updateOrdersTable(orders) {
    const tbody = document.getElementById('ordersTable');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer_name || 'Noma\'lum'}</td>
            <td>${order.items_count || '-'}</td>
            <td>${formatCurrency(order.final_amount)}</td>
            <td><span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></td>
            <td>${new Date(order.created_at).toLocaleTimeString('uz-UZ')}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-info" onclick="viewOrderDetails(${order.id})"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-warning" onclick="updateOrderStatus(${order.id})"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewOrderDetails(id) {
    fetchAPI(`backend/api.php?action=getOrderDetails&id=${id}`)
        .then(data => {
            if (data.success) {
                console.log('Order details:', data.data);
                // Show detailed view in modal
                showNotification('Buyurtma tafsilotlari yuklandi', 'success');
            }
        });
}

function updateOrderStatus(id) {
    const status = prompt('Yangi holat kiriting (pending/processing/completed/cancelled):');
    if (status) {
        fetchAPI(`backend/api.php?action=updateOrderStatus&id=${id}`, 'POST', {status: status})
            .then(data => {
                if (data.success) {
                    showNotification('Buyurtma holati yangilandi', 'success');
                    loadOrdersData();
                } else {
                    showNotification('Xato: ' + data.message, 'error');
                }
            });
    }
}

// ===== CUSTOMERS MANAGEMENT =====
function loadCustomersData() {
    fetchAPI('backend/api.php?action=getCustomers&limit=50')
        .then(data => {
            if (data.success) {
                updateCustomersTable(data.data);
            }
        })
        .catch(error => console.error('Customers data error:', error));
}

function updateCustomersTable(customers) {
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = '';

    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.orders_count || '0'}</td>
            <td>${formatCurrency(customer.total_spending || 0)}</td>
            <td>${new Date(customer.created_at).toLocaleDateString('uz-UZ')}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-info" onclick="viewCustomerDetails(${customer.id})"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-edit" onclick="editCustomer(${customer.id})"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewCustomerDetails(id) {
    fetchAPI(`backend/api.php?action=getCustomerDetails&id=${id}`)
        .then(data => {
            if (data.success) {
                console.log('Customer details:', data.data);
                showNotification('Mijoz tafsilotlari yuklandi', 'success');
            }
        });
}

// ===== STAFF MANAGEMENT =====
function loadStaffData() {
    fetchAPI('backend/api.php?action=getStaff')
        .then(data => {
            if (data.success) {
                console.log('Staff data:', data.data);
            }
        })
        .catch(error => console.error('Staff data error:', error));
}

// ===== REPORTS =====
function loadReportsData() {
    // Load daily report for today
    const today = new Date().toISOString().split('T')[0];
    fetchAPI(`backend/api.php?action=getDailyReport&date=${today}`)
        .then(data => {
            if (data.success) {
                console.log('Report data:', data.data);
            }
        });
}

// ===== MODALS =====
function initializeModals() {
    const addMenuBtn = document.getElementById('addMenuBtn');
    if (addMenuBtn) {
        addMenuBtn.addEventListener('click', () => showModal('menuModal'));
    }

    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.classList.remove('show');
        });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });

    // Form submission
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitMenuForm();
        });
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function submitMenuForm() {
    const form = document.getElementById('menuForm');
    const formData = new FormData(form);
    
    const data = {
        name_uz: formData.get('name_uz') || '',
        name_ru: formData.get('name_ru') || '',
        name_en: formData.get('name_en') || '',
        category_id: formData.get('category_id') || 1,
        price: parseFloat(formData.get('price')) || 0,
        cost: parseFloat(formData.get('cost')) || 0,
        description_uz: formData.get('description_uz') || '',
        is_available: 1
    };

    fetchAPI('backend/api.php?action=addMenuItem', 'POST', data)
        .then(response => {
            if (response.success) {
                showNotification('Taom qo\'shildi', 'success');
                hideModal('menuModal');
                form.reset();
                loadMenuData();
            } else {
                showNotification('Xato: ' + response.message, 'error');
            }
        });
}

// ===== UTILITY FUNCTIONS =====
function fetchAPI(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
    }

    return fetch(url, options)
        .then(response => response.json())
        .catch(error => {
            console.error('API Error:', error);
            return {success: false, message: 'Server bilan bog\'lanish xatosi'};
        });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Kutilmoqda',
        'processing': 'Tayyorlanmoqda',
        'completed': 'Tayyorlandi',
        'cancelled': 'Bekor qilindi'
    };
    return labels[status] || status;
}

function showNotification(message, type = 'info') {
    // Simple notification - you can enhance this with a proper notification library
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        border-radius: 6px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


// ===== DATABASE MANAGEMENT =====

// Initialize database page
function initializeDatabase() {
    loadDatabaseStats();
    loadTables();
    initializeDatabaseTabs();
    initializeDatabaseButtons();
}

// ===== DATABASE STATS =====
function loadDatabaseStats() {
    fetch('backend/database.php?action=getStats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('dbSize').textContent = data.data.db_size;
                document.getElementById('tableCount').textContent = data.data.table_count;
                document.getElementById('totalRows').textContent = data.data.total_rows;
                document.getElementById('lastBackup').textContent = data.data.last_backup || 'Hech qachon';
            }
        })
        .catch(error => console.error('Database stats error:', error));
}

// ===== TABLES MANAGEMENT =====
function loadTables() {
    fetch('backend/database.php?action=getTables')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTables(data.data);
            }
        })
        .catch(error => console.error('Load tables error:', error));
}

function displayTables(tables) {
    const grid = document.getElementById('tablesGrid');
    grid.innerHTML = '';

    tables.forEach(table => {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
        ];

        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const card = document.createElement('div');
        card.className = 'table-card';
        card.style.background = randomColor;
        card.innerHTML = `
            <div class="table-card-content">
                <div class="table-card-name"><i class="fas fa-database"></i> ${table.name}</div>
                <div class="table-card-info">
                    <span><strong>Satrlar:</strong> ${table.rows}</span>
                    <span><strong>Hajmi:</strong> ${table.size}</span>
                    <span><strong>Kalit:</strong> ${table.primary_key || '-'}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => viewTableDetails(table.name));
        grid.appendChild(card);
    });
}

function viewTableDetails(tableName) {
    fetch(`backend/database.php?action=getTableDetails&table=${tableName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const details = data.data;
                
                document.getElementById('tableName').textContent = tableName;
                document.getElementById('detailTableName').textContent = details.name;
                document.getElementById('detailRowCount').textContent = details.rows;
                document.getElementById('detailTableSize').textContent = details.size;
                document.getElementById('detailEngine').textContent = details.engine;
                document.getElementById('detailCollation').textContent = details.collation;

                // Display columns
                const columnsBody = document.getElementById('columnsTable');
                columnsBody.innerHTML = '';
                
                details.columns.forEach(col => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${col.name}</td>
                        <td>${col.type}</td>
                        <td>${col.null === 'YES' ? 'Ha' : 'Yo\'q'}</td>
                        <td>${col.key || '-'}</td>
                        <td>${col.default || '-'}</td>
                        <td class="action-buttons">
                            <button class="btn btn-sm btn-warning" onclick="editColumn('${tableName}', '${col.name}')"><i class="fas fa-edit"></i></button>
                        </td>
                    `;
                    columnsBody.appendChild(row);
                });

                // Display indexes
                const indexesBody = document.getElementById('indexesTable');
                indexesBody.innerHTML = '';
                
                details.indexes.forEach(idx => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${idx.name}</td>
                        <td>${idx.column}</td>
                        <td>${idx.type}</td>
                        <td>${idx.unique === '0' ? 'Yo\'q' : 'Ha'}</td>
                    `;
                    indexesBody.appendChild(row);
                });

                showModal('tableDetailsModal');
            }
        })
        .catch(error => console.error('Table details error:', error));
}

// ===== SQL QUERY EXECUTOR =====
function executeSql() {
    const query = document.getElementById('sqlQuery').value.trim();
    
    if (!query) {
        showNotification('SQL so\'rovni kiriting', 'warning');
        return;
    }

    fetch('backend/database.php?action=executeSql', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({query: query})
    })
    .then(response => response.json())
    .then(data => {
        const resultsDiv = document.getElementById('queryResults');
        
        if (data.success) {
            if (data.data.type === 'select') {
                let html = '<table class="table"><thead><tr>';
                
                data.data.columns.forEach(col => {
                    html += `<th>${col}</th>`;
                });
                
                html += '</tr></thead><tbody>';
                
                data.data.rows.forEach(row => {
                    html += '<tr>';
                    Object.values(row).forEach(val => {
                        html += `<td>${val}</td>`;
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                resultsDiv.innerHTML = html;
            } else {
                resultsDiv.innerHTML = `<div class="success-message">✓ So\'rov muvaffaqiyatli bajarildi. Qatorlar ta\'siri: ${data.data.affected_rows}</div>`;
            }
        } else {
            resultsDiv.innerHTML = `<div class="error-message">✗ Xato: ${data.message}</div>`;
        }
    })
    .catch(error => {
        document.getElementById('queryResults').innerHTML = `<div class="error-message">✗ Xato: ${error.message}</div>`;
    });
}

// ===== BACKUP & RESTORE =====
function createBackup() {
    const backupName = document.getElementById('backupName').value || `backup_${new Date().toISOString().slice(0, 10)}`;
    const includeData = document.getElementById('includeData').checked;

    fetch('backend/database.php?action=createBackup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            backup_name: backupName,
            include_data: includeData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Zaxira nusxasi muvaffaqiyatli yaratildi', 'success');
            document.getElementById('backupName').value = '';
            loadBackups();
        } else {
            showNotification('Xato: ' + data.message, 'error');
        }
    });
}

function loadBackups() {
    fetch('backend/database.php?action=getBackups')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayBackups(data.data);
            }
        });
}

function displayBackups(backups) {
    const tbody = document.getElementById('backupsTable');
    tbody.innerHTML = '';

    backups.forEach(backup => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${backup.name}</td>
            <td>${backup.size}</td>
            <td>${backup.date}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-info" onclick="downloadBackup('${backup.name}')"><i class="fas fa-download"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteBackup('${backup.name}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function downloadBackup(name) {
    window.location.href = `backend/database.php?action=downloadBackup&name=${encodeURIComponent(name)}`;
}

function deleteBackup(name) {
    if (confirm(`"${name}" zaxirasini o'chirmoqchimiz?`)) {
        fetch('backend/database.php?action=deleteBackup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({backup_name: name})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Zaxira o\'chirildi', 'success');
                loadBackups();
            }
        });
    }
}

// ===== MAINTENANCE =====
function checkTables() {
    fetch('backend/database.php?action=checkTables')
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('checkResults');
            resultsDiv.style.display = 'block';
            
            if (data.success) {
                let html = '<h4>Tekshirish Natijalari:</h4><ul>';
                data.data.forEach(result => {
                    html += `<li><strong>${result.table}</strong>: ${result.status}</li>`;
                });
                html += '</ul>';
                resultsDiv.innerHTML = html;
                showNotification('Tekshirish yakunlandi', 'success');
            }
        });
}

function optimizeTables() {
    fetch('backend/database.php?action=optimizeTables')
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('optimizeResults');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `<p>Jadvallar optimallashtirish jarayoni: ${data.data.message}</p>`;
            showNotification('Optimallashtirish yakunlandi', 'success');
        });
}

function repairTables() {
    fetch('backend/database.php?action=repairTables')
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('repairResults');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `<p>Jadvallar ta\'miri: ${data.data.message}</p>`;
            showNotification('Ta\'mir yakunlandi', 'success');
        });
}

function truncateTables() {
    fetch('backend/database.php?action=truncateTables', {method: 'POST'})
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Barcha jadvallar tozalandi', 'success');
            }
        });
}

// ===== TAB SWITCHING =====
function initializeDatabaseTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
        });
    });
}

// ===== BUTTON HANDLERS =====
function initializeDatabaseButtons() {
    document.getElementById('backupDbBtn')?.addEventListener('click', () => {
        showModal('tabBackup');
    });

    document.getElementById('executeSqlBtn')?.addEventListener('click', executeSql);
    document.getElementById('clearSqlBtn')?.addEventListener('click', () => {
        document.getElementById('sqlQuery').value = '';
        document.getElementById('queryResults').innerHTML = '';
    });

    document.getElementById('createBackupBtn')?.addEventListener('click', createBackup);
    document.getElementById('checkTablesBtn')?.addEventListener('click', checkTables);
    document.getElementById('optimizeTablesBtn')?.addEventListener('click', optimizeTables);
    document.getElementById('repairTablesBtn')?.addEventListener('click', repairTables);

    loadBackups();
}

// Load database page on navigation
document.addEventListener('pageNavigate', function(e) {
    if (e.detail.page === 'database') {
        initializeDatabase();
    }
});
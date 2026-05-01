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
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="backup"]')?.classList.add('active');
        document.getElementById('tabBackup')?.classList.add('active');
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
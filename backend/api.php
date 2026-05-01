<?php
/**
 * Mini Food Admin Panel - Database Management API
 * Barcha database amallarini boshqaradi:
 * getStats, getTables, getTableDetails, executeSql,
 * createBackup, getBackups, downloadBackup, deleteBackup,
 * checkTables, optimizeTables, repairTables, truncateTables,
 * getTableData, addRow, updateRow, deleteRow
 */

// CORS va content-type headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';

// ===== RESPONSE HELPER =====
function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data'    => $data,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ===== DB CONNECTION =====
function getDB() {
    static $db = null;
    if ($db === null) {
        $db = new Database();
    }
    return $db->getConnection();
}

// ===== ACTION ROUTER =====
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// POST body (JSON)
$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $input = json_decode($raw, true) ?? [];
    }
}

try {
    switch ($action) {
        // ---------- STATS ----------
        case 'getStats':
            getStats();
            break;

        // ---------- TABLES ----------
        case 'getTables':
            getTables();
            break;

        case 'getTableDetails':
            $table = $_GET['table'] ?? '';
            getTableDetails($table);
            break;

        case 'getTableData':
            $table  = $_GET['table']  ?? '';
            $page   = (int)($_GET['page']  ?? 1);
            $limit  = (int)($_GET['limit'] ?? 20);
            getTableData($table, $page, $limit);
            break;

        // ---------- ROW CRUD ----------
        case 'addRow':
            $table = $input['table'] ?? '';
            $row   = $input['row']   ?? [];
            addRow($table, $row);
            break;

        case 'updateRow':
            $table    = $input['table']    ?? '';
            $pk       = $input['pk']       ?? 'id';
            $pkValue  = $input['pk_value'] ?? '';
            $data     = $input['data']     ?? [];
            updateRow($table, $pk, $pkValue, $data);
            break;

        case 'deleteRow':
            $table   = $input['table']    ?? '';
            $pk      = $input['pk']       ?? 'id';
            $pkValue = $input['pk_value'] ?? '';
            deleteRow($table, $pk, $pkValue);
            break;

        // ---------- SQL EXECUTOR ----------
        case 'executeSql':
            $query = $input['query'] ?? '';
            executeSql($query);
            break;

        // ---------- BACKUP ----------
        case 'createBackup':
            $name        = $input['backup_name'] ?? 'backup_' . date('Y-m-d');
            $includeData = $input['include_data'] ?? true;
            createBackup($name, $includeData);
            break;

        case 'getBackups':
            getBackups();
            break;

        case 'downloadBackup':
            $name = $_GET['name'] ?? '';
            downloadBackup($name);
            break;

        case 'deleteBackup':
            $name = $input['backup_name'] ?? '';
            deleteBackupFile($name);
            break;

        // ---------- MAINTENANCE ----------
        case 'checkTables':
            checkTables();
            break;

        case 'optimizeTables':
            optimizeTables();
            break;

        case 'repairTables':
            repairTables();
            break;

        case 'truncateTables':
            truncateTables();
            break;

        default:
            sendResponse(false, null, "Noma'lum amal: $action");
    }
} catch (Exception $e) {
    sendResponse(false, null, $e->getMessage());
}

// ===================================================
// FUNCTION DEFINITIONS
// ===================================================

// ---------- STATS ----------
function getStats() {
    $conn = getDB();

    // DB hajmi
    $dbName = DB_NAME;
    $sizeRes = $conn->query("
        SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables
        WHERE table_schema = '$dbName'
    ");
    $size = $sizeRes ? $sizeRes->fetch_assoc()['size_mb'] : 0;

    // Jadvallar soni
    $countRes = $conn->query("
        SELECT COUNT(*) AS cnt
        FROM information_schema.tables
        WHERE table_schema = '$dbName'
    ");
    $tableCount = $countRes ? $countRes->fetch_assoc()['cnt'] : 0;

    // Jami qatorlar
    $rowsRes = $conn->query("
        SELECT SUM(table_rows) AS total
        FROM information_schema.tables
        WHERE table_schema = '$dbName'
    ");
    $totalRows = $rowsRes ? $rowsRes->fetch_assoc()['total'] : 0;

    // Oxirgi backup
    $backupDir = __DIR__ . '/backups';
    $lastBackup = 'Hech qachon';
    if (is_dir($backupDir)) {
        $files = glob($backupDir . '/*.sql');
        if ($files) {
            usort($files, fn($a,$b) => filemtime($b) - filemtime($a));
            $lastBackup = date('d.m.Y H:i', filemtime($files[0]));
        }
    }

    sendResponse(true, [
        'db_size'     => $size . ' MB',
        'table_count' => (int)$tableCount,
        'total_rows'  => (int)$totalRows,
        'last_backup' => $lastBackup
    ]);
}

// ---------- TABLES LIST ----------
function getTables() {
    $conn   = getDB();
    $dbName = DB_NAME;

    $res = $conn->query("
        SELECT
            table_name        AS name,
            table_rows        AS rows,
            ROUND((data_length + index_length)/1024, 1) AS size_kb,
            (
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema='$dbName'
                  AND table_name=t.table_name
                  AND column_key='PRI'
                LIMIT 1
            ) AS primary_key
        FROM information_schema.tables t
        WHERE table_schema = '$dbName'
        ORDER BY table_name
    ");

    $tables = [];
    while ($row = $res->fetch_assoc()) {
        $tables[] = [
            'name'        => $row['name'],
            'rows'        => (int)$row['rows'],
            'size'        => $row['size_kb'] . ' KB',
            'primary_key' => $row['primary_key']
        ];
    }

    sendResponse(true, $tables);
}

// ---------- TABLE DETAILS ----------
function getTableDetails($tableName) {
    if (!validTableName($tableName)) {
        sendResponse(false, null, 'Noto\'g\'ri jadval nomi');
    }

    $conn   = getDB();
    $dbName = DB_NAME;

    // Basic info
    $infoRes = $conn->query("
        SELECT table_name, table_rows, engine, table_collation,
               ROUND((data_length+index_length)/1024,1) AS size_kb
        FROM information_schema.tables
        WHERE table_schema='$dbName' AND table_name='$tableName'
    ");
    $info = $infoRes ? $infoRes->fetch_assoc() : [];

    // Columns
    $colRes = $conn->query("
        SELECT column_name AS name, column_type AS type,
               is_nullable AS `null`, column_key AS `key`,
               column_default AS `default`, extra
        FROM information_schema.columns
        WHERE table_schema='$dbName' AND table_name='$tableName'
        ORDER BY ordinal_position
    ");
    $columns = [];
    while ($col = $colRes->fetch_assoc()) {
        $columns[] = $col;
    }

    // Indexes
    $idxRes = $conn->query("SHOW INDEX FROM `$tableName`");
    $indexes = [];
    while ($idx = $idxRes->fetch_assoc()) {
        $indexes[] = [
            'name'   => $idx['Key_name'],
            'column' => $idx['Column_name'],
            'type'   => $idx['Index_type'],
            'unique' => $idx['Non_unique']
        ];
    }

    sendResponse(true, [
        'name'      => $info['table_name'] ?? $tableName,
        'rows'      => (int)($info['table_rows'] ?? 0),
        'size'      => ($info['size_kb'] ?? 0) . ' KB',
        'engine'    => $info['engine'] ?? '-',
        'collation' => $info['table_collation'] ?? '-',
        'columns'   => $columns,
        'indexes'   => $indexes
    ]);
}

// ---------- TABLE DATA (pagination) ----------
function getTableData($tableName, $page = 1, $limit = 20) {
    if (!validTableName($tableName)) {
        sendResponse(false, null, 'Noto\'g\'ri jadval nomi');
    }

    $conn   = getDB();
    $offset = ($page - 1) * $limit;

    // Total rows
    $countRes = $conn->query("SELECT COUNT(*) AS cnt FROM `$tableName`");
    $total    = $countRes ? (int)$countRes->fetch_assoc()['cnt'] : 0;

    // Rows
    $res  = $conn->query("SELECT * FROM `$tableName` LIMIT $limit OFFSET $offset");
    $rows = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $rows[] = $row;
        }
    }

    // Column names
    $columns = $rows ? array_keys($rows[0]) : [];

    sendResponse(true, [
        'columns'    => $columns,
        'rows'       => $rows,
        'total'      => $total,
        'page'       => $page,
        'total_pages'=> ceil($total / $limit)
    ]);
}

// ---------- ADD ROW ----------
function addRow($tableName, $rowData) {
    if (!validTableName($tableName) || empty($rowData)) {
        sendResponse(false, null, 'Ma\'lumotlar noto\'g\'ri');
    }

    $conn    = getDB();
    $columns = implode('`, `', array_keys($rowData));
    $values  = implode(', ', array_fill(0, count($rowData), '?'));
    $types   = str_repeat('s', count($rowData));

    $stmt = $conn->prepare("INSERT INTO `$tableName` (`$columns`) VALUES ($values)");
    if (!$stmt) {
        sendResponse(false, null, $conn->error);
    }

    $vals = array_values($rowData);
    $stmt->bind_param($types, ...$vals);

    if ($stmt->execute()) {
        sendResponse(true, ['insert_id' => $conn->insert_id], 'Qator qo\'shildi');
    } else {
        sendResponse(false, null, $stmt->error);
    }
}

// ---------- UPDATE ROW ----------
function updateRow($tableName, $pk, $pkValue, $data) {
    if (!validTableName($tableName) || empty($data)) {
        sendResponse(false, null, 'Ma\'lumotlar noto\'g\'ri');
    }

    $conn = getDB();
    $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($data)));
    $types = str_repeat('s', count($data)) . 's';
    $vals  = array_values($data);
    $vals[]= $pkValue;

    $stmt = $conn->prepare("UPDATE `$tableName` SET $sets WHERE `$pk` = ?");
    if (!$stmt) {
        sendResponse(false, null, $conn->error);
    }

    $stmt->bind_param($types, ...$vals);

    if ($stmt->execute()) {
        sendResponse(true, ['affected' => $stmt->affected_rows], 'Yangilandi');
    } else {
        sendResponse(false, null, $stmt->error);
    }
}

// ---------- DELETE ROW ----------
function deleteRow($tableName, $pk, $pkValue) {
    if (!validTableName($tableName)) {
        sendResponse(false, null, 'Noto\'g\'ri jadval nomi');
    }

    $conn = getDB();
    $stmt = $conn->prepare("DELETE FROM `$tableName` WHERE `$pk` = ?");
    if (!$stmt) {
        sendResponse(false, null, $conn->error);
    }

    $stmt->bind_param('s', $pkValue);

    if ($stmt->execute()) {
        sendResponse(true, ['affected' => $stmt->affected_rows], 'O\'chirildi');
    } else {
        sendResponse(false, null, $stmt->error);
    }
}

// ---------- SQL EXECUTOR ----------
function executeSql($query) {
    if (empty(trim($query))) {
        sendResponse(false, null, 'So\'rov bo\'sh');
    }

    $conn     = getDB();
    $queryUC  = strtoupper(ltrim($query));
    $isSelect = str_starts_with($queryUC, 'SELECT') || str_starts_with($queryUC, 'SHOW') || str_starts_with($queryUC, 'DESCRIBE');

    $res = $conn->query($query);

    if ($res === false) {
        sendResponse(false, null, $conn->error);
    }

    if ($isSelect && $res !== true) {
        $rows    = [];
        $columns = [];
        if ($res->num_rows > 0) {
            $first = $res->fetch_assoc();
            $columns = array_keys($first);
            $rows[] = $first;
            while ($row = $res->fetch_assoc()) {
                $rows[] = $row;
            }
        }
        sendResponse(true, [
            'type'    => 'select',
            'columns' => $columns,
            'rows'    => $rows,
            'count'   => count($rows)
        ]);
    } else {
        sendResponse(true, [
            'type'          => 'modify',
            'affected_rows' => $conn->affected_rows
        ]);
    }
}

// ---------- CREATE BACKUP ----------
function createBackup($name, $includeData = true) {
    $conn    = getDB();
    $dbName  = DB_NAME;
    $backupDir = __DIR__ . '/backups';

    if (!is_dir($backupDir)) {
        if (!mkdir($backupDir, 0755, true)) {
            sendResponse(false, null, 'Backup papkasini yaratib bo\'lmadi');
        }
    }

    // Sanitize filename
    $safeName  = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $name);
    $timestamp = date('Ymd_His');
    $filename  = "{$safeName}_{$timestamp}.sql";
    $filepath  = $backupDir . '/' . $filename;

    $sql = "-- Mini Food DB Backup\n-- Date: " . date('Y-m-d H:i:s') . "\n-- Database: $dbName\n\n";
    $sql .= "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n";

    // Get all tables
    $tables = [];
    $res = $conn->query("SHOW TABLES");
    while ($row = $res->fetch_row()) {
        $tables[] = $row[0];
    }

    foreach ($tables as $table) {
        // CREATE TABLE
        $createRes = $conn->query("SHOW CREATE TABLE `$table`");
        $createRow = $createRes->fetch_assoc();
        $sql .= "DROP TABLE IF EXISTS `$table`;\n";
        $sql .= $createRow['Create Table'] . ";\n\n";

        // INSERT DATA
        if ($includeData) {
            $dataRes = $conn->query("SELECT * FROM `$table`");
            if ($dataRes && $dataRes->num_rows > 0) {
                $sql .= "INSERT INTO `$table` VALUES\n";
                $rows = [];
                while ($row = $dataRes->fetch_row()) {
                    $vals = array_map(fn($v) => $v === null ? 'NULL' : "'" . $conn->real_escape_string($v) . "'", $row);
                    $rows[] = '(' . implode(', ', $vals) . ')';
                }
                $sql .= implode(",\n", $rows) . ";\n\n";
            }
        }
    }

    $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

    if (file_put_contents($filepath, $sql) === false) {
        sendResponse(false, null, 'Faylga yozib bo\'lmadi');
    }

    // Update last backup time marker
    file_put_contents($backupDir . '/.last_backup', date('Y-m-d H:i:s'));

    sendResponse(true, ['filename' => $filename], 'Backup yaratildi');
}

// ---------- GET BACKUPS ----------
function getBackups() {
    $backupDir = __DIR__ . '/backups';
    $backups   = [];

    if (is_dir($backupDir)) {
        $files = glob($backupDir . '/*.sql');
        if ($files) {
            usort($files, fn($a,$b) => filemtime($b) - filemtime($a));
            foreach ($files as $file) {
                $backups[] = [
                    'name' => basename($file),
                    'size' => round(filesize($file) / 1024, 1) . ' KB',
                    'date' => date('d.m.Y H:i', filemtime($file))
                ];
            }
        }
    }

    sendResponse(true, $backups);
}

// ---------- DOWNLOAD BACKUP ----------
function downloadBackup($name) {
    $safeName  = basename($name);
    $backupDir = __DIR__ . '/backups';
    $filepath  = $backupDir . '/' . $safeName;

    if (!file_exists($filepath) || !str_ends_with($safeName, '.sql')) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Fayl topilmadi']);
        exit;
    }

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $safeName . '"');
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);
    exit;
}

// ---------- DELETE BACKUP FILE ----------
function deleteBackupFile($name) {
    $safeName  = basename($name);
    $backupDir = __DIR__ . '/backups';
    $filepath  = $backupDir . '/' . $safeName;

    if (!file_exists($filepath)) {
        sendResponse(false, null, 'Fayl topilmadi');
    }

    if (unlink($filepath)) {
        sendResponse(true, null, 'Backup o\'chirildi');
    } else {
        sendResponse(false, null, 'O\'chirishda xato');
    }
}

// ---------- CHECK TABLES ----------
function checkTables() {
    $conn    = getDB();
    $results = [];

    $tables = [];
    $res = $conn->query("SHOW TABLES");
    while ($row = $res->fetch_row()) {
        $tables[] = $row[0];
    }

    foreach ($tables as $table) {
        $checkRes = $conn->query("CHECK TABLE `$table`");
        $row      = $checkRes->fetch_assoc();
        $results[] = [
            'table'  => $table,
            'status' => $row['Msg_text'] ?? 'OK'
        ];
    }

    sendResponse(true, $results);
}

// ---------- OPTIMIZE TABLES ----------
function optimizeTables() {
    $conn   = getDB();
    $tables = [];
    $res    = $conn->query("SHOW TABLES");
    while ($row = $res->fetch_row()) {
        $tables[] = "`{$row[0]}`";
    }

    if (!empty($tables)) {
        $conn->query("OPTIMIZE TABLE " . implode(', ', $tables));
    }

    sendResponse(true, ['message' => 'Barcha jadvallar optimallashtildi']);
}

// ---------- REPAIR TABLES ----------
function repairTables() {
    $conn   = getDB();
    $tables = [];
    $res    = $conn->query("SHOW TABLES");
    while ($row = $res->fetch_row()) {
        $tables[] = "`{$row[0]}`";
    }

    if (!empty($tables)) {
        $conn->query("REPAIR TABLE " . implode(', ', $tables));
    }

    sendResponse(true, ['message' => 'Barcha jadvallar ta\'mirlandi']);
}

// ---------- TRUNCATE TABLES ----------
function truncateTables() {
    $conn = getDB();
    $conn->query("SET FOREIGN_KEY_CHECKS=0");

    $res = $conn->query("SHOW TABLES");
    while ($row = $res->fetch_row()) {
        $conn->query("TRUNCATE TABLE `{$row[0]}`");
    }

    $conn->query("SET FOREIGN_KEY_CHECKS=1");

    sendResponse(true, null, 'Barcha jadvallar tozalandi');
}

// ---------- SECURITY HELPER ----------
function validTableName($name) {
    return preg_match('/^[a-zA-Z0-9_]+$/', $name);
}
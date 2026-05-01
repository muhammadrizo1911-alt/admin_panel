<?php
/**
 * Mini Food Admin Panel - Configuration
 */

// Database Configuration
define('DB_HOST', 'mysql.railway.internal');
define('DB_USER', 'root');
define('DB_PASSWORD', 'mSIhodLUJunQtUGIdcYgNLsNTJTSGxvK');
define('DB_NAME', 'mini_food');
define('DB_PORT', 3306);

// App Configuration
define('APP_NAME', 'Mini Food Admin Panel');
define('APP_OWNER', 'Muxtorv Muhammadrizo');
define('TIMEZONE', 'Asia/Tashkent');

// Set timezone
date_default_timezone_set(TIMEZONE);

// Database Class
class Database {
    private $connection;
    
    public function __construct() {
        $this->connection = new mysqli(
            DB_HOST,
            DB_USER,
            DB_PASSWORD,
            DB_NAME,
            DB_PORT
        );
        
        if ($this->connection->connect_error) {
            // JSON formatida xato qaytarish (die() emas)
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => false,
                'data'    => null,
                'message' => 'Database ulanish xatosi: ' . $this->connection->connect_error
                           . '. Iltimos config.php da DB_HOST, DB_USER, DB_PASSWORD, DB_NAME ni tekshiring.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $this->connection->set_charset('utf8mb4');
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function executeQuery($sql) {
        return $this->connection->query($sql);
    }
    
    public function prepareStatement($sql) {
        return $this->connection->prepare($sql);
    }
    
    public function escape($string) {
        return $this->connection->real_escape_string($string);
    }
    
    public function closeConnection() {
        if ($this->connection) {
            $this->connection->close();
        }
    }
}

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

?>
